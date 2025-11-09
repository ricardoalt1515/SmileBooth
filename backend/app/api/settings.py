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


def load_settings() -> Settings:
    """Load settings from JSON file, create with defaults if missing"""
    if not SETTINGS_FILE.exists():
        # Create default settings
        default_settings = Settings()
        save_settings(default_settings)
        return default_settings

    try:
        with open(SETTINGS_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return Settings(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading settings: {str(e)}")


def save_settings(settings: Settings) -> None:
    """Save settings to JSON file"""
    try:
        # Ensure directory exists
        SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)

        with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
            json.dump(settings.model_dump(), f, indent=2, ensure_ascii=False)
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
async def reset_settings():
    """
    Reset all settings to defaults

    WARNING: This will overwrite all custom configuration
    """
    default_settings = Settings()
    save_settings(default_settings)
    return default_settings
