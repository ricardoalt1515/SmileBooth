import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path

from app.config import DATA_DIR

# Crear directorio de logs si no existe
LOG_DIR = DATA_DIR / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE = LOG_DIR / "photobooth.log"

def setup_logging():
    """Configura el sistema de logging de la aplicación."""
    
    # Formato del log
    log_format = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )

    # Handler de archivo rotativo (10MB max, 5 backups)
    file_handler = RotatingFileHandler(
        LOG_FILE,
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8"
    )
    file_handler.setFormatter(log_format)
    file_handler.setLevel(logging.INFO)

    # Handler de consola (stdout)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(log_format)
    console_handler.setLevel(logging.INFO)

    # Configuración raíz
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # Evitar duplicar handlers si se llama múltiples veces
    if not root_logger.handlers:
        root_logger.addHandler(file_handler)
        root_logger.addHandler(console_handler)
    
    # Logger específico de la app
    app_logger = logging.getLogger("app")
    app_logger.setLevel(logging.INFO)
    
    return app_logger

# Instancia global
logger = setup_logging()
