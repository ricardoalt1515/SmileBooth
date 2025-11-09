"""
Schemas de imágenes
"""
from pydantic import BaseModel


class ComposeStripRequest(BaseModel):
    photo_paths: list[str]
    design_path: str | None = None
    session_id: str | None = None  # Opcional para preview


class ComposeStripResponse(BaseModel):
    success: bool
    strip_path: str
    full_page_path: str | None = None
    message: str = "Tira creada exitosamente"
