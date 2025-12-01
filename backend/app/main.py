"""
PhotoBooth API - Optimizada para Bajos Recursos
- Sin logs innecesarios
- CORS mínimo
- Sin middleware pesado
"""
import gc
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import (
    camera,
    image,
    print as print_api,
    designs,
    settings,
    gallery,
    presets,
    templates,
    sessions,
    config_api,
)
from app.config import API_CONFIG


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle events - Limpiar memoria al iniciar y cerrar
    """
    # Startup
    from app.logging_config import logger
    from app.services.print_queue import PrintQueueService
    from app.services.image_jobs import ImageJobQueueService
    from app.services.demo_assets import ensure_demo_photos

    logger.info("🚀 PhotoBooth API iniciando...")
    print(f"📡 Servidor: http://{API_CONFIG['host']}:{API_CONFIG['port']}")
    gc.collect()  # Limpiar memoria al inicio

    # Limpieza ligera de colas persistentes al arranque
    try:
        PrintQueueService.cleanup_old_jobs()
    except Exception:
        logger.warning("No se pudo limpiar print_jobs al iniciar")
    try:
        ImageJobQueueService.cleanup_old_jobs()
        ImageJobQueueService.start_worker()
    except Exception:
        logger.warning("No se pudo limpiar image_jobs al iniciar")
    try:
        ensure_demo_photos()
    except Exception:
        logger.warning("No se pudieron generar fotos demo")
    
    yield
    
    # Shutdown
    print("👋 PhotoBooth API cerrando...")
    gc.collect()  # Limpiar memoria al cerrar


# Crear app con configuración mínima
app = FastAPI(
    title="PhotoBooth API",
    version="1.0.0",
    description="API optimizada para cabina de fotos",
    lifespan=lifespan,
    docs_url="/docs",  # Swagger UI
    redoc_url=None,  # Deshabilitar ReDoc para ahorrar recursos
)

# CORS simple (solo para desarrollo local)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir todos los orígenes para desarrollo (Electron + Vite)
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(camera.router)
app.include_router(image.router)
app.include_router(print_api.router)
app.include_router(designs.router)  # Keep for backward compatibility
app.include_router(templates.router)  # New templates API
app.include_router(settings.router)
app.include_router(gallery.router)
app.include_router(presets.router)
app.include_router(sessions.router)
app.include_router(config_api.router)

# Servir archivos estáticos (fotos capturadas)
# Las fotos se guardan en /photobooth/data/ (raíz del proyecto, no en backend/data/)
data_dir = Path(__file__).parent.parent.parent / "data"
data_dir.mkdir(parents=True, exist_ok=True)
app.mount("/data", StaticFiles(directory=str(data_dir)), name="data")


@app.get("/")
async def root():
    """Health check básico"""
    return {
        "status": "ok",
        "message": "PhotoBooth API funcionando",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Health check detallado"""
    return {
        "status": "healthy",
        "api": "running",
        "endpoints": {
            "camera": "/api/camera",
            "image": "/api/image"
        }
    }


@app.get("/api/health/full")
async def full_health(include_camera: bool = False):
    """Health check extendido con estado de impresora y cola de trabajos.

    La cámara ahora es responsabilidad del renderer; este endpoint solo reporta
    cámaras detectables desde el backend como diagnóstico opcional.

    Para evitar contención con el renderer (único dueño de la cámara), el
    escaneo de cámaras solo se realiza cuando ``include_camera=true``.
    """
    from app.services.print_service import PrintService
    from app.services.print_queue import PrintQueueService
    from app.services.camera_service import CameraService

    result: dict[str, object] = {
        "backend": {
            "status": "ok",
            "message": "API funcionando",
            "version": "1.0.0",
        }
    }

    # Estado de cámara (diagnóstico ligero, opcional)
    if include_camera:
        try:
            cameras = CameraService.get_available_cameras()
            if cameras:
                result["camera"] = {
                    "status": "ok",
                    "available_cameras": cameras,
                    "message": f"{len(cameras)} cámara(s) detectada(s)",
                }
            else:
                result["camera"] = {
                    "status": "error",
                    "available_cameras": [],
                    "message": "No se detectaron cámaras desde backend",
                }
        except Exception as exc:  # pragma: no cover - solo diagnóstico
            result["camera"] = {
                "status": "error",
                "available_cameras": [],
                "message": f"Error al listar cámaras: {exc}",
            }

    # Estado de impresoras
    try:
        printers = PrintService.get_available_printers()
        default_printer = PrintService.get_default_printer()
        status = "ok" if printers else "error"
        message = (
            f"{len(printers)} impresora(s) - {default_printer or 'Sin predeterminada'}"
            if printers
            else "No se detectaron impresoras"
        )
        result["printer"] = {
            "status": status,
            "printers": printers,
            "default_printer": default_printer,
            "message": message,
        }
    except Exception as exc:  # pragma: no cover - dependiente de SO
        result["printer"] = {
            "status": "error",
            "printers": [],
            "default_printer": None,
            "message": f"Error al detectar impresoras: {exc}",
        }

    # Estado de cola de impresión
    try:
        PrintQueueService.cleanup_old_jobs()
        jobs = PrintQueueService.list_jobs(limit=50)
        total_jobs = len(jobs)
        failed_jobs = len([j for j in jobs if j.status == "failed"])
        last_job = jobs[0].to_dict() if jobs else None
        last_failed = next((j.to_dict() for j in jobs if j.status == "failed"), None)
        result["print_queue"] = {
            "total_jobs": total_jobs,
            "failed_jobs": failed_jobs,
            "last_job": last_job,
            "last_failed": last_failed,
        }
    except Exception as exc:
        result["print_queue"] = {
            "total_jobs": 0,
            "failed_jobs": 0,
            "last_job": None,
            "last_failed": None,
            "error": f"Error al leer cola de impresión: {exc}",
        }

    return result


if __name__ == "__main__":
    import uvicorn
    
    # Ejecutar servidor optimizado
    uvicorn.run(
        "app.main:app",
        host=API_CONFIG["host"],
        port=API_CONFIG["port"],
        reload=API_CONFIG["reload"],
        log_level=API_CONFIG["log_level"],
        access_log=False,  # Deshabilitar access log para ahorrar recursos
    )
