"""
API de Impresión
"""
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.print_service import PrintService

router = APIRouter(prefix="/api/print", tags=["print"])


class PrintRequest(BaseModel):
    file_path: str
    printer_name: str | None = None
    copies: int = 2


class PrintResponse(BaseModel):
    success: bool
    message: str
    printer_used: str | None = None


class PrintersListResponse(BaseModel):
    printers: list[str]
    default_printer: str | None


@router.post("/queue", response_model=PrintResponse)
async def queue_print(request: PrintRequest):
    """
    Envía una imagen a imprimir.
    """
    try:
        file_path = Path(request.file_path)
        
        if not file_path.exists():
            raise HTTPException(404, f"Archivo no encontrado: {file_path}")
        
        # Obtener impresora a usar
        printer_name = request.printer_name or PrintService.get_default_printer()
        
        # Imprimir
        success = PrintService.print_image(
            file_path,
            printer_name,
            request.copies
        )
        
        if success:
            return PrintResponse(
                success=True,
                message=f"{request.copies} copias enviadas a impresora",
                printer_used=printer_name
            )
        else:
            raise HTTPException(500, "Error al imprimir")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error al imprimir: {str(e)}")


@router.get("/printers", response_model=PrintersListResponse)
async def list_printers():
    """
    Lista impresoras disponibles.
    """
    try:
        printers = PrintService.get_available_printers()
        default = PrintService.get_default_printer()
        
        return PrintersListResponse(
            printers=printers,
            default_printer=default
        )
    except Exception as e:
        raise HTTPException(500, f"Error al listar impresoras: {str(e)}")
