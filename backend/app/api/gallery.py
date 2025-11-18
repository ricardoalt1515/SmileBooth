"""
API de Galería - Gestión de fotos del evento
"""
import os
import zipfile
from pathlib import Path
from datetime import datetime
from typing import List
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.config import PHOTOS_DIR, TEMP_DIR, get_photo_url
from app.services.session_service import SessionService

router = APIRouter(prefix="/api/gallery", tags=["gallery"])


class PhotoInfo(BaseModel):
    """Información de una foto"""
    id: str
    filename: str
    path: str
    url: str
    thumbnail_url: str | None = None
    session_id: str
    timestamp: str
    size_bytes: int


class GalleryStats(BaseModel):
    """Estadísticas de la galería"""
    total_sessions: int
    total_photos: int
    latest_session: str | None
    total_size_mb: float


class GalleryResponse(BaseModel):
    """Respuesta de la galería"""
    photos: List[PhotoInfo]
    stats: GalleryStats


class SessionPhotos(BaseModel):
    session_id: str
    photos: List[PhotoInfo]
    strip_url: str | None = None
    full_strip_url: str | None = None
    total_size_bytes: int
    created_at: str | None = None


@router.get("/photos", response_model=GalleryResponse)
async def get_all_photos():
    """
    Obtiene todas las fotos del evento.
    Organizado por sesiones.
    """
    try:
        photos: List[PhotoInfo] = []
        sessions = set()
        total_size = 0
        latest_session = None
        
        # Recorrer todas las carpetas de sesiones
        if PHOTOS_DIR.exists():
            session_dirs = sorted(
                [d for d in PHOTOS_DIR.iterdir() if d.is_dir()],
                key=lambda x: x.name,
                reverse=True  # Más recientes primero
            )
            
            for session_dir in session_dirs:
                session_id = session_dir.name
                sessions.add(session_id)
                
                if latest_session is None:
                    latest_session = session_id
                
                # Obtener todas las fotos de esta sesión (compatibilidad con nombres antiguos)
                photo_files = sorted(
                    list(session_dir.glob("shot-*.jpg")) + list(session_dir.glob("photo_*.jpg")),
                    key=lambda x: x.name
                )
                
                for photo_file in photo_files:
                    stat = photo_file.stat()
                    total_size += stat.st_size
                    
                    # Crear URL usando función centralizada (DRY principle)
                    photo_url = get_photo_url(photo_file)
                    
                    thumb_candidate = session_dir / f"thumb-{photo_file.stem.replace('shot-', '')}.jpg"
                    thumb_url = get_photo_url(thumb_candidate) if thumb_candidate.exists() else None

                    photos.append(PhotoInfo(
                        id=photo_file.stem,
                        filename=photo_file.name,
                        path=str(photo_file),
                        url=photo_url,
                        thumbnail_url=thumb_url,
                        session_id=session_id,
                        timestamp=datetime.fromtimestamp(stat.st_mtime).isoformat(),
                        size_bytes=stat.st_size
                    ))
        
        # Calcular estadísticas
        stats = GalleryStats(
            total_sessions=len(sessions),
            total_photos=len(photos),
            latest_session=latest_session,
            total_size_mb=round(total_size / (1024 * 1024), 2)
        )
        
        return GalleryResponse(photos=photos, stats=stats)
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener galería: {str(e)}"
        )


@router.get("/stats", response_model=GalleryStats)
async def get_stats():
    """
    Obtiene solo las estadísticas (más rápido que cargar todas las fotos).
    """
    try:
        sessions = set()
        total_photos = 0
        total_size = 0
        latest_session = None
        
        if PHOTOS_DIR.exists():
            session_dirs = sorted(
                [d for d in PHOTOS_DIR.iterdir() if d.is_dir()],
                key=lambda x: x.name,
                reverse=True
            )
            
            for session_dir in session_dirs:
                sessions.add(session_dir.name)
                
                if latest_session is None:
                    latest_session = session_dir.name
                
                photo_files = list(session_dir.glob("shot-*.jpg")) + list(session_dir.glob("photo_*.jpg"))
                total_photos += len(photo_files)
                
                for photo_file in photo_files:
                    total_size += photo_file.stat().st_size
        
        return GalleryStats(
            total_sessions=len(sessions),
            total_photos=total_photos,
            latest_session=latest_session,
            total_size_mb=round(total_size / (1024 * 1024), 2)
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener estadísticas: {str(e)}"
        )


@router.get("/list", response_model=List[SessionPhotos])
async def list_sessions():
    """
    Lista sesiones con sus fotos y strip/duplicado si existen.
    """
    try:
        if not PHOTOS_DIR.exists():
            return []

        session_dirs = sorted(
            [d for d in PHOTOS_DIR.iterdir() if d.is_dir()],
            key=lambda x: x.name,
            reverse=True,
        )

        sessions: List[SessionPhotos] = []

        for session_dir in session_dirs:
            session_id = session_dir.name
            photos: List[PhotoInfo] = []
            total_size = 0

            photo_files = sorted(
                list(session_dir.glob("shot-*.jpg")) + list(session_dir.glob("photo_*.jpg")),
                key=lambda x: x.name,
            )

            for photo_file in photo_files:
                stat = photo_file.stat()
                total_size += stat.st_size
                thumb_candidate = session_dir / f"thumb-{photo_file.stem.replace('shot-', '')}.jpg"
                thumb_url = get_photo_url(thumb_candidate) if thumb_candidate.exists() else None
                photos.append(
                    PhotoInfo(
                        id=photo_file.stem,
                        filename=photo_file.name,
                        path=str(photo_file),
                        url=get_photo_url(photo_file),
                        thumbnail_url=thumb_url,
                        session_id=session_id,
                        timestamp=datetime.fromtimestamp(stat.st_mtime).isoformat(),
                        size_bytes=stat.st_size,
                    )
                )

            strip_path = session_dir / "strip.jpg"
            full_strip_path = session_dir / "full_strip.jpg"

            sessions.append(
                SessionPhotos(
                    session_id=session_id,
                    photos=photos,
                    strip_url=get_photo_url(strip_path) if strip_path.exists() else None,
                    full_strip_url=get_photo_url(full_strip_path) if full_strip_path.exists() else None,
                    total_size_bytes=total_size,
                    created_at=SessionService.get_session(session_id).created_at if SessionService.get_session(session_id) else None,
                )
            )

        return sessions

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al listar sesiones: {str(e)}",
        )


@router.post("/export-zip")
async def export_photos_zip():
    """
    Exporta todas las fotos del evento en un archivo ZIP.
    """
    try:
        # Crear nombre del ZIP con timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        zip_filename = f"photobooth_event_{timestamp}.zip"
        zip_path = TEMP_DIR / zip_filename
        
        # Crear ZIP
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            if PHOTOS_DIR.exists():
                # Recorrer todas las sesiones
                for session_dir in PHOTOS_DIR.iterdir():
                    if session_dir.is_dir():
                        session_name = session_dir.name
                        
                        # Agregar todas las fotos de esta sesión
                        for photo_file in session_dir.glob("*.jpg"):
                            arcname = f"{session_name}/{photo_file.name}"
                            zipf.write(photo_file, arcname)
        
        # Verificar que se creó el ZIP
        if not zip_path.exists():
            raise HTTPException(
                status_code=500,
                detail="Error al crear archivo ZIP"
            )
        
        # Retornar el archivo
        return FileResponse(
            zip_path,
            media_type="application/zip",
            filename=zip_filename,
            headers={
                "Content-Disposition": f"attachment; filename={zip_filename}"
            }
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al exportar ZIP: {str(e)}"
        )


@router.post("/sessions/{session_id}/zip")
async def export_session_zip(session_id: str):
    """
    Exporta una sesión específica a ZIP.
    """
    try:
        session_dir = PHOTOS_DIR / session_id
        if not session_dir.exists():
            raise HTTPException(404, f"Sesión no encontrada: {session_id}")

        zip_filename = f"session_{session_id}.zip"
        zip_path = TEMP_DIR / zip_filename

        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file in session_dir.glob("*.jpg"):
                zipf.write(file, arcname=file.name)

        if not zip_path.exists():
            raise HTTPException(500, "Error al crear ZIP de sesión")

        return FileResponse(
            zip_path,
            media_type="application/zip",
            filename=zip_filename,
            headers={"Content-Disposition": f"attachment; filename={zip_filename}"},
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al exportar sesión: {str(e)}")


@router.delete("/sessions/{session_id}/photos/{filename}")
async def delete_photo(session_id: str, filename: str):
    """Elimina una foto individual de una sesión.

    No toca metadata de sesiones; solo elimina el archivo físico y limpia
    la carpeta de sesión si queda vacía.
    """
    try:
        session_dir = PHOTOS_DIR / session_id
        photo_path = session_dir / filename

        if not photo_path.exists() or not photo_path.is_file():
            raise HTTPException(
                status_code=404,
                detail=f"Foto no encontrada: {session_id}/{filename}",
            )

        photo_path.unlink()

        # Eliminar carpeta de sesión si está vacía
        if session_dir.exists() and not any(session_dir.iterdir()):
            session_dir.rmdir()

        return {
            "success": True,
            "message": f"Foto {filename} eliminada de sesión {session_id}",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al eliminar foto: {str(e)}",
        )


@router.delete("/clear-all")
async def clear_all_photos():
    """
    PELIGRO: Elimina TODAS las fotos del evento.
    Solo para staff/admin.
    """
    try:
        deleted_count = 0
        
        if PHOTOS_DIR.exists():
            for session_dir in PHOTOS_DIR.iterdir():
                if session_dir.is_dir():
                    for photo_file in session_dir.glob("photo_*.jpg"):
                        photo_file.unlink()
                        deleted_count += 1
                    
                    # Eliminar carpeta de sesión si está vacía
                    if not any(session_dir.iterdir()):
                        session_dir.rmdir()
        
        return {
            "success": True,
            "message": f"{deleted_count} fotos eliminadas",
            "deleted_count": deleted_count
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al limpiar fotos: {str(e)}"
        )
