"""
Schemas for session metadata persistence
"""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


SessionStatus = Literal["capturing", "composed", "printed", "error"]


class SessionPhoto(BaseModel):
    filename: str
    path: str
    url: str
    captured_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class SessionPrintJob(BaseModel):
    job_id: str
    printer_name: str
    copies: int = 1
    requested_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    status: Literal["queued", "sent", "failed"] = "queued"
    error_message: str | None = None


class SessionRecord(BaseModel):
    session_id: str
    preset_id: str | None = None
    preset_name: str | None = None
    template_id: str | None = None
    template_layout: str | None = None
    status: SessionStatus = "capturing"
    photos: list[SessionPhoto] = Field(default_factory=list)
    strip_path: str | None = None
    print_jobs: list[SessionPrintJob] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    notes: str | None = None


class SessionListResponse(BaseModel):
    sessions: list[SessionRecord]
    total: int


class SessionFilter(BaseModel):
    preset_id: str | None = None
    status: SessionStatus | None = None
    limit: int = Field(default=50, ge=1, le=500)
