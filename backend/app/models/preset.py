"""
Modelo de datos para Presets/Eventos
Permite guardar configuraciones completas para diferentes tipos de eventos
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class EventPreset(BaseModel):
    """
    Preset completo para un evento
    Incluye todas las configuraciones necesarias para el evento
    """
    id: str = Field(..., description="ID único del preset")
    name: str = Field(..., description="Nombre del evento (ej: 'Boda María & Juan')")
    event_type: str = Field(
        default="custom",
        description="Tipo de evento: wedding, birthday, party, corporate, public"
    )
    event_date: Optional[str] = Field(None, description="Fecha del evento (YYYY-MM-DD)")
    
    # Configuración de captura
    photos_to_take: int = Field(default=4, ge=1, le=6, description="Número de fotos por sesión")
    countdown_seconds: int = Field(default=5, ge=3, le=10, description="Segundos de countdown")
    auto_reset_seconds: int = Field(default=30, ge=10, le=60, description="Auto reset después del éxito")
    
    # Audio/Voz
    audio_enabled: bool = Field(default=True, description="Audio activado")
    voice_rate: float = Field(default=1.0, ge=0.5, le=2.0, description="Velocidad de voz")
    voice_pitch: float = Field(default=1.0, ge=0.5, le=2.0, description="Tono de voz")
    voice_volume: float = Field(default=1.0, ge=0.0, le=1.0, description="Volumen de voz")
    
    # Template asociado (nuevo modelo simplificado)
    template_id: Optional[str] = Field(None, description="ID del template a usar")
    
    # Backward compatibility - mantener design_id por ahora
    design_id: Optional[str] = Field(None, description="ID del diseño de Canva asociado (deprecated)")
    design_name: Optional[str] = Field(None, description="Nombre del diseño (deprecated)")
    design_path: Optional[str] = Field(None, description="Path al archivo del diseño (deprecated)")
    design_preview_url: Optional[str] = Field(None, description="URL del preview (deprecated)")
    
    # Metadata
    is_active: bool = Field(default=False, description="Preset activo actualmente")
    is_default: bool = Field(default=False, description="Preset por defecto (para eventos públicos)")
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    
    # Notas del evento
    notes: Optional[str] = Field(None, description="Notas adicionales del evento")
    client_name: Optional[str] = Field(None, description="Nombre del cliente")
    client_contact: Optional[str] = Field(None, description="Contacto del cliente")


class PresetCreate(BaseModel):
    """Datos para crear un nuevo preset"""
    name: str
    event_type: str = "custom"
    event_date: Optional[str] = None
    photos_to_take: int = 4
    countdown_seconds: int = 5
    auto_reset_seconds: int = 30
    audio_enabled: bool = True
    voice_rate: float = 1.0
    voice_pitch: float = 1.0
    voice_volume: float = 1.0
    template_id: Optional[str] = None  # New: reference to template
    design_id: Optional[str] = None  # Deprecated: keep for backward compatibility
    notes: Optional[str] = None
    client_name: Optional[str] = None
    client_contact: Optional[str] = None


class PresetUpdate(BaseModel):
    """Datos para actualizar un preset"""
    name: Optional[str] = None
    event_type: Optional[str] = None
    event_date: Optional[str] = None
    photos_to_take: Optional[int] = None
    countdown_seconds: Optional[int] = None
    auto_reset_seconds: Optional[int] = None
    audio_enabled: Optional[bool] = None
    voice_rate: Optional[float] = None
    voice_pitch: Optional[float] = None
    voice_volume: Optional[float] = None
    template_id: Optional[str] = None  # New: reference to template
    design_id: Optional[str] = None  # Deprecated: keep for backward compatibility
    notes: Optional[str] = None
    client_name: Optional[str] = None
    client_contact: Optional[str] = None


class PresetsListResponse(BaseModel):
    """Respuesta con lista de presets"""
    presets: list[EventPreset]
    active_preset: Optional[EventPreset] = None
    default_preset: Optional[EventPreset] = None


class PresetActivateResponse(BaseModel):
    """Respuesta al activar un preset"""
    success: bool
    preset: EventPreset
    message: str
