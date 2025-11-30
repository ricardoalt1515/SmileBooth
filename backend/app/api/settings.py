"""
Settings API Router
Manage photobooth configuration
"""
import json
from pathlib import Path
from typing import Any, Dict
from fastapi import APIRouter, HTTPException

from app.schemas.settings import Settings, SettingsUpdate

router = APIRouter(prefix="/api/settings", tags=["settings"])

# Settings file path
SETTINGS_FILE = Path(__file__).parent.parent.parent / "data" / "config" / "settings.json"

# Simple in-process cache to avoid rereading JSON on every request
_SETTINGS_CACHE: Settings | None = None
_SETTINGS_MTIME: float | None = None


def load_settings() -> Settings:
    """Load settings from JSON file, create with defaults if missing"""
    global _SETTINGS_CACHE, _SETTINGS_MTIME

    if not SETTINGS_FILE.exists():
        # Create default settings
        default_settings = Settings()
        save_settings(default_settings)
        return default_settings

    try:
        mtime = SETTINGS_FILE.stat().st_mtime
        if _SETTINGS_CACHE is not None and _SETTINGS_MTIME == mtime:
            return _SETTINGS_CACHE

        with SETTINGS_FILE.open('r', encoding='utf-8') as f:
            data = json.load(f)

        settings = Settings(**data)
        _SETTINGS_CACHE = settings
        _SETTINGS_MTIME = mtime
        return settings
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading settings: {str(e)}")


def save_settings(settings: Settings) -> None:
    """Save settings to JSON file"""
    global _SETTINGS_CACHE, _SETTINGS_MTIME
    try:
        # Ensure directory exists
        SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)

        content = json.dumps(settings.model_dump(), indent=2, ensure_ascii=False)
        with SETTINGS_FILE.open('w', encoding='utf-8') as f:
            f.write(content)

        _SETTINGS_CACHE = settings
        try:
            _SETTINGS_MTIME = SETTINGS_FILE.stat().st_mtime
        except OSError:
            _SETTINGS_MTIME = None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving settings: {str(e)}")


@router.get("", response_model=Settings)
async def get_settings():
    """
    Get current photobooth settings

    Returns all configuration including:
    - Photo count and countdown timing
    - Audio settings
    - Backend URL
    - Active design and printer
    """
    return load_settings()


@router.patch("", response_model=Settings)
async def update_settings(updates: SettingsUpdate):
    """
    Update photobooth settings (partial update)

    Only provided fields will be updated, others remain unchanged.
    Validates all inputs before saving.
    """
    # Load current settings
    current_settings = load_settings()

    # Apply updates (only non-None fields)
    update_data = updates.model_dump(exclude_unset=True, exclude_none=True)

    for key, value in update_data.items():
        setattr(current_settings, key, value)

    # Save updated settings
    save_settings(current_settings)

    return current_settings


@router.post("/reset", response_model=Settings)
def reset_settings():
    """
    Reset all settings to defaults

    WARNING: This will overwrite all custom configuration
    """
    default_settings = Settings()
    save_settings(default_settings)
    return default_settings
