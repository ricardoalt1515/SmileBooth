"""
API de Imágenes - Endpoints optimizados
"""
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import traceback
from app.services.image_service import ImageService
from app.services.image_jobs import ImageJobQueueService
from app.schemas.image import ComposeStripRequest, ComposeStripResponse, ComposeJobResult
from app.config import DATA_DIR, TEMP_DIR

router = APIRouter(prefix="/api/image", tags=["image"])


def _resolve_photo_and_design_paths(request: ComposeStripRequest) -> tuple[list[Path], Path | None]:
    """Resolve photo_paths and design_path from request into absolute Paths.

    Compartido por los endpoints sin cambiar su contrato externo.
    """
    # Convertir paths relativos (/data/photos/...) a absolutos
    photo_paths: list[Path] = []
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
    design_path: Path | None = None
    if request.design_path:
        if request.design_path.startswith('/data/'):
            rel_path = request.design_path.replace('/data/', '')
            design_path = DATA_DIR / rel_path
        else:
            design_path = Path(request.design_path)

    return photo_paths, design_path


@router.post("/compose-strip", response_model=ComposeStripResponse)
async def compose_strip(request: ComposeStripRequest):
    """
    Compone una tira de 3 fotos + diseño personalizado.
    Optimizado para bajo consumo de memoria.
    """
    try:
        photo_paths, design_path = _resolve_photo_and_design_paths(request)
        
        # Validar que existan las fotos
        for photo_path in photo_paths:
            if not photo_path.exists():
                raise HTTPException(
                    status_code=404,
                    detail=f"Foto no encontrada: {photo_path}"
                )
            else:
                print(f"✅ Foto encontrada: {photo_path}")
        
        if design_path:
            print(f"🎨 Usando diseño: {design_path}")
        
        # Componer tira con metadatos del template
        try:
            strip_path = ImageService.compose_strip(
                photo_paths=photo_paths,
                design_path=design_path,
                session_id=request.session_id,
                layout=request.layout,
                design_position=request.design_position,
                background_color=request.background_color,
                photo_spacing=request.photo_spacing,
                photo_filter=request.photo_filter,
            )
        except Exception as compose_err:
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"compose_strip failed: {compose_err}")
        
        # Intentar crear página completa con 2 tiras solo si aplica el modo
        full_page_path = None
        if request.print_mode == "dual-strip":
            try:
                full_page_path = ImageService.create_duplicate_strip(strip_path)
            except Exception as dup_err:
                # No tumbar todo el flujo si falla solo el duplicado; loguear y seguir
                print(f"⚠️ Error al crear full_strip: {dup_err}")
                full_page_path = None
        
        # Convertir paths absolutos a relativos para el frontend
        strip_relative = "/" + str(Path(strip_path).relative_to(DATA_DIR.parent))
        full_page_relative = None
        if full_page_path:
            full_page_relative = "/" + str(Path(full_page_path).relative_to(DATA_DIR.parent))
        
        return ComposeStripResponse(
            success=True,
            strip_path=strip_relative,
            full_page_path=full_page_relative
        )
    
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
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
            photo_spacing=request.photo_spacing,
            photo_filter=request.photo_filter,
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


@router.post("/jobs/compose", response_model=ComposeJobResult)
async def compose_strip_job(request: ComposeStripRequest):
    """Encola y ejecuta un job de composición de tira.

    Primera versión: ejecuta compose_strip en la misma petición pero persiste el
    resultado en disco junto con un job_id para que el frontend pueda consultar
    estado sin cambiar el contrato de /compose-strip actual.
    """
    # Limpieza ligera antes de registrar el nuevo job para mantener el archivo acotado
    ImageJobQueueService.cleanup_old_jobs()

    # Registrar job pendiente con el payload crudo del request
    job = ImageJobQueueService.add_compose_job(request.model_dump())

    try:
        # Reutilizar la lógica existente de composición
        result = await compose_strip(request)

        ImageJobQueueService.update_status(
            job.job_id,
            status="completed",
            result=result.model_dump(),
            error=None,
        )

        return ComposeJobResult(
            job_id=job.job_id,
            status="completed",
            result=result,
            error=None,
        )
    except HTTPException as http_exc:
        ImageJobQueueService.update_status(
            job.job_id,
            status="failed",
            result=None,
            error=str(http_exc.detail),
        )
        raise
    except Exception as exc:
        ImageJobQueueService.update_status(
            job.job_id,
            status="failed",
            result=None,
            error=str(exc),
        )
        raise HTTPException(status_code=500, detail=f"compose_strip job failed: {exc}")


@router.get("/jobs/{job_id}", response_model=ComposeJobResult)
async def get_compose_job(job_id: str):
    """Devuelve el estado de un job de composición por ID."""
    job = ImageJobQueueService.get_job(job_id)
    if job is None or job.job_type != "compose-strip":
        raise HTTPException(status_code=404, detail=f"Job no encontrado: {job_id}")

    result_model: ComposeStripResponse | None = None
    if job.result:
        try:
            result_model = ComposeStripResponse(**job.result)
        except Exception:
            # Si el payload no es válido, exponerlo como error pero no romper el endpoint
            result_model = None

    return ComposeJobResult(
        job_id=job.job_id,
        status=job.status,
        result=result_model,
        error=job.error,
    )

