"""
API de Presets/Eventos
Gestión completa de presets para diferentes tipos de eventos
"""
import json
import uuid
from pathlib import Path
from datetime import datetime
from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import Optional

from app.config import DATA_DIR, DESIGNS_DIR
from app.models.preset import (
    EventPreset,
    PresetCreate,
    PresetUpdate,
    PresetsListResponse,
    PresetActivateResponse
)
from app.api.settings import load_settings, save_settings
from app.api.templates import (
    load_templates_db,
    save_templates_db,
    deactivate_all_templates,
)

router = APIRouter(prefix="/api/presets", tags=["presets"])

# Archivo de persistencia de presets
PRESETS_FILE = DATA_DIR / "presets.json"


def resolve_template_metadata(template_id: Optional[str]) -> dict[str, Optional[str]]:
    """
    Obtener metadatos del template para guardarlos junto al preset.
    Falla rápido si el template no existe para evitar referencias huérfanas.
    """
    if not template_id:
        return {}

    templates = load_templates_db()
    template = templates.get(template_id)

    if not template:
        raise HTTPException(
            status_code=404,
            detail=f"Template '{template_id}' no encontrado"
        )

    preview_url = f"/api/templates/{template_id}/preview" if template.design_file_path else None

    return {
        "template_id": template_id,
        "template_name": template.name,
        "template_layout": template.layout,
        "template_preview_url": preview_url,
    }


def activate_template_if_needed(template_id: Optional[str]) -> None:
    """Sincroniza el template activo con el preset seleccionando."""
    if not template_id:
        return

    templates = load_templates_db()
    if template_id not in templates:
        raise HTTPException(
            status_code=404,
            detail=f"Template '{template_id}' no encontrado"
        )

    deactivate_all_templates(templates)
    templates[template_id].is_active = True
    save_templates_db(templates)


def load_presets() -> list[EventPreset]:
    """Cargar todos los presets del archivo JSON"""
    if not PRESETS_FILE.exists():
        # Crear preset por defecto
        default_preset = EventPreset(
            id="default",
            name="Evento Público (Base)",
            event_type="public",
            is_default=True,
            is_active=False,
            photos_to_take=4,
            countdown_seconds=5,
            auto_reset_seconds=30,
            notes="Configuración base para eventos públicos"
        )
        save_presets([default_preset])
        return [default_preset]
    
    with open(PRESETS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
        return [EventPreset(**preset) for preset in data]


def save_presets(presets: list[EventPreset]) -> None:
    """Guardar presets al archivo JSON"""
    PRESETS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(PRESETS_FILE, 'w', encoding='utf-8') as f:
        json.dump([preset.model_dump() for preset in presets], f, indent=2, ensure_ascii=False)


def get_active_preset() -> Optional[EventPreset]:
    """Obtener el preset actualmente activo"""
    presets = load_presets()
    for preset in presets:
        if preset.is_active:
            return preset
    return None


def apply_preset_to_settings(preset: EventPreset) -> None:
    """
    Aplicar configuración del preset a settings.json
    Esto sincroniza el preset activo con la configuración global
    """
    settings = load_settings()

    settings.photos_to_take = preset.photos_to_take
    settings.countdown_seconds = preset.countdown_seconds
    settings.auto_reset_seconds = preset.auto_reset_seconds
    settings.audio_enabled = preset.audio_enabled
    settings.voice_rate = preset.voice_rate
    settings.voice_pitch = preset.voice_pitch
    settings.voice_volume = preset.voice_volume
    settings.active_design_id = preset.design_id
    settings.active_template_id = preset.template_id
    
    save_settings(settings)


@router.get("", response_model=PresetsListResponse)
async def list_presets():
    """
    Listar todos los presets disponibles
    Incluye el preset activo y el preset por defecto
    """
    presets = load_presets()
    
    active_preset = None
    default_preset = None
    
    for preset in presets:
        if preset.is_active:
            active_preset = preset
        if preset.is_default:
            default_preset = preset
    
    return PresetsListResponse(
        presets=presets,
        active_preset=active_preset,
        default_preset=default_preset
    )


@router.get("/{preset_id}", response_model=EventPreset)
async def get_preset(preset_id: str):
    """Obtener un preset específico por ID"""
    presets = load_presets()
    
    for preset in presets:
        if preset.id == preset_id:
            return preset
    
    raise HTTPException(status_code=404, detail=f"Preset '{preset_id}' no encontrado")


@router.post("", response_model=EventPreset)
async def create_preset(preset_data: PresetCreate):
    """
    Crear un nuevo preset
    """
    presets = load_presets()
    
    # Generar ID único
    new_id = str(uuid.uuid4())[:8]
    
    # Buscar información del diseño si se especificó
    design_name = None
    design_path = None
    design_preview_url = None
    
    template_fields = resolve_template_metadata(preset_data.template_id)

    if preset_data.design_id:
        # Buscar el diseño en el directorio
        design_files = list(DESIGNS_DIR.glob(f"{preset_data.design_id}*"))
        if design_files:
            design_path = str(design_files[0])
            design_name = design_files[0].stem
            design_preview_url = f"/api/designs/{design_files[0].name}"
    
    # Crear nuevo preset
    new_preset = EventPreset(
        id=new_id,
        name=preset_data.name,
        event_type=preset_data.event_type,
        event_date=preset_data.event_date,
        photos_to_take=preset_data.photos_to_take,
        countdown_seconds=preset_data.countdown_seconds,
        auto_reset_seconds=preset_data.auto_reset_seconds,
        audio_enabled=preset_data.audio_enabled,
        voice_rate=preset_data.voice_rate,
        voice_pitch=preset_data.voice_pitch,
        voice_volume=preset_data.voice_volume,
        design_id=preset_data.design_id,
        design_name=design_name,
        design_path=design_path,
        design_preview_url=design_preview_url,
        notes=preset_data.notes,
        client_name=preset_data.client_name,
        client_contact=preset_data.client_contact,
        is_active=False,
        is_default=False
    )
    
    # Adjuntar metadatos del template (si aplica)
    if template_fields:
        new_preset = new_preset.model_copy(update=template_fields)
    
    presets.append(new_preset)
    save_presets(presets)
    
    return new_preset


@router.put("/{preset_id}", response_model=EventPreset)
async def update_preset(preset_id: str, preset_update: PresetUpdate):
    """
    Actualizar un preset existente
    """
    presets = load_presets()
    
    preset_index = None
    for i, preset in enumerate(presets):
        if preset.id == preset_id:
            preset_index = i
            break
    
    if preset_index is None:
        raise HTTPException(status_code=404, detail=f"Preset '{preset_id}' no encontrado")
    
    # Actualizar campos
    existing_preset = presets[preset_index]
    update_data = preset_update.model_dump(exclude_unset=True)
    
    # Si se actualiza el template, sincronizar metadatos
    if 'template_id' in update_data:
        if update_data['template_id']:
            template_fields = resolve_template_metadata(update_data['template_id'])
        else:
            template_fields = {
                'template_id': None,
                'template_name': None,
                'template_layout': None,
                'template_preview_url': None,
            }
        update_data.update(template_fields)

    # Si se actualiza el design_id, buscar info del diseño
    if 'design_id' in update_data and update_data['design_id']:
        design_files = list(DESIGNS_DIR.glob(f"{update_data['design_id']}*"))
        if design_files:
            update_data['design_path'] = str(design_files[0])
            update_data['design_name'] = design_files[0].stem
            update_data['design_preview_url'] = f"/api/designs/{design_files[0].name}"
    
    # Actualizar timestamp
    update_data['updated_at'] = datetime.now().isoformat()
    
    # Crear preset actualizado
    updated_preset = existing_preset.model_copy(update=update_data)
    presets[preset_index] = updated_preset
    
    save_presets(presets)
    
    # Si el preset está activo, aplicar cambios a settings
    if updated_preset.is_active:
        activate_template_if_needed(updated_preset.template_id)
        apply_preset_to_settings(updated_preset)
    
    return updated_preset


@router.post("/{preset_id}/activate", response_model=PresetActivateResponse)
async def activate_preset(preset_id: str):
    """
    Activar un preset
    - Desactiva el preset activo actual
    - Activa el nuevo preset
    - Aplica la configuración a settings.json
    """
    presets = load_presets()
    
    # Buscar el preset a activar
    preset_to_activate = None
    for preset in presets:
        if preset.id == preset_id:
            preset_to_activate = preset
        elif preset.is_active:
            # Desactivar preset anterior
            preset.is_active = False
    
    if preset_to_activate is None:
        raise HTTPException(status_code=404, detail=f"Preset '{preset_id}' no encontrado")
    
    # Activar nuevo preset
    preset_to_activate.is_active = True
    preset_to_activate.updated_at = datetime.now().isoformat()
    
    # Guardar cambios
    save_presets(presets)

    # Activar template vinculado (si aplica)
    activate_template_if_needed(preset_to_activate.template_id)
    
    # Aplicar configuración a settings.json
    apply_preset_to_settings(preset_to_activate)
    
    return PresetActivateResponse(
        success=True,
        preset=preset_to_activate,
        message=f"Preset '{preset_to_activate.name}' activado correctamente"
    )


@router.delete("/{preset_id}")
async def delete_preset(preset_id: str):
    """
    Eliminar un preset
    No se puede eliminar el preset por defecto ni el activo
    """
    presets = load_presets()
    
    preset_to_delete = None
    for preset in presets:
        if preset.id == preset_id:
            preset_to_delete = preset
            break
    
    if preset_to_delete is None:
        raise HTTPException(status_code=404, detail=f"Preset '{preset_id}' no encontrado")
    
    if preset_to_delete.is_default:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar el preset por defecto"
        )
    
    if preset_to_delete.is_active:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar el preset activo. Activa otro preset primero."
        )
    
    # Eliminar preset
    presets = [p for p in presets if p.id != preset_id]
    save_presets(presets)
    
    return {
        "success": True,
        "message": f"Preset '{preset_to_delete.name}' eliminado correctamente"
    }


@router.post("/{preset_id}/duplicate", response_model=EventPreset)
async def duplicate_preset(preset_id: str, new_name: Optional[str] = None):
    """
    Duplicar un preset existente
    Útil para crear variaciones de un preset
    """
    presets = load_presets()
    
    preset_to_duplicate = None
    for preset in presets:
        if preset.id == preset_id:
            preset_to_duplicate = preset
            break
    
    if preset_to_duplicate is None:
        raise HTTPException(status_code=404, detail=f"Preset '{preset_id}' no encontrado")
    
    # Crear copia con nuevo ID
    new_id = str(uuid.uuid4())[:8]
    duplicated_preset = preset_to_duplicate.model_copy(update={
        'id': new_id,
        'name': new_name or f"{preset_to_duplicate.name} (Copia)",
        'is_active': False,
        'is_default': False,
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat()
    })
    
    presets.append(duplicated_preset)
    save_presets(presets)
    
    return duplicated_preset
