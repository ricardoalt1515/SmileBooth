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

from app.api import camera, image, print as print_api, designs, settings, gallery, presets, templates
from app.config import API_CONFIG


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle events - Limpiar memoria al iniciar y cerrar
    """
    # Startup
    print("🚀 PhotoBooth API iniciando...")
    print(f"📡 Servidor: http://{API_CONFIG['host']}:{API_CONFIG['port']}")
    gc.collect()  # Limpiar memoria al inicio
    
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
