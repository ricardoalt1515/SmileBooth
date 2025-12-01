"""API de Impresión"""
from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from PIL import Image, ImageDraw, ImageFont

from app.services.print_service import PrintService
from app.services.print_queue import PrintQueueService, PrintJobRecord
from app.config import TEMP_DIR
from app.api.settings import load_settings

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


class PrintJob(BaseModel):
    job_id: str
    file_path: str
    printer_name: str | None
    copies: int
    status: str
    error: str | None = None
    created_at: str
    updated_at: str


@router.post("/queue", response_model=PrintResponse)
async def queue_print(request: PrintRequest):
    """
    Envía una imagen a imprimir.
    """
    try:
        file_path = PrintService.resolve_data_path(request.file_path)
        job = PrintQueueService.add_job(str(file_path), request.printer_name, request.copies)

        if not file_path.exists():
            raise HTTPException(404, f"Archivo no encontrado: {file_path}")

        printer_name = request.printer_name or PrintService.get_default_printer()
        if not printer_name:
            # Fallback silencioso para evitar crash en UI
            print("⚠️ No printer found for queue, using Virtual Fallback")
            printer_name = "Virtual_Printer_Fallback"

        # Verificar modo de impresión (dual-strip vs single)
        settings = load_settings()
        final_path = file_path

        # Evitar duplicar nuevamente si ya estamos recibiendo un full_strip
        # (por ejemplo, cuando el frontend manda full_page_path creado en compose-strip).
        is_already_full_strip = file_path.name.lower().startswith("full_strip") or "full_strip" in file_path.name.lower()

        if settings.print_mode == "dual-strip" and not is_already_full_strip:
            from app.services.image_service import ImageService
            try:
                # Generar composición 4x6 con dos tiras
                print(f"✂️ Generando dual-strip para: {file_path.name}")
                final_path = ImageService.create_duplicate_strip(file_path)
            except Exception as e:
                print(f"⚠️ Error generando dual-strip, imprimiendo original: {e}")
                # Fallback al original si falla la duplicación

        success = PrintService.print_image(
            final_path,
            printer_name,
            request.copies
        )

        if success:
            PrintQueueService.update_status(job.job_id, "sent", None)
            return PrintResponse(
                success=True,
                message=f"{request.copies} copias enviadas a impresora ({settings.print_mode})",
                printer_used=printer_name
            )

        raise HTTPException(500, "Error al imprimir")

    except HTTPException:
        raise
    except Exception as e:
        if 'job' in locals():
            PrintQueueService.update_status(job.job_id, "failed", str(e))
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


@router.post("/test", response_model=PrintResponse)
async def test_print(printer_name: str | None = None):
    """
    Genera y envía una página de prueba pequeña para validar conexión/rotación.
    """
    try:
        settings = load_settings()
        target_printer = printer_name or settings.default_printer or PrintService.get_default_printer()
        if not target_printer:
            raise HTTPException(400, "No hay impresora configurada")

        TEMP_DIR.mkdir(parents=True, exist_ok=True)
        ticket_path = TEMP_DIR / "print_test_ticket.jpg"

        if settings.paper_size == "5x7":
            width, height = (1400, 2000)
        elif settings.paper_size == "2x6":
            width, height = (600, 1800)
        else:
            width, height = (1200, 1800)
        ticket = Image.new("RGB", (width, height), "white")
        draw = ImageDraw.Draw(ticket)
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        lines = [
            "PhotoBooth Test",
            f"Fecha: {now}",
            f"Copias por defecto: {settings.print_copies}",
            f"Modo: {settings.print_mode}",
            f"Papel: {settings.paper_size}",
        ]
        try:
            font = ImageFont.truetype("arial.ttf", 36)
        except Exception:
            font = ImageFont.load_default()

        y = 80
        for line in lines:
            draw.text((60, y), line, fill="black", font=font)
            y += 80

        ticket.save(ticket_path, quality=90)

        PrintService.print_image(ticket_path, target_printer, copies=1)

        return PrintResponse(
            success=True,
            message="Página de prueba enviada",
            printer_used=target_printer,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error al enviar prueba: {str(e)}")


@router.get("/jobs", response_model=list[PrintJob])
async def list_jobs(limit: int = 50):
    """
    Devuelve trabajos de impresión recientes (persistencia simple en disco).
    """
    try:
        PrintQueueService.cleanup_old_jobs()
        records = PrintQueueService.list_jobs(limit=limit)
        return [PrintJob(**record.to_dict()) for record in records]
    except Exception as e:
        raise HTTPException(500, f"Error al listar trabajos: {str(e)}")


@router.post("/jobs/{job_id}/retry", response_model=PrintResponse)
async def retry_job(job_id: str):
    """
    Reintenta un trabajo fallido o pendiente usando el mismo archivo/copias/impresora.
    """
    try:
        job = PrintQueueService.get_job(job_id)
        if job is None:
            raise HTTPException(404, f"Trabajo no encontrado: {job_id}")

        file_path = PrintService.resolve_data_path(job.file_path)
        if not file_path.exists():
            PrintQueueService.update_status(job.job_id, "failed", "Archivo no encontrado en reintento")
            raise HTTPException(404, f"Archivo no encontrado: {file_path}")

        printer = job.printer_name or PrintService.get_default_printer()
        if not printer:
            raise HTTPException(400, "No hay impresora configurada")

        success = PrintService.print_image(file_path, printer, job.copies)
        if success:
            PrintQueueService.update_status(job.job_id, "sent", None)
            return PrintResponse(success=True, message="Trabajo reintentado con éxito", printer_used=printer)

        PrintQueueService.update_status(job.job_id, "failed", "Error al imprimir en reintento")
        raise HTTPException(500, "Error al imprimir en reintento")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error al reintentar trabajo: {str(e)}")
