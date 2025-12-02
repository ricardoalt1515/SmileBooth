"""
Templates API
Manages photo booth templates (layouts + designs)

Key concepts:
- Template = Layout + Design assets + Positioning
- Replaces the old "designs" concept which was just PNG storage
- Provides a complete solution for print customization
"""
import shutil
import json
import uuid
from pathlib import Path
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from PIL import Image

from app.config import DESIGNS_DIR, DATA_DIR
from app.services.print_service import PrintService
from app.models.template import (
    Template,
    TemplateCreate,
    TemplateUpdate,
    get_layout_photo_count,
    get_layout_dimensions,
)

router = APIRouter(prefix="/api/templates", tags=["templates"])


# Constants
TEMPLATES_DB_FILE = DESIGNS_DIR / "templates.json"
TEMPLATE_ASSETS_DIR = DESIGNS_DIR / "template_assets"
MAX_FILE_SIZE_MB = 10
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg"}

# Cache simple en memoria para la DB de templates
_TEMPLATES_CACHE: dict[str, Template] | None = None
_TEMPLATES_MTIME: float | None = None


# ========== Helper Functions (Pure, no side effects) ==========

def generate_template_id() -> str:
    """
    Generates a unique template ID based on timestamp.
    
    Returns:
        Unique template ID string
    """
    return f"template_{datetime.now().strftime('%Y%m%d_%H%M%S')}"


def validate_image_file(filename: str, content_type: str) -> tuple[bool, str | None]:
    """
    Validates if uploaded file is a valid image.
    Fail fast - returns error immediately if invalid.
    
    Args:
        filename: Name of the uploaded file
        content_type: MIME type of the file
        
    Returns:
        Tuple of (is_valid, error_message)
        If valid: (True, None)
        If invalid: (False, "Error message")
    """
    # Check content type
    if not content_type or not content_type.startswith("image/"):
        return False, "Solo se permiten imágenes (PNG/JPG)"
    
    # Check extension
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"Extensión no permitida. Use: {', '.join(ALLOWED_EXTENSIONS)}"
    
    return True, None


def load_templates_db() -> dict[str, Template]:
    """
    Loads all templates from JSON database.
    Returns empty dict if file doesn't exist.

    Returns:
        Dictionary mapping template_id -> Template object
    """
    global _TEMPLATES_CACHE, _TEMPLATES_MTIME

    if not TEMPLATES_DB_FILE.exists():
        _TEMPLATES_CACHE = {}
        _TEMPLATES_MTIME = None
        return {}

    try:
        mtime = TEMPLATES_DB_FILE.stat().st_mtime
        if _TEMPLATES_CACHE is not None and _TEMPLATES_MTIME == mtime:
            return _TEMPLATES_CACHE

        with TEMPLATES_DB_FILE.open('r', encoding='utf-8') as f:
            data = json.load(f)
            # Convert dict to Template objects
            templates = {
                tid: Template(**tdata)
                for tid, tdata in data.items()
            }

        _TEMPLATES_CACHE = templates
        _TEMPLATES_MTIME = mtime
        return templates
    except Exception as e:
        print(f"⚠️ Error loading templates DB: {e}")
        return {}


def save_templates_db(templates: dict[str, Template]) -> None:
    """
    Saves templates to JSON database.

    Args:
        templates: Dictionary of templates to save
    """
    global _TEMPLATES_CACHE, _TEMPLATES_MTIME

    # Ensure directory exists
    TEMPLATES_DB_FILE.parent.mkdir(parents=True, exist_ok=True)

    # Convert Template objects to dicts
    data = {
        tid: template.model_dump()
        for tid, template in templates.items()
    }

    content = json.dumps(data, indent=2, ensure_ascii=False)
    with TEMPLATES_DB_FILE.open('w', encoding='utf-8') as f:
        f.write(content)

    _TEMPLATES_CACHE = templates
    try:
        _TEMPLATES_MTIME = TEMPLATES_DB_FILE.stat().st_mtime
    except OSError:
        _TEMPLATES_MTIME = None


def deactivate_all_templates(templates: dict[str, Template]) -> None:
    """
    Sets is_active=False for all templates.
    Modifies templates dict in-place.
    
    Args:
        templates: Dictionary of templates to modify
    """
    for template in templates.values():
        template.is_active = False


# ========== Response Models ==========

class TemplatesListResponse(BaseModel):
    """Response model for listing templates"""
    templates: list[Template]
    active_template: Template | None


class UploadDesignResponse(BaseModel):
    """Response model for design upload"""
    success: bool
    file_path: str
    message: str


# ========== API Endpoints ==========

@router.post("/create", response_model=Template)
async def create_template(template_data: TemplateCreate):
    """
    Creates a new template.

    Flow:
    1. Generate unique ID
    2. Create Template object
    3. Save to database
    4. Return created template
    """
    try:
        # Generate ID
        template_id = generate_template_id()

        # Create template object
        template = Template(
            id=template_id,
            name=template_data.name,
            layout=template_data.layout,
            design_position=template_data.design_position,
            overlay_mode=template_data.overlay_mode,
            background_color=template_data.background_color,
            photo_spacing=template_data.photo_spacing,
            photo_filter=template_data.photo_filter,
            design_scale=template_data.design_scale,
            design_offset_x=template_data.design_offset_x,
            design_offset_y=template_data.design_offset_y,
            is_active=False,
            created_at=datetime.now().isoformat(),
        )

        # Load existing templates
        templates = load_templates_db()

        # Add new template
        templates[template_id] = template

        # Save
        save_templates_db(templates)

        return template

    except Exception as e:
        raise HTTPException(500, f"Error creating template: {str(e)}")


@router.get("/list", response_model=TemplatesListResponse)
async def list_templates():
    """
    Lists all available templates.

    Returns:
        List of templates and the currently active one
    """
    try:
        templates = load_templates_db()

        # Convert to list
        template_list = list(templates.values())

        # Sort by creation date (newest first)
        template_list.sort(key=lambda t: t.created_at, reverse=True)

        # Find active template
        active = next((t for t in template_list if t.is_active), None)

        return TemplatesListResponse(
            templates=template_list,
            active_template=active
        )

    except Exception as e:
        raise HTTPException(500, f"Error listing templates: {str(e)}")


@router.get("/{template_id}", response_model=Template)
async def get_template(template_id: str):
    """
    Gets a specific template by ID.

    Args:
        template_id: The template ID

    Returns:
        Template object
    """
    try:
        templates = load_templates_db()

        # Fail fast if not found
        if template_id not in templates:
            raise HTTPException(404, f"Template not found: {template_id}")

        return templates[template_id]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error getting template: {str(e)}")


@router.put("/{template_id}", response_model=Template)
async def update_template(template_id: str, updates: TemplateUpdate):
    """
    Updates an existing template.
    Only updates provided fields (partial update).

    Args:
        template_id: The template ID
        updates: Fields to update

    Returns:
        Updated template
    """
    try:
        templates = load_templates_db()

        # Fail fast if not found
        if template_id not in templates:
            raise HTTPException(404, f"Template not found: {template_id}")

        template = templates[template_id]

        # Update only provided fields
        update_data = updates.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(template, field, value)

        # Save
        save_templates_db(templates)

        return template

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error updating template: {str(e)}")


@router.post("/{template_id}/activate")
async def activate_template(template_id: str):
    """
    Activates a template (sets is_active=True).
    Deactivates all other templates.

    Args:
        template_id: The template ID to activate

    Returns:
        Success message with activated template
    """
    try:
        templates = load_templates_db()

        # Fail fast if not found
        if template_id not in templates:
            raise HTTPException(404, f"Template not found: {template_id}")

        # Deactivate all
        deactivate_all_templates(templates)

        # Activate this one
        templates[template_id].is_active = True

        # Save
        save_templates_db(templates)

        return {
            "success": True,
            "message": f"Template '{templates[template_id].name}' activated",
            "template": templates[template_id]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error activating template: {str(e)}")


@router.post("/{template_id}/upload-design", response_model=UploadDesignResponse)
async def upload_template_design(
    template_id: str,
    file: UploadFile = File(...)
):
    """
    Uploads a design file (PNG from Canva) for a template.

    Flow:
    1. Validate file
    2. Save to template_assets directory
    3. Update template with file path
    4. Return success

    Args:
        template_id: The template ID
        file: The uploaded design file

    Returns:
        Upload response with file path
    """
    try:
        templates = load_templates_db()

        # Fail fast if template not found
        if template_id not in templates:
            raise HTTPException(404, f"Template not found: {template_id}")

        # Validate file
        is_valid, error = validate_image_file(
            file.filename or "design.png",
            file.content_type or ""
        )
        if not is_valid:
            raise HTTPException(400, error)

        # Create assets directory
        TEMPLATE_ASSETS_DIR.mkdir(parents=True, exist_ok=True)

        # Generate filename
        ext = Path(file.filename or "design.png").suffix
        filename = f"{template_id}_design{ext}"
        file_path = TEMPLATE_ASSETS_DIR / filename

        # Save file
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Resize if needed (clamp to reasonable max size, preserving aspect ratio)
        img = Image.open(file_path)
        max_width = 2000
        max_height = 2000

        if img.width > max_width or img.height > max_height:
            scale = min(max_width / img.width, max_height / img.height)
            new_size = (int(img.width * scale), int(img.height * scale))
            img_resized = img.resize(new_size, Image.Resampling.LANCZOS)
            img_resized.save(file_path, quality=95)
            print(f"ℹ️  Design resized from {img.size} to {new_size}")
            img_resized.close()

        img.close()

        # Convert to relative path from /data/
        relative_path = "/" + str(file_path.relative_to(DATA_DIR.parent))

        # Update template
        templates[template_id].design_file_path = relative_path
        save_templates_db(templates)

        return UploadDesignResponse(
            success=True,
            file_path=relative_path,
            message=f"Design uploaded for template '{templates[template_id].name}'"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error uploading design: {str(e)}")


@router.delete("/{template_id}")
async def delete_template(template_id: str):
    """
    Deletes a template and its associated design file.

    Args:
        template_id: The template ID to delete

    Returns:
        Success message
    """
    try:
        templates = load_templates_db()

        # Fail fast if not found
        if template_id not in templates:
            raise HTTPException(404, f"Template not found: {template_id}")

        template = templates[template_id]

        # Fail fast if template is active (business rule)
        if template.is_active:
            raise HTTPException(
                400,
                f"Cannot delete active template '{template.name}'. Deactivate it first."
            )

        # TODO: Check if template is used by any event/preset
        # This would require checking presets.json for template_id references

        # Delete design file if exists
        if template.design_file_path:
            design_path = Path(template.design_file_path)
            if design_path.exists():
                design_path.unlink()

        # Remove from database
        del templates[template_id]
        save_templates_db(templates)

        return {
            "success": True,
            "message": f"Template '{template.name}' deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error deleting template: {str(e)}")


@router.post("/{template_id}/duplicate", response_model=Template)
async def duplicate_template(template_id: str):
    """
    Crea una copia de un template con nuevo ID y nombre.

    No duplica archivos físicos; reutiliza las rutas de diseño existentes.
    """
    try:
        templates = load_templates_db()
        if template_id not in templates:
            raise HTTPException(404, f"Template not found: {template_id}")

        original = templates[template_id]
        new_id = str(uuid.uuid4())[:8]
        copy_name = f"{original.name} (Copia)"

        duplicated = original.model_copy(update={
            "id": new_id,
            "name": copy_name,
            "is_active": False,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
        })

        templates[new_id] = duplicated
        save_templates_db(templates)

        return duplicated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error duplicating template: {str(e)}")


@router.get("/{template_id}/preview")
async def get_template_preview(template_id: str):
    """
    Serves the design image for a template.

    Args:
        template_id: The template ID

    Returns:
        Design image file
    """
    from fastapi.responses import FileResponse

    try:
        templates = load_templates_db()

        # Fail fast if not found
        if template_id not in templates:
            raise HTTPException(404, f"Template not found: {template_id}")

        template = templates[template_id]

        # Check if has design
        if not template.design_file_path:
            raise HTTPException(404, "Template has no design file")

        # Use PrintService to resolve /data/... or relative paths to real disk path
        design_path = PrintService.resolve_data_path(template.design_file_path)

        # Fail fast if file doesn't exist
        if not design_path.exists():
            raise HTTPException(404, "Design file not found")

        return FileResponse(
            design_path,
            media_type=f"image/{design_path.suffix[1:]}",
            headers={"Cache-Control": "public, max-age=3600"}
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error getting preview: {str(e)}")
