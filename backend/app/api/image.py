"""
API de Imágenes - Endpoints optimizados
"""
from pathlib import Path
import json
import shutil
import time
import traceback
from uuid import uuid4
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Body
from fastapi.responses import FileResponse
from app.services.image_service import ImageService
from app.services.image_jobs import ImageJobQueueService
from app.schemas.image import ComposeStripRequest, ComposeStripResponse, ComposeJobResult
from app.config import DATA_DIR, TEMP_DIR, RESOURCE_LIMITS

router = APIRouter(prefix="/api/image", tags=["image"])


def _resolve_photo_and_design_paths(request: ComposeStripRequest) -> tuple[list[Path], Path | None]:
    """Resolve photo_paths and design_path from request into absolute Paths."""
    photo_paths: list[Path] = []
    for p in request.photo_paths:
        if p.startswith('/data/'):
            rel_path = p.replace('/data/', '')
            abs_path = DATA_DIR / rel_path
        else:
            abs_path = Path(p)
        photo_paths.append(abs_path)

    design_path: Path | None = None
    if request.design_path:
        if request.design_path.startswith('/data/'):
            rel_path = request.design_path.replace('/data/', '')
            design_path = DATA_DIR / rel_path
        else:
            design_path = Path(request.design_path)

    return photo_paths, design_path


def _compose_strip_core(request: ComposeStripRequest) -> ComposeStripResponse:
    """Core composition logic reused by sync and job endpoints."""
    photo_paths, design_path = _resolve_photo_and_design_paths(request)

    for photo_path in photo_paths:
        if not photo_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Foto no encontrada: {photo_path}"
            )

    if design_path:
        print(f"🎨 Usando diseño: {design_path}")

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
            overlay_mode=request.overlay_mode,
            design_scale=request.design_scale,
            design_offset_x=request.design_offset_x,
            design_offset_y=request.design_offset_y,
            design_stretch=bool(request.design_stretch) if request.design_stretch is not None else False,
            photo_aspect_ratio=request.photo_aspect_ratio,
        )
    except Exception as compose_err:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"compose_strip failed: {compose_err}")

    full_page_path = None
    if request.print_mode == "dual-strip":
        try:
            full_page_path = ImageService.create_duplicate_strip(strip_path)
        except Exception as dup_err:
            print(f"⚠️ Error al crear full_strip: {dup_err}")
            full_page_path = None

    strip_relative = "/" + str(Path(strip_path).relative_to(DATA_DIR.parent))
    full_page_relative = None
    if full_page_path:
        full_page_relative = "/" + str(Path(full_page_path).relative_to(DATA_DIR.parent))

    return ComposeStripResponse(
        success=True,
        strip_path=strip_relative,
        full_page_path=full_page_relative
    )


def _save_temp_design_file(upload: UploadFile) -> Path:
    """Save uploaded design to TEMP_DIR and return absolute path."""
    content_type = upload.content_type or ""
    if content_type not in ("image/png", "image/jpeg", "image/jpg"):
        raise HTTPException(status_code=400, detail="Solo se permiten PNG o JPG para el diseño")

    # Limitar tamaño
    upload.file.seek(0, 2)
    size_mb = upload.file.tell() / (1024 * 1024)
    upload.file.seek(0)
    if size_mb > RESOURCE_LIMITS.get("max_photo_size_mb", 10):
        raise HTTPException(status_code=400, detail="El diseño supera el tamaño permitido")

    suffix = Path(upload.filename or "design").suffix or ".png"
    target = TEMP_DIR / f"design_preview_{int(time.time())}{suffix}"
    with target.open("wb") as f:
        f.write(upload.file.read())
    return target


@router.post("/compose-strip", response_model=ComposeStripResponse)
async def compose_strip(request: ComposeStripRequest):
    """
    Compone una tira de 3 fotos + diseño personalizado.
    Optimizado para bajo consumo de memoria.
    """
    try:
        return _compose_strip_core(request)
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error al componer tira: {str(e)}"
        )


@router.post("/preview-strip")
async def preview_strip(
    request: ComposeStripRequest | None = Body(None),
    design_file: UploadFile | None = File(None),
    photo_paths_json: str | None = Form(None),
    design_path_form: str | None = Form(None),
    layout: str | None = Form(None),
    design_position: str | None = Form(None),
    background_color: str | None = Form(None),
    photo_spacing: int | None = Form(None),
    photo_filter: str | None = Form(None),
    design_scale: float | None = Form(None),
    design_offset_x: float | None = Form(None),
    design_offset_y: float | None = Form(None),
    overlay_mode: str | None = Form(None),
    design_stretch: bool | None = Form(None),
    photo_aspect_ratio: str | None = Form(None),
):
    """
    Genera un preview temporal del strip y devuelve la ruta servible (/data/...).
    Si se envía design_file (multipart), se usa ese archivo temporalmente.
    """
    try:
        # Reconstruir request si vino multipart con strings
        payload = request.model_dump() if request else {}
        if photo_paths_json:
            try:
                payload["photo_paths"] = json.loads(photo_paths_json)
            except Exception as json_err:
                raise HTTPException(status_code=400, detail=f"photo_paths inválido: {json_err}")
        if design_path_form:
            payload["design_path"] = design_path_form
        if layout:
            payload["layout"] = layout
        if design_position:
            payload["design_position"] = design_position
        if background_color:
            payload["background_color"] = background_color
        if photo_spacing is not None:
            payload["photo_spacing"] = photo_spacing
        if photo_filter:
            payload["photo_filter"] = photo_filter
        if design_scale is not None:
            payload["design_scale"] = design_scale
        if design_offset_x is not None:
            payload["design_offset_x"] = design_offset_x
        if design_offset_y is not None:
            payload["design_offset_y"] = design_offset_y
        if overlay_mode is not None:
            payload["overlay_mode"] = overlay_mode
        if design_stretch is not None:
            # FastAPI parsea bool de form como str a veces; forzar a bool explícito
            if isinstance(design_stretch, str):
                payload["design_stretch"] = design_stretch.lower() in {"1", "true", "yes", "on"}
            else:
                payload["design_stretch"] = bool(design_stretch)
        if photo_aspect_ratio is not None:
            payload["photo_aspect_ratio"] = photo_aspect_ratio

        # Asegurar que vengan photo_paths válidas
        if not payload.get("photo_paths"):
            raise HTTPException(status_code=400, detail="photo_paths es requerido para preview")

        try:
            request_obj = ComposeStripRequest(**payload)
        except Exception as parse_err:
            raise HTTPException(status_code=400, detail=f"Payload de preview inválido: {parse_err}")

        # Convertir paths relativos a absolutos
        photo_paths = []
        for p in request_obj.photo_paths:
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
        
        # Design path
        design_path = None
        if design_file:
            design_path = _save_temp_design_file(design_file)
        elif request_obj.design_path:
            if request_obj.design_path.startswith('/data/'):
                rel_path = request_obj.design_path.replace('/data/', '')
                design_path = DATA_DIR / rel_path
            else:
                design_path = Path(request_obj.design_path)
        
        # Generar preview en carpeta temporal con nombre único para evitar colisiones
        # Cuando se generaban varias tiras casi al mismo tiempo, todas usaban
        # el mismo nombre basado solo en segundos, y el último preview pisaba a los demás.
        timestamp_ms = int(time.time() * 1000)
        unique_suffix = uuid4().hex[:8]
        preview_filename = f"preview_{timestamp_ms}_{unique_suffix}.jpg"
        preview_path = TEMP_DIR / preview_filename
        
        # Componer strip (sin crear duplicate) con metadatos del template
        strip_path = ImageService.compose_strip(
            photo_paths=photo_paths,
            design_path=design_path,
            session_id="preview",  # Carpeta temporal
            layout=request_obj.layout,
            design_position=request_obj.design_position,
            background_color=request_obj.background_color,
            photo_spacing=request_obj.photo_spacing,
            photo_filter=request_obj.photo_filter,
            overlay_mode=request_obj.overlay_mode,
            design_scale=request_obj.design_scale,
            design_offset_x=request_obj.design_offset_x,
            design_offset_y=request_obj.design_offset_y,
            design_stretch=bool(request_obj.design_stretch) if request_obj.design_stretch is not None else False,
            photo_aspect_ratio=request_obj.photo_aspect_ratio,
        )
        
        # Mover a temp
        shutil.move(str(strip_path), str(preview_path))
        
        # Limpiar carpeta preview
        preview_dir = strip_path.parent
        if preview_dir.exists() and preview_dir.name == "preview":
            shutil.rmtree(preview_dir)
        
        preview_relative = "/" + str(preview_path.relative_to(DATA_DIR.parent))
        return {"preview_path": preview_relative}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al generar preview: {str(e)}"
        )


@router.post("/design-preview-upload")
async def design_preview_upload(file: UploadFile = File(...)):
    """
    Sube un diseño temporal para previews y devuelve su ruta servible (/data/...).
    """
    try:
        design_path = _save_temp_design_file(file)
        relative = "/" + str(design_path.relative_to(DATA_DIR.parent))
        return {"design_path": relative}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"No se pudo guardar diseño: {str(e)}")


@router.post("/jobs/compose", response_model=ComposeJobResult)
async def compose_strip_job(request: ComposeStripRequest):
    """Encola y ejecuta un job de composición de tira.

    Esta versión solo encola el job y devuelve su estado inicial. Un worker de
    fondo se encargará de procesarlo para no bloquear la petición.
    """
    # Limpieza ligera antes de registrar el nuevo job para mantener el archivo acotado
    ImageJobQueueService.cleanup_old_jobs()

    job = ImageJobQueueService.add_compose_job(request.model_dump())

    return ComposeJobResult(
        job_id=job.job_id,
        status=job.status,
        result=None,
        error=None,
    )


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
