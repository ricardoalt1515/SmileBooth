"""
Template Model
Defines the structure for photo booth templates (layout + design)

A Template combines:
- Photo layout (how many photos and their arrangement)
- Design assets (background, logos from Canva)
- Positioning rules (where design elements go)
"""
from typing import Literal
from pydantic import BaseModel, Field
from datetime import datetime


# Constants - Avoid magic strings
LAYOUT_VERTICAL_3 = "3x1-vertical"
LAYOUT_VERTICAL_4 = "4x1-vertical"
LAYOUT_VERTICAL_6 = "6x1-vertical"
LAYOUT_GRID_2X2 = "2x2-grid"

DESIGN_POSITION_TOP = "top"
DESIGN_POSITION_BOTTOM = "bottom"
DESIGN_POSITION_LEFT = "left"
DESIGN_POSITION_RIGHT = "right"

# Valid layout options
LayoutType = Literal["3x1-vertical", "4x1-vertical", "6x1-vertical", "2x2-grid"]
DesignPositionType = Literal["top", "bottom", "left", "right"]


class Template(BaseModel):
    """
    Template defines a complete photo strip layout.
    
    Separates concerns:
    - Layout: How photos are arranged
    - Design: Visual assets (logos, backgrounds)
    - Settings: Spacing, colors, etc.
    """
    id: str
    name: str = Field(description="User-friendly template name")
    
    # Layout configuration
    layout: LayoutType = Field(
        default=LAYOUT_VERTICAL_3,
        description="Photo arrangement pattern"
    )
    
    # Design assets
    design_file_path: str | None = Field(
        default=None,
        description="Path to design PNG from Canva"
    )
    design_position: DesignPositionType = Field(
        default=DESIGN_POSITION_BOTTOM,
        description="Where to place the design element"
    )
    
    # Visual settings
    background_color: str = Field(
        default="#FFFFFF",
        description="Hex color code for background"
    )
    photo_spacing: int = Field(
        default=20,
        ge=0,
        le=100,
        description="Spacing between photos in pixels"
    )
    
    # Metadata
    is_active: bool = Field(
        default=False,
        description="Whether this template is currently active"
    )
    created_at: str = Field(
        default_factory=lambda: datetime.now().isoformat(),
        description="ISO timestamp of creation"
    )
    
    # Optional preview
    preview_url: str | None = Field(
        default=None,
        description="URL to preview image"
    )


class TemplateCreate(BaseModel):
    """Request model for creating a new template"""
    name: str = Field(min_length=1, max_length=100)
    layout: LayoutType = LAYOUT_VERTICAL_3
    design_position: DesignPositionType = DESIGN_POSITION_BOTTOM
    background_color: str = "#FFFFFF"
    photo_spacing: int = Field(default=20, ge=0, le=100)


class TemplateUpdate(BaseModel):
    """Request model for updating a template - all fields optional"""
    name: str | None = None
    layout: LayoutType | None = None
    design_file_path: str | None = None
    design_position: DesignPositionType | None = None
    background_color: str | None = None
    photo_spacing: int | None = Field(default=None, ge=0, le=100)


def get_layout_photo_count(layout: LayoutType) -> int:
    """
    Returns the number of photos for a given layout.
    Single source of truth for layout -> photo count mapping.
    
    Args:
        layout: The layout type
        
    Returns:
        Number of photos in this layout
    """
    layout_map = {
        LAYOUT_VERTICAL_3: 3,
        LAYOUT_VERTICAL_4: 4,
        LAYOUT_VERTICAL_6: 6,
        LAYOUT_GRID_2X2: 4,
    }
    return layout_map[layout]


def get_layout_dimensions(layout: LayoutType) -> tuple[int, int]:
    """
    Returns (width, height) in pixels for a given layout.
    
    Args:
        layout: The layout type
        
    Returns:
        Tuple of (width, height) in pixels
    """
    # Standard strip width
    strip_width = 600
    
    # Heights based on number of photos + design space
    dimension_map = {
        LAYOUT_VERTICAL_3: (strip_width, 1800),  # 3 photos + design
        LAYOUT_VERTICAL_4: (strip_width, 2400),  # 4 photos + design
        LAYOUT_VERTICAL_6: (strip_width, 3000),  # 6 photos + design
        LAYOUT_GRID_2X2: (strip_width, 1800),    # 2x2 grid + design
    }
    return dimension_map[layout]
