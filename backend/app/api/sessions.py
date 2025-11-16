"""Session management endpoints."""
from __future__ import annotations

import json
import zipfile
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from app.config import TEMP_DIR
from app.schemas.session import (
    SessionListResponse,
    SessionPhoto,
    SessionPrintJob,
    SessionRecord,
    SessionStatus,
)
from app.services.print_service import PrintService
from app.services.session_service import SessionService


router = APIRouter(prefix="/api/sessions", tags=["sessions"])


class SessionUpsertPayload(BaseModel):
    preset_id: str | None = None
    preset_name: str | None = None
    template_id: str | None = None
    template_layout: str | None = None
    status: SessionStatus | None = None
    strip_path: str | None = None
    notes: str | None = None
    photos: list[SessionPhoto] | None = None
    print_jobs: list[SessionPrintJob] | None = None


class SessionReprintRequest(BaseModel):
    printer_name: str | None = None
    copies: int = Field(default=2, ge=1, le=10)
    file_path: str | None = None


@router.get("", response_model=SessionListResponse)
async def list_sessions(
    preset_id: str | None = None,
    status: SessionStatus | None = None,
    limit: int = Query(50, ge=1, le=500),
):
    """List latest sessions with optional filters."""
    sessions, total = SessionService.list_sessions(
        preset_id=preset_id,
        status=status,
        limit=limit,
    )
    return SessionListResponse(sessions=sessions, total=total)


@router.get("/{session_id}", response_model=SessionRecord)
async def get_session(session_id: str):
    """Get a single session by ID."""
    record = SessionService.get_session(session_id)
    if record is None:
        raise HTTPException(404, f"Session '{session_id}' not found")
    return record


@router.post("/{session_id}", response_model=SessionRecord)
async def create_session(session_id: str, payload: SessionUpsertPayload):
    """Create a session record (fails if it already exists)."""
    if SessionService.get_session(session_id):
        raise HTTPException(400, f"Session '{session_id}' already exists")

    record = SessionService.create_or_update(
        session_id,
        **payload.model_dump(exclude_unset=True),
    )
    return record


@router.patch("/{session_id}", response_model=SessionRecord)
async def update_session(session_id: str, payload: SessionUpsertPayload):
    """Update an existing session record."""
    if SessionService.get_session(session_id) is None:
        raise HTTPException(404, f"Session '{session_id}' not found")

    record = SessionService.create_or_update(
        session_id,
        **payload.model_dump(exclude_unset=True),
    )
    return record


@router.delete("/{session_id}")
async def delete_session(session_id: str):
    """Delete a session record and return result."""
    deleted = SessionService.delete_session(session_id)
    if not deleted:
        raise HTTPException(404, f"Session '{session_id}' not found")
    return {"success": True, "session_id": session_id}


@router.post("/{session_id}/reprint", response_model=SessionRecord)
async def reprint_session(session_id: str, request: SessionReprintRequest):
    """Trigger a reprint for the session strip and log the job."""
    record = SessionService.get_session(session_id)
    if record is None:
        raise HTTPException(404, f"Session '{session_id}' not found")

    strip_path = request.file_path or record.strip_path
    if not strip_path:
        raise HTTPException(400, "La sesión no tiene strip para reimprimir")

    resolved_path = PrintService.resolve_data_path(strip_path)
    if not resolved_path.exists():
        raise HTTPException(404, f"Archivo no encontrado: {resolved_path}")

    printer_name = request.printer_name or PrintService.get_default_printer()
    if not printer_name:
        raise HTTPException(400, "No hay impresora configurada para reimpresión")

    success = PrintService.print_image(resolved_path, printer_name, request.copies)
    if not success:
        raise HTTPException(500, "Error al enviar reimpresión")

    job = SessionPrintJob(
        job_id=f"job_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        printer_name=printer_name,
        copies=request.copies,
        status="sent",
    )
    updated_record = SessionService.add_print_job(session_id, job)
    return updated_record


class SessionExportRequest(BaseModel):
    preset_id: str | None = None
    session_ids: list[str] | None = None


@router.post("/export", response_model=dict)
async def export_sessions(payload: SessionExportRequest):
    """Export sessions (photos + metadata) filtered by preset or session IDs."""
    sessions = SessionService.get_all_sessions()

    if payload.preset_id:
        sessions = [s for s in sessions if s.preset_id == payload.preset_id]

    if payload.session_ids:
        ids = set(payload.session_ids)
        sessions = [s for s in sessions if s.session_id in ids]

    if not sessions:
        raise HTTPException(404, "No hay sesiones para exportar con los filtros dados")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    zip_filename = f"sessions_export_{timestamp}.zip"
    zip_path = TEMP_DIR / zip_filename

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        metadata = {}
        for session in sessions:
            metadata[session.session_id] = session.model_dump()

            for photo in session.photos:
                photo_path = PrintService.resolve_data_path(photo.path)
                if photo_path.exists():
                    arcname = f"{session.session_id}/photos/{photo_path.name}"
                    zipf.write(photo_path, arcname)

            if session.strip_path:
                strip_path = PrintService.resolve_data_path(session.strip_path)
                if strip_path.exists():
                    arcname = f"{session.session_id}/strip/{strip_path.name}"
                    zipf.write(strip_path, arcname)

        metadata_file = Path(f"metadata_{timestamp}.json")
        metadata_temp_path = TEMP_DIR / metadata_file
        metadata_temp_path.write_text(json.dumps(metadata, indent=2, ensure_ascii=False), encoding="utf-8")
        zipf.write(metadata_temp_path, metadata_file.name)

    metadata_temp_path.unlink(missing_ok=True)

    return {
        "success": True,
        "file": str(zip_path),
        "url": f"/data/temp/{zip_path.name}",
        "filename": zip_filename,
    }
