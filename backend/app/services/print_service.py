"""
Servicio de Impresión - Optimizado para macOS/Windows
- Impresión directa sin diálogos
- Manejo de cola
- Detección automática de impresora
"""
import platform
from pathlib import Path
from typing import Optional, List
import subprocess


class PrintService:
    """Servicio de impresión multiplataforma"""
    
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
            print(f"Error al detectar impresoras: {e}")
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
        """Obtiene la impresora predeterminada"""
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
                return None
                
            elif system == "Windows":
                import win32print
                return win32print.GetDefaultPrinter()
                
            return None
        except Exception as e:
            print(f"Error al obtener impresora predeterminada: {e}")
            return None
    
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
        if not image_path.exists():
            raise FileNotFoundError(f"Imagen no encontrada: {image_path}")
        
        system = platform.system()
        
        try:
            if system == "Darwin":  # macOS
                return PrintService._print_macos(image_path, printer_name, copies)
            elif system == "Windows":
                return PrintService._print_windows(image_path, printer_name, copies)
            else:
                print(f"Sistema no soportado: {system}")
                return False
        except Exception as e:
            print(f"Error al imprimir: {e}")
            return False
    
    @staticmethod
    def _print_macos(
        image_path: Path,
        printer_name: Optional[str],
        copies: int
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
                '-o', 'media=Custom.4x6in',  # Tamaño 4x6"
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
        copies: int
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
