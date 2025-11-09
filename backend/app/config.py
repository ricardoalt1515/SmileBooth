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

# URLs de archivos estáticos
# IMPORTANTE: Estas deben coincidir con los mount points en main.py
STATIC_URLS = {
    "data_mount": "/data",  # Mount point del directorio data/
    "photos_prefix": "/data/photos",  # URL base para fotos
    "strips_prefix": "/data/strips",  # URL base para strips
    "designs_prefix": "/data/designs",  # URL base para diseños
}


def get_photo_url(photo_path: Path) -> str:
    """
    Convierte un path absoluto de foto a URL relativa.
    
    Args:
        photo_path: Path absoluto de la foto
        
    Returns:
        URL relativa para acceder a la foto vía HTTP
        
    Example:
        /path/to/data/photos/session/photo.jpg -> /data/photos/session/photo.jpg
    """
    try:
        # Obtener path relativo desde DATA_DIR
        rel_path = photo_path.relative_to(DATA_DIR)
        # Construir URL con el mount point correcto
        return f"{STATIC_URLS['data_mount']}/{rel_path.as_posix()}"
    except ValueError:
        # Si el path no es relativo a DATA_DIR, retornar path completo
        return f"{STATIC_URLS['data_mount']}/{photo_path.name}"
