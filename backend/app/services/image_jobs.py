"""Image job queue service

Simple on-disk persistence for image processing jobs (e.g. compose-strip).
Inspired by PrintQueueService but scoped to image operations.
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

from app.config import DATA_DIR


class ImageJobRecord:
    def __init__(
        self,
        job_type: str,
        payload: Dict[str, Any],
        status: str = "pending",
        result: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None,
        job_id: Optional[str] = None,
        created_at: Optional[str] = None,
        updated_at: Optional[str] = None,
    ) -> None:
        self.job_id = job_id or str(uuid.uuid4())
        self.job_type = job_type
        self.payload = payload
        self.status = status
        self.result = result
        self.error = error
        self.created_at = created_at or datetime.now().isoformat()
        self.updated_at = updated_at or self.created_at

    def to_dict(self) -> Dict[str, Any]:
        return {
            "job_id": self.job_id,
            "job_type": self.job_type,
            "payload": self.payload,
            "status": self.status,
            "result": self.result,
            "error": self.error,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    @staticmethod
    def from_dict(data: Dict[str, Any]) -> "ImageJobRecord":
        return ImageJobRecord(
            job_type=data["job_type"],
            payload=data.get("payload", {}),
            status=data.get("status", "pending"),
            result=data.get("result"),
            error=data.get("error"),
            job_id=data.get("job_id"),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
        )


class ImageJobQueueService:
    DB_FILE: Path = DATA_DIR / "config" / "image_jobs.json"
    MAX_JOBS = 200
    CLEANUP_DAYS = 7
    _worker_started = False

    @classmethod
    def _load(cls) -> Dict[str, ImageJobRecord]:
        if not cls.DB_FILE.exists():
            return {}
        try:
            with cls.DB_FILE.open("r", encoding="utf-8") as file:
                raw = json.load(file)
            return {job_id: ImageJobRecord.from_dict(record) for job_id, record in raw.items()}
        except Exception as exc:
            print(f"Error leyendo image_jobs.json: {exc}")
            return {}

    @classmethod
    def _save(cls, jobs: Dict[str, ImageJobRecord]) -> None:
        cls.DB_FILE.parent.mkdir(parents=True, exist_ok=True)
        payload = {job_id: record.to_dict() for job_id, record in jobs.items()}
        with cls.DB_FILE.open("w", encoding="utf-8") as file:
            json.dump(payload, file, indent=2, ensure_ascii=False)

    @classmethod
    def add_compose_job(cls, payload: Dict[str, Any]) -> ImageJobRecord:
        jobs = cls._load()
        job = ImageJobRecord(job_type="compose-strip", payload=payload, status="pending")
        jobs[job.job_id] = job

        # Mantener tamaño acotado desde la creación
        jobs = cls._bounded_jobs(jobs)

        cls._save(jobs)
        return job

    @classmethod
    def get_job(cls, job_id: str) -> Optional[ImageJobRecord]:
        jobs = cls._load()
        return jobs.get(job_id)

    @classmethod
    def update_status(
        cls,
        job_id: str,
        status: str,
        result: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None,
    ) -> Optional[ImageJobRecord]:
        jobs = cls._load()
        job = jobs.get(job_id)
        if not job:
            return None
        job.status = status
        job.result = result
        job.error = error
        job.updated_at = datetime.now().isoformat()

        # Aplicar límites al guardar
        jobs = cls._bounded_jobs(jobs)

        cls._save(jobs)
        return job

    @classmethod
    def _bounded_jobs(cls, jobs: Dict[str, ImageJobRecord]) -> Dict[str, ImageJobRecord]:
        """Aplica límites de edad y tamaño a la colección de jobs."""
        if not jobs:
            return jobs

        # Filtrar por antigüedad
        from datetime import datetime as _dt

        cutoff_ts = _dt.now().timestamp() - (cls.CLEANUP_DAYS * 24 * 3600)
        filtered: Dict[str, ImageJobRecord] = {}
        for job_id, record in jobs.items():
            try:
                created_ts = _dt.fromisoformat(record.created_at).timestamp()
                if created_ts >= cutoff_ts:
                    filtered[job_id] = record
            except Exception:
                # Si no se puede parsear, conservar para evitar pérdida accidental
                filtered[job_id] = record

        # Truncar a MAX_JOBS, manteniendo los más recientes
        sorted_jobs = sorted(filtered.values(), key=lambda j: j.created_at, reverse=True)[: cls.MAX_JOBS]
        return {job.job_id: job for job in sorted_jobs}

    @classmethod
    def cleanup_old_jobs(cls) -> None:
        """Limpia jobs antiguos y mantiene el archivo ligero."""
        jobs = cls._load()
        if not jobs:
            return
        bounded = cls._bounded_jobs(jobs)
        cls._save(bounded)

    @classmethod
    def process_pending_jobs(cls) -> None:
        """Procesa un job pending si existe, actualizando su estado."""
        jobs = cls._load()
        if not jobs:
            return

        pending = [job for job in jobs.values() if job.status == "pending"]
        if not pending:
            return

        pending.sort(key=lambda j: j.created_at)
        job = pending[0]

        job.status = "processing"
        job.updated_at = datetime.now().isoformat()
        jobs[job.job_id] = job
        jobs = cls._bounded_jobs(jobs)
        cls._save(jobs)

        # Ejecutar composición con la misma lógica que el endpoint
        from app.api.image import ComposeStripRequest, _compose_strip_core  # lazy import to avoid cycles
        try:
            request_model = ComposeStripRequest(**job.payload)
        except Exception as exc:
            job.status = "failed"
            job.error = f"Payload inválido: {exc}"
            job.updated_at = datetime.now().isoformat()
            jobs[job.job_id] = job
            cls._save(cls._bounded_jobs(jobs))
            return

        try:
            result = _compose_strip_core(request_model)
            job.status = "completed"
            job.result = result.model_dump()
            job.error = None
        except Exception as exc:
            job.status = "failed"
            job.error = str(exc)
        finally:
            job.updated_at = datetime.now().isoformat()
            jobs[job.job_id] = job
            cls._save(cls._bounded_jobs(jobs))

    @classmethod
    def start_worker(cls, interval_seconds: int = 1) -> None:
        """Lanza un hilo en segundo plano que procesa jobs pending."""
        if cls._worker_started:
            return
        cls._worker_started = True

        def _loop():
            import time
            while True:
                try:
                    cls.process_pending_jobs()
                except Exception as exc:  # pragma: no cover - defensivo
                    print(f"Error en worker de image jobs: {exc}")
                time.sleep(interval_seconds)

        import threading
        thread = threading.Thread(target=_loop, name="image-jobs-worker", daemon=True)
        thread.start()
