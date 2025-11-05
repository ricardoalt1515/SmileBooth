"""
Configuración de la aplicación - Optimizada para bajo consumo
"""
from pathlib import Path

# Rutas base
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
PHOTOS_DIR = DATA_DIR / "photos"
STRIPS_DIR = DATA_DIR / "strips"
DESIGNS_DIR = DATA_DIR / "designs"
TEMP_DIR = DATA_DIR / "temp"

# Crear directorios si no existen
for directory in [PHOTOS_DIR, STRIPS_DIR, DESIGNS_DIR, TEMP_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Configuración de cámara (optimizada)
CAMERA_CONFIG = {
    "default_id": 0,
    "width": 1280,  # Resolución moderada para bajo consumo
    "height": 720,
    "fps": 30,
    "buffer_size": 1,  # Buffer mínimo para reducir RAM
}

# Configuración de imágenes (optimizada)
IMAGE_CONFIG = {
    "strip_width": 600,
    "strip_height": 1800,
    "photo_height": 413,
    "design_height": 450,
    "quality": 90,  # Buena calidad pero no máxima
    "dpi": (300, 300),
    "format": "JPEG",  # JPEG es más ligero que PNG
}

# Configuración de API
API_CONFIG = {
    "host": "127.0.0.1",
    "port": 8000,
    "reload": False,  # False en producción para ahorrar recursos
    "log_level": "info",
}

# Límites de recursos
RESOURCE_LIMITS = {
    "max_photo_size_mb": 10,  # Máximo tamaño de foto
    "max_temp_files": 100,  # Limpiar temp si excede
    "cleanup_after_hours": 24,  # Limpiar archivos temp viejos
}
