"""
Schemas de imágenes
"""
from pydantic import BaseModel


class ComposeStripRequest(BaseModel):
    """
    Request para componer strip de fotos.
    Soporta metadatos del template para personalización completa.
    """
    photo_paths: list[str]
    design_path: str | None = None
    session_id: str | None = None  # Opcional para preview
    
    # Template metadata (opcional, usa defaults si no se provee)
    layout: str | None = None  # "3x1-vertical", "4x1-vertical", "6x1-vertical", "2x2-grid"
    design_position: str | None = None  # "top", "bottom", "left", "right"
    background_color: str | None = None  # "#ffffff" (hex color)
    photo_spacing: int | None = None  # Espaciado entre fotos en px


class ComposeStripResponse(BaseModel):
    success: bool
    strip_path: str
    full_page_path: str | None = None
    message: str = "Tira creada exitosamente"
