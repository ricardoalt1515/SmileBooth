"""
Servicio de composición de imágenes - OPTIMIZADO

Características:
- Procesamiento en chunks
- Liberación agresiva de memoria
- Compresión eficiente
- Dimensiones dinámicas según número de fotos (1-6 fotos)
- Sin magic numbers (todos los valores tienen nombres descriptivos)
- Cálculo automático de altura del canvas
- DRY: reutilización de constantes

Clean Code Principles Applied:
- Avoid magic numbers: todas las constantes con nombres claros
- Good naming: variables descriptivas (STRIP_WIDTH, TOP_MARGIN, etc.)
- Fail fast: validación temprana del número de fotos
- One purpose per variable: cada variable tiene un propósito claro
- Functions return results: no side effects, retorna Path
"""
import gc
from pathlib import Path
from typing import List, Optional
from PIL import Image, ImageDraw, ImageFont

from app.config import IMAGE_CONFIG, STRIPS_DIR


def hex_to_rgb(hex_color: str) -> tuple:
    """
    Convierte color hexadecimal a tupla RGB.
    
    Args:
        hex_color: Color en formato hex (#RRGGBB o RRGGBB)
        
    Returns:
        Tupla (R, G, B) con valores 0-255
        
    Example:
        hex_to_rgb("#c60c0c") -> (198, 12, 12)
        hex_to_rgb("ffffff") -> (255, 255, 255)
    """
    # Remover '#' si existe
    hex_color = hex_color.lstrip('#')
    
    # Convertir a RGB
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


class ImageService:
    """Servicio ligero de composición de tiras"""
    
    @staticmethod
    def compose_strip(
        photo_paths: List[Path],
        design_path: Optional[Path] = None,
        session_id: str = None,
        # Template metadata (optional)
        layout: Optional[str] = None,
        design_position: Optional[str] = None,
        background_color: Optional[str] = None,
        photo_spacing: Optional[int] = None
    ) -> Path:
        """
        Compone una tira de fotos + diseño personalizado.
        Soporta de 1 a 6 fotos dependiendo del layout.
        Optimizado para liberar memoria progresivamente.
        
        Args:
            photo_paths: Lista de rutas de fotos
            design_path: Ruta del diseño (opcional)
            session_id: ID de sesión para organizar archivos
            layout: Layout del template (ej: "4x1-vertical")
            design_position: Posición del diseño ("top", "bottom")
            background_color: Color de fondo en hex (ej: "#ffffff")
            photo_spacing: Espaciado entre fotos en px
        
        Returns:
            Path del strip generado
        """
        # Fail fast: validar número de fotos
        if not photo_paths or len(photo_paths) > 6:
            raise ValueError(f"Se requieren entre 1 y 6 fotos, recibido: {len(photo_paths)}")
        
        # Configuración base (evitar magic numbers, usar defaults si no se proveen)
        STRIP_WIDTH = IMAGE_CONFIG["strip_width"]
        BASE_PHOTO_HEIGHT = IMAGE_CONFIG["photo_height"]
        DESIGN_HEIGHT = IMAGE_CONFIG["design_height"]
        TOP_MARGIN = 30
        BOTTOM_MARGIN = 30
        PHOTO_SPACING = photo_spacing if photo_spacing is not None else 5
        
        # Convertir color de fondo de hex a RGB (PIL requiere tupla RGB)
        if background_color and background_color.startswith('#'):
            BACKGROUND_COLOR = hex_to_rgb(background_color)
            print(f"🎨 Color de fondo: {background_color} -> RGB{BACKGROUND_COLOR}")
        elif background_color:
            BACKGROUND_COLOR = background_color  # Ya es nombre de color o tupla
            print(f"🎨 Color de fondo: {BACKGROUND_COLOR}")
        else:
            BACKGROUND_COLOR = 'white'  # Default
            print(f"🎨 Color de fondo: white (default)")
        
        # Calcular altura total del canvas dinámicamente
        num_photos = len(photo_paths)
        total_photos_height = (BASE_PHOTO_HEIGHT * num_photos) + (PHOTO_SPACING * (num_photos - 1))
        design_section_height = DESIGN_HEIGHT + PHOTO_SPACING if design_path and design_path.exists() else 0
        strip_height = TOP_MARGIN + total_photos_height + design_section_height + BOTTOM_MARGIN
        
        # Crear canvas con color de fondo personalizado
        strip = Image.new('RGB', (STRIP_WIDTH, strip_height), BACKGROUND_COLOR)
        
        try:
            # Y offset inicial
            y_offset = TOP_MARGIN
            
            # 1. Procesar y agregar las fotos UNA POR UNA
            for i, photo_path in enumerate(photo_paths):
                # Cargar foto
                photo = Image.open(photo_path)
                
                # Procesar foto
                photo_processed = ImageService._process_photo(
                    photo, 
                    STRIP_WIDTH - 50,  # Ancho con margen lateral
                    BASE_PHOTO_HEIGHT
                )
                
                # Liberar foto original
                photo.close()
                del photo
                
                # Calcular posición centrada
                x_pos = (STRIP_WIDTH - photo_processed.width) // 2
                
                # Pegar en strip
                strip.paste(photo_processed, (x_pos, y_offset))
                
                # Liberar foto procesada
                photo_processed.close()
                del photo_processed
                
                # Forzar limpieza de memoria
                gc.collect()
                
                # Siguiente posición
                y_offset += BASE_PHOTO_HEIGHT + PHOTO_SPACING
            
            # 2. Agregar diseño si existe
            if design_path and design_path.exists():
                design = Image.open(design_path)
                
                # Redimensionar si es necesario
                if design.size != (STRIP_WIDTH, DESIGN_HEIGHT):
                    design = design.resize(
                        (STRIP_WIDTH, DESIGN_HEIGHT),
                        Image.Resampling.LANCZOS
                    )
                
                # Posición del diseño (al final después de todas las fotos)
                design_y = y_offset
                
                # Si tiene transparencia, componer correctamente
                if design.mode == 'RGBA':
                    bg = Image.new('RGB', design.size, 'white')
                    bg.paste(design, (0, 0), design)
                    strip.paste(bg, (0, design_y))
                    bg.close()
                else:
                    strip.paste(design, (0, design_y))
                
                # Liberar diseño
                design.close()
                del design
                gc.collect()
            
            # 3. Guardar strip
            output_dir = STRIPS_DIR / session_id if session_id else STRIPS_DIR
            output_dir.mkdir(parents=True, exist_ok=True)
            
            output_filename = f"strip_{session_id}.jpg"
            output_path = output_dir / output_filename
            
            # Guardar con compresión optimizada
            strip.save(
                output_path,
                format=IMAGE_CONFIG["format"],
                quality=IMAGE_CONFIG["quality"],
                dpi=IMAGE_CONFIG["dpi"],
                optimize=True  # Optimizar tamaño de archivo
            )
            
            return output_path
            
        finally:
            # Liberar strip
            if strip:
                strip.close()
                del strip
            gc.collect()
    
    @staticmethod
    def _process_photo(
        photo: Image.Image,
        target_width: int,
        target_height: int
    ) -> Image.Image:
        """
        Redimensiona y recorta foto para llenar espacio exacto.
        """
        # Calcular ratios
        img_ratio = photo.width / photo.height
        target_ratio = target_width / target_height
        
        if img_ratio > target_ratio:
            # Imagen más ancha: ajustar por altura
            new_height = target_height
            new_width = int(new_height * img_ratio)
        else:
            # Imagen más alta: ajustar por ancho
            new_width = target_width
            new_height = int(new_width / img_ratio)
        
        # Redimensionar
        resized = photo.resize(
            (new_width, new_height),
            Image.Resampling.LANCZOS
        )
        
        # Recortar al centro
        left = (new_width - target_width) // 2
        top = (new_height - target_height) // 2
        right = left + target_width
        bottom = top + target_height
        
        cropped = resized.crop((left, top, right, bottom))
        
        # Liberar resized
        resized.close()
        del resized
        
        return cropped
    
    @staticmethod
    def create_duplicate_strip(strip_path: Path) -> Path:
        """
        Crea imagen con 2 tiras idénticas lado a lado.
        Se ajusta dinámicamente a la altura del strip original.
        """
        strip = Image.open(strip_path)
        
        try:
            # Dimensiones dinámicas basadas en el strip original
            STRIP_WIDTH = strip.width
            STRIP_HEIGHT = strip.height
            FULL_PAGE_WIDTH = STRIP_WIDTH * 2  # Dos tiras lado a lado
            FULL_PAGE_HEIGHT = STRIP_HEIGHT
            CUT_LINE_COLOR = (200, 200, 200)
            CUT_LINE_DASH_LENGTH = 10
            CUT_LINE_GAP = 20
            
            # Crear canvas con altura dinámica
            full_page = Image.new('RGB', (FULL_PAGE_WIDTH, FULL_PAGE_HEIGHT), 'white')
            
            # Pegar ambas copias
            full_page.paste(strip, (0, 0))
            full_page.paste(strip, (STRIP_WIDTH, 0))
            
            # Agregar línea de corte sutil en el centro
            draw = ImageDraw.Draw(full_page)
            center_x = STRIP_WIDTH - 2  # Línea ligeramente a la izquierda del centro
            for y in range(0, FULL_PAGE_HEIGHT, CUT_LINE_GAP):
                draw.line(
                    [(center_x, y), (center_x, y + CUT_LINE_DASH_LENGTH)],
                    fill=CUT_LINE_COLOR,
                    width=1
                )
            
            # Guardar
            output_path = strip_path.parent / f"full_{strip_path.name}"
            full_page.save(
                output_path,
                format=IMAGE_CONFIG["format"],
                quality=IMAGE_CONFIG["quality"],
                dpi=IMAGE_CONFIG["dpi"],
                optimize=True
            )
            
            return output_path
            
        finally:
            strip.close()
            full_page.close()
            del strip, full_page
            gc.collect()
