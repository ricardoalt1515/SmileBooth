"""
API de Imágenes - Endpoints optimizados
"""
from pathlib import Path
from fastapi import APIRouter, HTTPException
from app.services.image_service import ImageService
from app.schemas.image import ComposeStripRequest, ComposeStripResponse

router = APIRouter(prefix="/api/image", tags=["image"])


@router.post("/compose-strip", response_model=ComposeStripResponse)
async def compose_strip(request: ComposeStripRequest):
    """
    Compone una tira de 3 fotos + diseño personalizado.
    Optimizado para bajo consumo de memoria.
    """
    try:
        # Convertir strings a Path
        photo_paths = [Path(p) for p in request.photo_paths]
        design_path = Path(request.design_path) if request.design_path else None
        
        # Validar que existan las fotos
        for photo_path in photo_paths:
            if not photo_path.exists():
                raise HTTPException(
                    status_code=404,
                    detail=f"Foto no encontrada: {photo_path}"
                )
        
        # Componer tira
        strip_path = ImageService.compose_strip(
            photo_paths=photo_paths,
            design_path=design_path,
            session_id=request.session_id
        )
        
        # Crear versión duplicada (4x6" con 2 tiras)
        full_page_path = ImageService.create_duplicate_strip(strip_path)
        
        return ComposeStripResponse(
            success=True,
            strip_path=str(strip_path),
            full_page_path=str(full_page_path)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al componer tira: {str(e)}"
        )
