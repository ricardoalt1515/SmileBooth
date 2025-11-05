"""
API de Diseños Personalizados
Sistema drag & drop para diseños desde Canva
"""
import shutil
from pathlib import Path
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from PIL import Image

from app.config import DESIGNS_DIR

router = APIRouter(prefix="/api/designs", tags=["designs"])


class DesignInfo(BaseModel):
    id: str
    name: str
    file_path: str
    preview_url: str
    is_active: bool
    created_at: str


class DesignsListResponse(BaseModel):
    designs: list[DesignInfo]
    active_design: DesignInfo | None


class UploadResponse(BaseModel):
    success: bool
    design_id: str
    file_path: str
    message: str


# Variable global para diseño activo (simple para MVP)
# TODO: Mover a database en producción
_active_design: str | None = None


@router.post("/upload", response_model=UploadResponse)
async def upload_design(
    file: UploadFile = File(...),
    name: str | None = None
):
    """
    Sube un diseño personalizado (drag & drop desde Canva).
    
    Proceso:
    1. Usuario exporta diseño desde Canva (PNG/JPG)
    2. Arrastra archivo aquí o lo selecciona
    3. Sistema valida y guarda
    4. Listo para usar en próximas sesiones
    """
    try:
        # Validar que sea imagen
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(400, "Solo se permiten imágenes (PNG/JPG)")
        
        # Generar nombre único
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        ext = Path(file.filename or "design.png").suffix
        design_id = f"design_{timestamp}"
        filename = f"{design_id}{ext}"
        
        # Crear carpeta custom si no existe
        custom_dir = DESIGNS_DIR / "custom"
        custom_dir.mkdir(parents=True, exist_ok=True)
        
        # Ruta completa
        file_path = custom_dir / filename
        
        # Guardar archivo
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Validar y ajustar dimensiones si es necesario
        img = Image.open(file_path)
        
        # Tamaño recomendado: 600x450px
        if img.size != (600, 450):
            # Redimensionar
            img_resized = img.resize((600, 450), Image.Resampling.LANCZOS)
            img_resized.save(file_path, quality=95)
            img.close()
            print(f"⚠️  Diseño redimensionado de {img.size} a (600, 450)")
        else:
            img.close()
        
        design_name = name or file.filename or "Diseño personalizado"
        
        return UploadResponse(
            success=True,
            design_id=design_id,
            file_path=str(file_path),
            message=f"Diseño '{design_name}' subido correctamente"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error al subir diseño: {str(e)}")


@router.get("/list", response_model=DesignsListResponse)
async def list_designs():
    """
    Lista todos los diseños disponibles.
    """
    try:
        designs: list[DesignInfo] = []
        
        # Buscar en carpeta custom
        custom_dir = DESIGNS_DIR / "custom"
        if custom_dir.exists():
            for file_path in custom_dir.glob("design_*.*"):
                if file_path.suffix.lower() in ['.png', '.jpg', '.jpeg']:
                    design_id = file_path.stem
                    
                    # Obtener info del archivo
                    stat = file_path.stat()
                    created_at = datetime.fromtimestamp(stat.st_ctime)
                    
                    designs.append(DesignInfo(
                        id=design_id,
                        name=file_path.name,
                        file_path=str(file_path),
                        preview_url=f"/api/designs/preview/{design_id}",
                        is_active=(design_id == _active_design),
                        created_at=created_at.isoformat()
                    ))
        
        # Ordenar por fecha (más recientes primero)
        designs.sort(key=lambda d: d.created_at, reverse=True)
        
        # Obtener diseño activo
        active = next((d for d in designs if d.is_active), None)
        
        return DesignsListResponse(
            designs=designs,
            active_design=active
        )
        
    except Exception as e:
        raise HTTPException(500, f"Error al listar diseños: {str(e)}")


@router.put("/set-active/{design_id}")
async def set_active_design(design_id: str):
    """
    Activa un diseño para usar en las próximas sesiones.
    """
    global _active_design
    
    try:
        # Buscar diseño
        custom_dir = DESIGNS_DIR / "custom"
        design_files = list(custom_dir.glob(f"{design_id}.*"))
        
        if not design_files:
            raise HTTPException(404, f"Diseño no encontrado: {design_id}")
        
        # Activar
        _active_design = design_id
        
        return {
            "success": True,
            "message": f"Diseño '{design_id}' activado",
            "active_design_id": design_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error al activar diseño: {str(e)}")


@router.get("/active")
async def get_active_design():
    """
    Obtiene el diseño actualmente activo.
    """
    if _active_design is None:
        return {"active_design": None}
    
    custom_dir = DESIGNS_DIR / "custom"
    design_files = list(custom_dir.glob(f"{_active_design}.*"))
    
    if not design_files:
        return {"active_design": None}
    
    file_path = design_files[0]
    
    return {
        "active_design": {
            "id": _active_design,
            "file_path": str(file_path)
        }
    }


@router.delete("/delete/{design_id}")
async def delete_design(design_id: str):
    """
    Elimina un diseño.
    """
    global _active_design
    
    try:
        custom_dir = DESIGNS_DIR / "custom"
        design_files = list(custom_dir.glob(f"{design_id}.*"))
        
        if not design_files:
            raise HTTPException(404, f"Diseño no encontrado: {design_id}")
        
        # Eliminar archivo
        for file in design_files:
            file.unlink()
        
        # Si era el activo, desactivar
        if _active_design == design_id:
            _active_design = None
        
        return {
            "success": True,
            "message": f"Diseño '{design_id}' eliminado"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error al eliminar diseño: {str(e)}")
