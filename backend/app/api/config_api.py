"""Config API

Aggregates core configuration pieces (settings, presets, templates)
into a single endpoint so the frontend can hydrate its store in one
round-trip.

Keeps logic small and reuses existing helpers from other routers.
"""
from fastapi import APIRouter
from pydantic import BaseModel

from app.api.settings import load_settings
from app.api.presets import load_presets, get_active_preset
from app.api.templates import load_templates_db
from app.schemas.settings import Settings
from app.models.preset import EventPreset
from app.models.template import Template


router = APIRouter(prefix="/api/config", tags=["config"])


class ConfigResponse(BaseModel):
    """Aggregated configuration snapshot.

    This avoids duplicated requests and lets the frontend hydrate its
    store with a single call while keeping the backend logic simple.
    """

    settings: Settings
    presets: list[EventPreset]
    active_preset: EventPreset | None
    templates: list[Template]
    active_template: Template | None


@router.get("", response_model=ConfigResponse)
async def get_config() -> ConfigResponse:
    """Return a consolidated view of settings, presets and templates.

    The underlying helpers still read from JSON files; if we later add
    in-memory caching, this endpoint will benefit automatically without
    changing its contract.
    """
    settings = load_settings()

    presets = load_presets()
    active_preset = get_active_preset()

    templates_db = load_templates_db()
    template_list = list(templates_db.values())
    active_template = next((t for t in template_list if t.is_active), None)

    return ConfigResponse(
        settings=settings,
        presets=presets,
        active_preset=active_preset,
        templates=template_list,
        active_template=active_template,
    )
