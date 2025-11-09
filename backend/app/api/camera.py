"""
API de Cámara - Endpoints optimizados
"""
from fastapi import APIRouter, HTTPException
from app.services.camera_service import CameraService
from app.config import get_photo_url
from app.schemas.camera import (
    CaptureRequest,
    CaptureResponse,
    CameraListResponse,
    CameraTestResponse
)

router = APIRouter(prefix="/api/camera", tags=["camera"])


@router.post("/capture", response_model=CaptureResponse)
async def capture_photo(request: CaptureRequest):
    """
    Captura una foto de la cámara.
    Optimizado: Abre/captura/cierra inmediatamente.
    """
    try:
        session_id, filepath = CameraService.capture_photo(
            camera_id=request.camera_id,
            session_id=request.session_id
        )
        
        # Convertir path absoluto a URL usando función centralizada (DRY principle)
        photo_url = get_photo_url(filepath)
        
        return CaptureResponse(
            success=True,
            session_id=session_id,
            file_path=photo_url
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al capturar foto: {str(e)}"
        )


@router.get("/list", response_model=CameraListResponse)
async def list_cameras():
    """
    Lista cámaras disponibles.
    """
    try:
        cameras = CameraService.get_available_cameras()
        
        return CameraListResponse(
            available_cameras=cameras,
            default_camera=cameras[0] if cameras else 0
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al listar cámaras: {str(e)}"
        )


@router.get("/test/{camera_id}", response_model=CameraTestResponse)
async def test_camera(camera_id: int):
    """
    Prueba si una cámara específica funciona.
    """
    try:
        available = CameraService.test_camera(camera_id)
        
        return CameraTestResponse(
            camera_id=camera_id,
            available=available,
            message="Cámara disponible" if available else "Cámara no disponible"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al probar cámara: {str(e)}"
        )
