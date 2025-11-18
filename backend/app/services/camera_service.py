"""
Servicio de cámara - OPTIMIZADO para bajo consumo de recursos
- Captura única sin mantener conexión
- Liberación inmediata de memoria
- Sin video streaming continuo
"""
import cv2
import gc
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple

from app.config import CAMERA_CONFIG, PHOTOS_DIR, get_photo_url
from app.schemas.session import SessionPhoto
from app.services.session_service import SessionService
from app.api.settings import load_settings


class CameraService:
    """Servicio ligero de captura de fotos"""
    
    @staticmethod
    def capture_photo(
        camera_id: int = 0,
        session_id: Optional[str] = None
    ) -> Tuple[str, Path]:
        """
        Captura UNA foto y libera recursos inmediatamente.
        
        Optimización: No mantiene la cámara abierta, abre/captura/cierra.
        """
        cap = None
        try:
            settings = load_settings()

            # Abrir cámara
            cap = cv2.VideoCapture(camera_id)
            
            if not cap.isOpened():
                raise RuntimeError(f"No se puede abrir la cámara {camera_id}")
            
            # Configurar resolución (moderada para ahorrar RAM)
            cap.set(
                cv2.CAP_PROP_FRAME_WIDTH,
                settings.camera_width or CAMERA_CONFIG["width"],
            )
            cap.set(
                cv2.CAP_PROP_FRAME_HEIGHT,
                settings.camera_height or CAMERA_CONFIG["height"],
            )
            cap.set(cv2.CAP_PROP_BUFFERSIZE, CAMERA_CONFIG["buffer_size"])
            
            # Descartar primeros frames (a veces salen oscuros)
            for _ in range(3):
                cap.read()
            
            # Capturar foto
            ret, frame = cap.read()
            
            if not ret or frame is None:
                raise RuntimeError("Error al capturar foto")
            
            # Generar nombre de archivo
            if session_id is None:
                session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            current_session = SessionService.get_session(session_id)
            photo_index = len(current_session.photos) + 1 if current_session else 1
            filename = f"shot-{photo_index}.jpg"
            
            # Crear carpeta de sesión
            session_dir = PHOTOS_DIR / session_id
            session_dir.mkdir(parents=True, exist_ok=True)
            
            # Ruta completa
            filepath = session_dir / filename
            
            # Guardar con compresión JPEG (más ligero)
            cv2.imwrite(
                str(filepath),
                frame,
                [cv2.IMWRITE_JPEG_QUALITY, 90]  # Calidad 90 = buen balance
            )

            # Crear thumbnail pequeño para galería
            thumb_path = session_dir / f"thumb-{photo_index}.jpg"
            thumb_width = 320
            height, width = frame.shape[:2]
            scale = thumb_width / width
            thumb_height = int(height * scale)
            thumbnail = cv2.resize(frame, (thumb_width, thumb_height))
            cv2.imwrite(str(thumb_path), thumbnail, [cv2.IMWRITE_JPEG_QUALITY, 80])
            
            # Liberar frame de memoria
            del frame
            
            # Registrar metadata de sesión (fail fast si algo falla)
            photo_url = get_photo_url(filepath)
            thumb_url = get_photo_url(thumb_path)
            SessionService.append_photo(
                session_id,
                SessionPhoto(
                    filename=filename,
                    path=photo_url,
                    url=photo_url,
                    thumbnail_url=thumb_url,
                ),
            )

            return session_id, filepath
            
        except Exception as e:
            raise RuntimeError(f"Error en captura: {str(e)}")
        
        finally:
            # CRÍTICO: Liberar cámara SIEMPRE
            if cap is not None:
                cap.release()
            
            # Forzar garbage collection
            gc.collect()
    
    @staticmethod
    def get_available_cameras() -> list[int]:
        """
        Detecta cámaras disponibles sin mantenerlas abiertas.
        """
        available = []
        
        for camera_id in range(5):  # Revisar primeras 5
            cap = cv2.VideoCapture(camera_id)
            if cap.isOpened():
                available.append(camera_id)
                cap.release()
        
        gc.collect()
        return available
    
    @staticmethod
    def test_camera(camera_id: int = 0) -> bool:
        """
        Prueba si una cámara funciona.
        """
        cap = None
        try:
            cap = cv2.VideoCapture(camera_id)
            if not cap.isOpened():
                return False
            
            ret, frame = cap.read()
            success = ret and frame is not None
            
            if frame is not None:
                del frame
            
            return success
            
        except Exception:
            return False
        
        finally:
            if cap is not None:
                cap.release()
            gc.collect()
