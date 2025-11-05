"""
Schemas de cámara
"""
from pydantic import BaseModel, Field


class CaptureRequest(BaseModel):
    camera_id: int = Field(default=0, ge=0, le=10)
    session_id: str | None = None


class CaptureResponse(BaseModel):
    success: bool
    session_id: str
    file_path: str
    message: str = "Foto capturada exitosamente"


class CameraListResponse(BaseModel):
    available_cameras: list[int]
    default_camera: int


class CameraTestResponse(BaseModel):
    camera_id: int
    available: bool
    message: str
