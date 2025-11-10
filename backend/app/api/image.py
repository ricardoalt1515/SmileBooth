"""
API de Imágenes - Endpoints optimizados
"""
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from app.services.image_service import ImageService
from app.schemas.image import ComposeStripRequest, ComposeStripResponse
from app.config import DATA_DIR, TEMP_DIR

router = APIRouter(prefix="/api/image", tags=["image"])


@router.post("/compose-strip", response_model=ComposeStripResponse)
async def compose_strip(request: ComposeStripRequest):
    """
    Compone una tira de 3 fotos + diseño personalizado.
    Optimizado para bajo consumo de memoria.
    """
    try:
        # Convertir paths relativos (/data/photos/...) a absolutos
        photo_paths = []
        for p in request.photo_paths:
            if p.startswith('/data/'):
                # Path relativo desde /data
                rel_path = p.replace('/data/', '')
                abs_path = DATA_DIR / rel_path
            else:
                # Path absoluto (legacy)
                abs_path = Path(p)
            photo_paths.append(abs_path)
        
        # Diseño también puede ser relativo
        design_path = None
        if request.design_path:
            if request.design_path.startswith('/data/'):
                rel_path = request.design_path.replace('/data/', '')
                design_path = DATA_DIR / rel_path
            else:
                design_path = Path(request.design_path)
        
        # Validar que existan las fotos
        for photo_path in photo_paths:
            if not photo_path.exists():
                raise HTTPException(
                    status_code=404,
                    detail=f"Foto no encontrada: {photo_path}"
                )
        
        # Componer tira con metadatos del template
        strip_path = ImageService.compose_strip(
            photo_paths=photo_paths,
            design_path=design_path,
            session_id=request.session_id,
            layout=request.layout,
            design_position=request.design_position,
            background_color=request.background_color,
            photo_spacing=request.photo_spacing
        )
        
        # Crear versión duplicada (4x6" con 2 tiras)
        full_page_path = ImageService.create_duplicate_strip(strip_path)
        
        # Convertir paths absolutos a relativos para el frontend
        strip_relative = "/" + str(Path(strip_path).relative_to(DATA_DIR.parent))
        full_page_relative = "/" + str(Path(full_page_path).relative_to(DATA_DIR.parent))
        
        return ComposeStripResponse(
            success=True,
            strip_path=strip_relative,
            full_page_path=full_page_relative
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al componer tira: {str(e)}"
        )


@router.post("/preview-strip")
async def preview_strip(request: ComposeStripRequest):
    """
    Genera un preview temporal del strip sin guardarlo permanentemente.
    Se usa para mostrar al usuario cómo quedará antes de procesar.
    El archivo se guarda en TEMP y se limpia automáticamente.
    """
    try:
        print(f"📸 Preview request: {request.photo_paths}")
        print(f"🎨 Design: {request.design_path}")
        
        # Convertir paths relativos a absolutos
        photo_paths = []
        for p in request.photo_paths:
            if p.startswith('/data/'):
                rel_path = p.replace('/data/', '')
                abs_path = DATA_DIR / rel_path
            else:
                abs_path = Path(p)
            
            # Validar que exista
            if not abs_path.exists():
                raise HTTPException(
                    status_code=404,
                    detail=f"Foto no encontrada: {abs_path}"
                )
            
            photo_paths.append(abs_path)
        
        print(f"✅ {len(photo_paths)} fotos encontradas")
        
        # Design path
        design_path = None
        if request.design_path:
            if request.design_path.startswith('/data/'):
                rel_path = request.design_path.replace('/data/', '')
                design_path = DATA_DIR / rel_path
            else:
                design_path = Path(request.design_path)
        
        # Generar preview en carpeta temporal
        import time
        preview_filename = f"preview_{int(time.time())}.jpg"
        preview_path = TEMP_DIR / preview_filename
        
        # Componer strip (sin crear duplicate) con metadatos del template
        strip_path = ImageService.compose_strip(
            photo_paths=photo_paths,
            design_path=design_path,
            session_id="preview",  # Carpeta temporal
            layout=request.layout,
            design_position=request.design_position,
            background_color=request.background_color,
            photo_spacing=request.photo_spacing
        )
        
        # Mover a temp
        import shutil
        shutil.move(str(strip_path), str(preview_path))
        
        # Limpiar carpeta preview
        preview_dir = strip_path.parent
        if preview_dir.exists() and preview_dir.name == "preview":
            shutil.rmtree(preview_dir)
        
        # Retornar la imagen directamente
        return FileResponse(
            preview_path,
            media_type="image/jpeg",
            headers={
                "Cache-Control": "no-cache",
                "X-Preview": "true"
            }
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al generar preview: {str(e)}"
        )
