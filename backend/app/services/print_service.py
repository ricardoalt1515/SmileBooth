"""
Servicio de Impresión - Optimizado para macOS/Windows
- Impresión directa sin diálogos
- Manejo de cola
- Detección automática de impresora
"""
import json
import platform
from pathlib import Path
from typing import Optional, List
import subprocess
import os

from app.config import DATA_DIR
from app.api.settings import load_settings
from app.logging_config import logger

PRINT_SIMULATION = os.getenv("PRINT_SIMULATION", "0") == "1"


class PrintService:
    """Servicio de impresión multiplataforma"""
    
    @staticmethod
    def resolve_data_path(file_path: str) -> Path:
        """Normaliza rutas de archivos a paths reales en disco.

        Acepta:
        - URLs tipo "/data/..." que vienen del frontend
        - Rutas relativas "data/..." internas
        - Rutas relativas dentro de DATA_DIR
        - Rutas absolutas reales (no prefijadas con /data)
        """
        if not file_path or not str(file_path).strip():
            raise ValueError("file_path vacío en resolve_data_path")

        path_str = str(file_path)

        # Mapear mount "/data/..." al directorio DATA_DIR (fail fast para el caso común)
        if path_str.startswith('/data/'):
            relative = path_str.replace('/data/', '')
            return DATA_DIR / relative

        # Soportar rutas relativas "data/..." sin slash inicial
        if path_str.startswith('data/'):
            relative = path_str.replace('data/', '')
            return DATA_DIR / relative

        candidate = Path(path_str)

        # Para rutas absolutas reales (no del mount /data), respetar tal cual
        if candidate.is_absolute():
            return candidate

        # Fallback: tratar como ruta relativa dentro de DATA_DIR
        return DATA_DIR / candidate

    # ---------- Helpers de configuración ----------

    @staticmethod
    def _load_default_printer_from_settings() -> Optional[str]:
        """Lee default_printer desde settings.json si existe.

        Mantiene la lógica de configuración en un solo lugar
        y evita depender de routers FastAPI.
        """
        settings_file = DATA_DIR / "config" / "settings.json"

        if not settings_file.exists():
            return None

        try:
            with settings_file.open("r", encoding="utf-8") as file:
                data = json.load(file)
            # Fail fast: cadena vacía cuenta como no configurada
            printer = (data or {}).get("default_printer")
            if isinstance(printer, str) and printer.strip():
                return printer.strip()
            return None
        except Exception as exc:  # pragma: no cover - solo logging defensivo
            logger.error(f"Error leyendo default_printer de settings.json: {exc}")
            return None

    @staticmethod
    def get_available_printers() -> List[str]:
        """
        Detecta impresoras disponibles en el sistema.
        """
        system = platform.system()
        
        try:
            if system == "Darwin":  # macOS
                return PrintService._get_printers_macos()
            elif system == "Windows":
                return PrintService._get_printers_windows()
            else:
                return []
        except Exception as e:
            logger.error(f"Error al detectar impresoras: {e}")
            return []
    
    @staticmethod
    def _get_printers_macos() -> List[str]:
        """Detecta impresoras en macOS usando lpstat"""
        try:
            result = subprocess.run(
                ['lpstat', '-p'],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                printers = []
                for line in lines:
                    if line.startswith('printer'):
                        # Formato: "printer Canon_CP1500 is idle..."
                        parts = line.split()
                        if len(parts) >= 2:
                            printers.append(parts[1])
                return printers
            return []
        except Exception as e:
            print(f"Error en lpstat: {e}")
            return []
    
    @staticmethod
    def _get_printers_windows() -> List[str]:
        """Detecta impresoras en Windows"""
        try:
            import win32print
            printers = []
            for printer in win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL):
                printers.append(printer[2])  # Nombre de la impresora
            return printers
        except ImportError:
            print("win32print no disponible")
            return []
        except Exception as e:
            print(f"Error al listar impresoras Windows: {e}")
            return []
    
    @staticmethod
    def get_default_printer() -> Optional[str]:
        """Obtiene la impresora predeterminada.

        Orden de prioridad:
        1) Impresora configurada en settings.json (default_printer)
        2) Modo simulación (PRINT_SIMULATION)
        3) Impresora predeterminada del sistema operativo
        """
        # 1) Intentar usar la impresora configurada en settings.json
        configured = PrintService._load_default_printer_from_settings()
        if configured:
            return configured

        # 2) Modo simulación: forzar impresora ficticia en desarrollo/pruebas
        if PRINT_SIMULATION:
            return "SIMULATED_PRINTER"

        # 3) Fallback al default del sistema operativo
        system = platform.system()

        try:
            if system == "Darwin":  # macOS
                result = subprocess.run(
                    ['lpstat', '-d'],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                if result.returncode == 0:
                    # Formato: "system default destination: Canon_CP1500"
                    output = result.stdout.strip()
                    if 'destination:' in output:
                        return output.split('destination:')[1].strip()

            elif system == "Windows":
                import win32print
                return win32print.GetDefaultPrinter()

            return None
        except Exception as e:  # pragma: no cover - dependiente de SO
            logger.error(f"Error al obtener impresora predeterminada: {e}")
            return "Virtual_Printer_Fallback"
        
        # Si llegamos aquí y no hay impresora, devolver fallback para evitar crash
        return "Virtual_Printer_Fallback"
    
    @staticmethod
    def print_image(
        image_path: Path,
        printer_name: Optional[str] = None,
        copies: int = 1
    ) -> bool:
        """
        Imprime una imagen directamente.
        
        Args:
            image_path: Ruta a la imagen
            printer_name: Nombre de la impresora (None = predeterminada)
            copies: Número de copias
        
        Returns:
            True si la impresión fue exitosa
        """
        if PRINT_SIMULATION or printer_name == "Virtual_Printer_Fallback":
            target_printer = printer_name or "SIMULATED_PRINTER"
            logger.info(f"SIMULATED PRINT -> {image_path} x{copies} on {target_printer}")
            return True

        if not image_path.exists():
            raise FileNotFoundError(f"Imagen no encontrada: {image_path}")
        
        system = platform.system()
        settings = load_settings()
        media_options = {
            "2x6": ("Custom.2x6in", (508, 1524)),    # 2x6 pulgadas
            "4x6": ("Custom.4x6in", (1016, 1524)),   # tenths of millimeters
            "5x7": ("Custom.5x7in", (1270, 1778)),
        }
        media_option, media_size = media_options.get(settings.paper_size, media_options["4x6"])

        try:
            if system == "Darwin":  # macOS
                return PrintService._print_macos(image_path, printer_name, copies, media_option)
            elif system == "Windows":
                return PrintService._print_windows(image_path, printer_name, copies, media_size)
            else:
                print(f"Sistema no soportado: {system}")
                return False
        except Exception as e:
            logger.error(f"Error al imprimir: {e}", exc_info=True)
            return False
    
    @staticmethod
    def _print_macos(
        image_path: Path,
        printer_name: Optional[str],
        copies: int,
        media_option: str,
    ) -> bool:
        """
        Imprime en macOS usando lp o lpr.
        """
        try:
            # Construir comando lp
            cmd = ['lp']
            
            # Especificar impresora si se proporciona
            if printer_name:
                cmd.extend(['-d', printer_name])
            
            # Número de copias
            if copies > 1:
                cmd.extend(['-n', str(copies)])
            
            # Opciones de impresión para calidad
            cmd.extend([
                '-o', f'media={media_option}',
                '-o', 'fit-to-page',
                '-o', 'print-quality=5',  # Máxima calidad
            ])
            
            # Archivo a imprimir
            cmd.append(str(image_path))
            
            # Ejecutar comando
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                print(f"✅ Impresión enviada: {image_path.name}")
                return True
            else:
                print(f"❌ Error en impresión: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"Error en _print_macos: {e}")
            return False
    
    @staticmethod
    def _print_windows(
        image_path: Path,
        printer_name: Optional[str],
        copies: int,
        media_size: tuple[int, int],
    ) -> bool:
        """
        Imprime en Windows usando win32print.
        """
        try:
            import win32print
            import win32ui
            from PIL import Image, ImageWin
            
            # Obtener impresora
            if printer_name is None:
                printer_name = win32print.GetDefaultPrinter()
            
            # Abrir impresora
            hprinter = win32print.OpenPrinter(printer_name)
            
            try:
                # Crear contexto de dispositivo
                hdc = win32ui.CreateDC()
                hdc.CreatePrinterDC(printer_name)

                # Ajustar tamaño de papel en DEVMODE si es posible
                try:
                    devmode = hdc.GetDevMode()
                    # dmPaperWidth y dmPaperLength están en décimas de mm
                    devmode.PaperWidth, devmode.PaperLength = media_size
                    hdc.ResetDC(devmode)
                except Exception as e:
                    print(f"No se pudo ajustar tamaño de papel: {e}")
                
                # Cargar imagen
                img = Image.open(image_path)
                
                # Imprimir las copias solicitadas
                for copy in range(copies):
                    # Iniciar trabajo
                    hdc.StartDoc(f"{image_path.name} - Copia {copy + 1}")
                    hdc.StartPage()
                    
                    # Preparar imagen
                    dib = ImageWin.Dib(img)
                    
                    # Obtener dimensiones de la página
                    printable_width = hdc.GetDeviceCaps(8)  # HORZRES
                    printable_height = hdc.GetDeviceCaps(10)  # VERTRES
                    
                    # Calcular escala manteniendo aspect ratio
                    img_width, img_height = img.size
                    scale_w = printable_width / img_width
                    scale_h = printable_height / img_height
                    scale = min(scale_w, scale_h)
                    
                    scaled_width = int(img_width * scale)
                    scaled_height = int(img_height * scale)
                    
                    # Centrar imagen
                    x = (printable_width - scaled_width) // 2
                    y = (printable_height - scaled_height) // 2
                    
                    # Dibujar
                    dib.draw(hdc.GetHandleOutput(), (x, y, x + scaled_width, y + scaled_height))
                    
                    # Finalizar página
                    hdc.EndPage()
                    hdc.EndDoc()
                
                # Liberar recursos
                hdc.DeleteDC()
                
                print(f"✅ {copies} copias enviadas a impresora")
                return True
                
            finally:
                win32print.ClosePrinter(hprinter)
                
        except ImportError:
            print("win32print no disponible")
            return False
        except Exception as e:
            print(f"Error en _print_windows: {e}")
            return False
