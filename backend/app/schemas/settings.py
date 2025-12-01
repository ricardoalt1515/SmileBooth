"""
Settings Schemas
Pydantic models for photobooth configuration
"""
from typing import Optional, Literal
from pydantic import BaseModel, Field, field_validator


class Settings(BaseModel):
    """Photobooth configuration settings"""
    version: str = "1.0"
    photos_to_take: int = Field(default=3, ge=1, le=6, description="Number of photos per session")
    countdown_seconds: int = Field(default=5, ge=3, le=10, description="Countdown duration in seconds")
    backend_url: Optional[str] = Field(default="http://127.0.0.1:8000", description="Backend API URL")
    default_printer: Optional[str] = Field(default=None, description="Default printer name")
    active_design_id: Optional[str] = Field(default=None, description="Active Canva design ID")
    active_template_id: Optional[str] = Field(default=None, description="Active template ID")
    audio_enabled: bool = Field(default=True, description="Enable audio feedback")
    voice_rate: float = Field(default=1.0, ge=0.5, le=2.0, description="TTS voice rate")
    voice_pitch: float = Field(default=1.0, ge=0.5, le=2.0, description="TTS voice pitch")
    voice_volume: float = Field(default=1.0, ge=0.0, le=1.0, description="TTS voice volume")
    auto_reset_seconds: int = Field(default=30, ge=10, le=60, description="Auto-reset timeout in seconds")
    photo_filter: str = Field(default="none", description="Photo filter: none, bw, sepia, glam")
    
    # Layout configuration
    strip_layout: Literal["vertical-3", "vertical-4", "vertical-6", "grid-2x2"] = Field(
        default="vertical-3",
        description="Strip layout type"
    )
    print_mode: Literal["single", "dual-strip"] = Field(
        default="dual-strip",
        description="Print mode: single strip or dual strips side-by-side"
    )
    paper_size: Literal["2x6", "4x6", "5x7"] = Field(default="4x6", description="Target paper size for printing")
    photo_spacing: int = Field(default=20, ge=0, le=100, description="Spacing between photos in pixels")
    strip_width: int = Field(default=600, ge=400, le=800, description="Strip width in pixels")
    strip_height: int = Field(default=1800, ge=1200, le=2400, description="Strip height in pixels")
    mirror_preview: bool = Field(default=False, description="Flip camera preview horizontally for mirror effect")
    kiosk_mode: bool = Field(default=True, description="Launch application in kiosk/fullscreen mode")
    auto_print: bool = Field(default=False, description="Automatically send strips to printer after processing")
    print_copies: int = Field(default=2, ge=1, le=6, description="Number of copies to print by default")
    camera_width: int = Field(default=1280, ge=640, le=1920, description="Camera capture width")
    camera_height: int = Field(default=720, ge=480, le=1080, description="Camera capture height")

    @field_validator('backend_url')
    @classmethod
    def validate_backend_url(cls, v: Optional[str]) -> Optional[str]:
        """Ensure backend URL doesn't have trailing slash"""
        if v is not None:
            return v.rstrip('/')
        return v


class SettingsUpdate(BaseModel):
    """Partial settings update (PATCH)"""
    photos_to_take: Optional[int] = Field(default=None, ge=1, le=6)
    countdown_seconds: Optional[int] = Field(default=None, ge=3, le=10)
    backend_url: Optional[str] = None
    default_printer: Optional[str] = None
    active_design_id: Optional[str] = None
    active_template_id: Optional[str] = None
    audio_enabled: Optional[bool] = None
    voice_rate: Optional[float] = Field(default=None, ge=0.5, le=2.0)
    voice_pitch: Optional[float] = Field(default=None, ge=0.5, le=2.0)
    voice_volume: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    auto_reset_seconds: Optional[int] = Field(default=None, ge=10, le=60)
    photo_filter: Optional[str] = None
    strip_layout: Optional[Literal["vertical-3", "vertical-4", "vertical-6", "grid-2x2"]] = None
    print_mode: Optional[Literal["single", "dual-strip"]] = None
    paper_size: Optional[Literal["2x6", "4x6", "5x7"]] = None
    photo_spacing: Optional[int] = Field(default=None, ge=0, le=100)
    strip_width: Optional[int] = Field(default=None, ge=400, le=800)
    strip_height: Optional[int] = Field(default=None, ge=1200, le=2400)
    mirror_preview: Optional[bool] = None
    kiosk_mode: Optional[bool] = None
    auto_print: Optional[bool] = None
    print_copies: Optional[int] = Field(default=None, ge=1, le=6)
    camera_width: Optional[int] = Field(default=None, ge=640, le=1920)
    camera_height: Optional[int] = Field(default=None, ge=480, le=1080)

    @field_validator('backend_url')
    @classmethod
    def validate_backend_url(cls, v: Optional[str]) -> Optional[str]:
        """Ensure backend URL doesn't have trailing slash"""
        if v is not None:
            return v.rstrip('/')
        return v
