"""Session persistence helpers.

Stores per-session metadata in data/sessions/sessions.json so other
services (camera, image, print) can enrich records incrementally without
requiring a full database.
"""
from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Tuple

from app.config import DATA_DIR
from app.schemas.session import (
    SessionPhoto,
    SessionPrintJob,
    SessionRecord,
)


class SessionService:
    """Utility methods to load/save session metadata safely."""

    SESSIONS_DIR: Path = DATA_DIR / "sessions"
    DB_FILE: Path = SESSIONS_DIR / "sessions.json"

    @classmethod
    def _load_db(cls) -> Dict[str, SessionRecord]:
        if not cls.DB_FILE.exists():
            return {}

        with cls.DB_FILE.open("r", encoding="utf-8") as file:
            data = json.load(file)
            return {
                session_id: SessionRecord(**record)
                for session_id, record in data.items()
            }

    @classmethod
    def _save_db(cls, sessions: Dict[str, SessionRecord]) -> None:
        cls.SESSIONS_DIR.mkdir(parents=True, exist_ok=True)
        payload = {
            session_id: record.model_dump()
            for session_id, record in sessions.items()
        }
        with cls.DB_FILE.open("w", encoding="utf-8") as file:
            json.dump(payload, file, indent=2, ensure_ascii=False)

    @classmethod
    def list_sessions(
        cls,
        preset_id: str | None = None,
        status: str | None = None,
        limit: int = 50,
    ) -> Tuple[list[SessionRecord], int]:
        sessions = cls._load_db()
        records = list(sessions.values())

        if preset_id:
            records = [record for record in records if record.preset_id == preset_id]

        if status:
            records = [record for record in records if record.status == status]

        # Sort newest first
        records.sort(key=lambda record: record.created_at, reverse=True)
        total = len(records)
        return records[:limit], total

    @classmethod
    def get_all_sessions(cls) -> list[SessionRecord]:
        sessions = cls._load_db()
        records = list(sessions.values())
        records.sort(key=lambda record: record.created_at, reverse=True)
        return records

    @classmethod
    def get_session(cls, session_id: str) -> SessionRecord | None:
        sessions = cls._load_db()
        return sessions.get(session_id)

    @classmethod
    def save_session(cls, record: SessionRecord) -> SessionRecord:
        sessions = cls._load_db()
        sessions[record.session_id] = record
        cls._save_db(sessions)
        return record

    @classmethod
    def delete_session(cls, session_id: str) -> bool:
        sessions = cls._load_db()
        if session_id not in sessions:
            return False
        del sessions[session_id]
        cls._save_db(sessions)
        return True

    @classmethod
    def create_or_update(
        cls,
        session_id: str,
        **fields,
    ) -> SessionRecord:
        session = cls.get_session(session_id)
        if session is None:
            session = SessionRecord(session_id=session_id)

        for field, value in fields.items():
            if value is not None:
                setattr(session, field, value)

        session.updated_at = datetime.now().isoformat()
        return cls.save_session(session)

    @classmethod
    def append_photo(cls, session_id: str, photo: SessionPhoto) -> SessionRecord:
        session = cls.get_session(session_id)
        if session is None:
            session = SessionRecord(session_id=session_id)

        session.photos.append(photo)
        session.updated_at = datetime.now().isoformat()
        return cls.save_session(session)

    @classmethod
    def set_strip(cls, session_id: str, strip_path: str) -> SessionRecord:
        session = cls.get_session(session_id)
        if session is None:
            session = SessionRecord(session_id=session_id)

        session.strip_path = strip_path
        session.status = "composed"
        session.updated_at = datetime.now().isoformat()
        return cls.save_session(session)

    @classmethod
    def add_print_job(
        cls,
        session_id: str,
        job: SessionPrintJob,
    ) -> SessionRecord:
        session = cls.get_session(session_id)
        if session is None:
            session = SessionRecord(session_id=session_id)

        session.print_jobs.append(job)
        session.status = "printed" if job.status == "sent" else session.status
        session.updated_at = datetime.now().isoformat()
        return cls.save_session(session)


__all__ = [
    "SessionService",
]
