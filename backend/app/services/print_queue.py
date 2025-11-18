"""
PrintQueueService

Persistencia simple en disco para trabajos de impresión.
No usa hilos ni workers; sirve para monitorear estado y reintentar manualmente.
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

from app.config import DATA_DIR


class PrintJobRecord:
    def __init__(
        self,
        file_path: str,
        printer_name: Optional[str],
        copies: int,
        status: str = "pending",
        error: Optional[str] = None,
        job_id: Optional[str] = None,
        created_at: Optional[str] = None,
        updated_at: Optional[str] = None,
    ):
        self.job_id = job_id or str(uuid.uuid4())
        self.file_path = file_path
        self.printer_name = printer_name
        self.copies = copies
        self.status = status
        self.error = error
        self.created_at = created_at or datetime.now().isoformat()
        self.updated_at = updated_at or self.created_at

    def to_dict(self) -> Dict:
        return {
            "job_id": self.job_id,
            "file_path": self.file_path,
            "printer_name": self.printer_name,
            "copies": self.copies,
            "status": self.status,
            "error": self.error,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    @staticmethod
    def from_dict(data: Dict) -> "PrintJobRecord":
        return PrintJobRecord(
            file_path=data["file_path"],
            printer_name=data.get("printer_name"),
            copies=data.get("copies", 1),
            status=data.get("status", "pending"),
            error=data.get("error"),
            job_id=data.get("job_id"),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
        )


class PrintQueueService:
    DB_FILE: Path = DATA_DIR / "config" / "print_jobs.json"
    MAX_JOBS = 200
    CLEANUP_DAYS = 7

    @classmethod
    def _load(cls) -> Dict[str, PrintJobRecord]:
        if not cls.DB_FILE.exists():
            return {}
        try:
            with cls.DB_FILE.open("r", encoding="utf-8") as file:
                raw = json.load(file)
            return {job_id: PrintJobRecord.from_dict(record) for job_id, record in raw.items()}
        except Exception as exc:
            print(f"Error leyendo print_jobs.json: {exc}")
            return {}

    @classmethod
    def _save(cls, jobs: Dict[str, PrintJobRecord]) -> None:
        cls.DB_FILE.parent.mkdir(parents=True, exist_ok=True)
        payload = {job_id: record.to_dict() for job_id, record in jobs.items()}
        with cls.DB_FILE.open("w", encoding="utf-8") as file:
            json.dump(payload, file, indent=2, ensure_ascii=False)

    @classmethod
    def add_job(cls, file_path: str, printer_name: Optional[str], copies: int) -> PrintJobRecord:
        jobs = cls._load()
        job = PrintJobRecord(file_path=file_path, printer_name=printer_name, copies=copies)
        jobs[job.job_id] = job

        # Mantener tamaño acotado
        if len(jobs) > cls.MAX_JOBS:
            # Ordenar por fecha y truncar
            sorted_jobs = sorted(jobs.values(), key=lambda j: j.created_at, reverse=True)[: cls.MAX_JOBS]
            jobs = {job.job_id: job for job in sorted_jobs}

        cls._save(jobs)
        return job

    @classmethod
    def get_job(cls, job_id: str) -> Optional[PrintJobRecord]:
        jobs = cls._load()
        return jobs.get(job_id)

    @classmethod
    def cleanup_old_jobs(cls) -> None:
        """Elimina trabajos más antiguos que CLEANUP_DAYS para mantener el archivo ligero."""
        jobs = cls._load()
        if not jobs:
            return

        cutoff = datetime.now().timestamp() - (cls.CLEANUP_DAYS * 24 * 3600)
        filtered = {}
        for job_id, record in jobs.items():
            try:
                created_ts = datetime.fromisoformat(record.created_at).timestamp()
                if created_ts >= cutoff:
                    filtered[job_id] = record
            except Exception:
                # Si no se puede parsear, se conserva para evitar pérdida accidental
                filtered[job_id] = record

        # Además, truncar a MAX_JOBS después del filtro
        sorted_jobs = sorted(filtered.values(), key=lambda j: j.created_at, reverse=True)[: cls.MAX_JOBS]
        bounded = {job.job_id: job for job in sorted_jobs}
        cls._save(bounded)

    @classmethod
    def update_status(cls, job_id: str, status: str, error: Optional[str] = None) -> Optional[PrintJobRecord]:
        jobs = cls._load()
        job = jobs.get(job_id)
        if not job:
            return None
        job.status = status
        job.error = error
        job.updated_at = datetime.now().isoformat()
        cls._save(jobs)
        return job

    @classmethod
    def list_jobs(cls, limit: int = 50) -> List[PrintJobRecord]:
        jobs = cls._load()
        records = list(jobs.values())
        records.sort(key=lambda j: j.created_at, reverse=True)
        return records[:limit]
