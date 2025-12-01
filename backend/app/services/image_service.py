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
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageEnhance

from app.config import IMAGE_CONFIG, STRIPS_DIR, PHOTOS_DIR, get_photo_url
from app.services.session_service import SessionService
from app.models.template import (
    DESIGN_POSITION_TOP,
    DESIGN_POSITION_BOTTOM,
    LAYOUT_VERTICAL_3,
    LAYOUT_VERTICAL_4,
    LAYOUT_VERTICAL_6,
    LAYOUT_GRID_2X2,
    get_layout_dimensions,
)

SUPPORTED_VERTICAL_LAYOUTS = {
    LAYOUT_VERTICAL_3,
    LAYOUT_VERTICAL_4,
    LAYOUT_VERTICAL_6,
}


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
        session_id: Optional[str] = None,
        # Template metadata (optional)
        layout: Optional[str] = None,
        design_position: Optional[str] = None,
        background_color: Optional[str] = None,
        photo_spacing: Optional[int] = None,
        photo_filter: Optional[str] = None,
        # Optional free overlay controls (normalized / scale)
        design_scale: Optional[float] = None,
        design_offset_x: Optional[float] = None,
        design_offset_y: Optional[float] = None,
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
        base_strip_width = IMAGE_CONFIG["strip_width"]
        base_photo_height = IMAGE_CONFIG["photo_height"]
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
        
        # Normalizar filtro de fotos
        photo_filter_normalized = (photo_filter or "none").strip().lower()

        # Determinar layout soportado (solo verticales por ahora)
        layout_clean = (layout or '').strip().lower()
        layout_supported = layout_clean if layout_clean in SUPPORTED_VERTICAL_LAYOUTS else None
        if layout_clean and not layout_supported and layout_clean != LAYOUT_GRID_2X2:
            print(f"⚠️ layout '{layout}' no soportado aún. Usando layout dinámico por defecto.")

        # Determinar posición válida del diseño (solo soportamos top/bottom por ahora)
        design_position_normalized = (design_position or DESIGN_POSITION_BOTTOM).lower()
        if design_position_normalized not in {DESIGN_POSITION_TOP, DESIGN_POSITION_BOTTOM}:
            print(f"⚠️ design_position '{design_position}' no soportado. Usando 'bottom'.")
            design_position_normalized = DESIGN_POSITION_BOTTOM

        design_exists = bool(design_path and design_path.exists())

        # Modo overlay libre si hay diseño y al menos uno de los controles viene definido.
        # Esto mantiene compatibilidad: templates antiguos (sin escala/offsets) siguen
        # usando la banda fija arriba/abajo.
        use_free_overlay = bool(
            design_exists and (
                design_scale is not None
                or design_offset_x is not None
                or design_offset_y is not None
            )
        )

        # Calcular dimensiones objetivo basadas en layout
        strip_width = base_strip_width
        target_strip_height = None
        if layout_supported:
            strip_width, target_strip_height = get_layout_dimensions(layout_supported)  # type: ignore[arg-type]

        # Calcular altura total del canvas dinámicamente
        num_photos = len(photo_paths)
        # Reservar espacio vertical solo para el modo legacy de banda fija.
        if design_exists and not use_free_overlay:
            design_section_height = DESIGN_HEIGHT + PHOTO_SPACING
        else:
            design_section_height = 0

        if target_strip_height:
            available_height = target_strip_height - TOP_MARGIN - BOTTOM_MARGIN - design_section_height
            available_for_photos = available_height - (PHOTO_SPACING * (num_photos - 1))
            if available_for_photos <= 0:
                print("⚠️ Altura insuficiente para fotos con layout fijo. Usando altura base.")
                target_photo_height = base_photo_height
                strip_height = TOP_MARGIN + (base_photo_height * num_photos) + (PHOTO_SPACING * (num_photos - 1)) + design_section_height + BOTTOM_MARGIN
            else:
                target_photo_height = int(available_for_photos / num_photos)
                strip_height = target_strip_height
        else:
            target_photo_height = base_photo_height
            total_photos_height = (target_photo_height * num_photos) + (PHOTO_SPACING * (num_photos - 1))
            strip_height = TOP_MARGIN + total_photos_height + design_section_height + BOTTOM_MARGIN

        # Crear canvas con color de fondo personalizado
        strip = Image.new('RGB', (strip_width, strip_height), BACKGROUND_COLOR)
        
        try:
            # Y offset inicial
            y_offset = TOP_MARGIN

            # 0. Agregar diseño arriba si aplica (modo banda fija)
            if design_exists and not use_free_overlay and design_position_normalized == DESIGN_POSITION_TOP:
                y_offset = ImageService._paste_design(
                    strip,
                    design_path,
                    strip_width,
                    DESIGN_HEIGHT,
                    y_offset,
                    add_spacing=True,
                    spacing=PHOTO_SPACING
                )
            
            # 1. Procesar y agregar las fotos UNA POR UNA
            for i, photo_path in enumerate(photo_paths):
                photo = Image.open(photo_path)
                filtered: Optional[Image.Image] = None

                try:
                  if photo_filter_normalized and photo_filter_normalized != "none":
                      filtered = ImageService._apply_filter(photo, photo_filter_normalized)
                  source = filtered or photo

                  photo_processed = ImageService._process_photo(
                      source,
                      strip_width - 50,  # Ancho con margen lateral
                      target_photo_height,
                  )

                  # Calcular posición centrada
                  x_pos = (strip_width - photo_processed.width) // 2

                  # Pegar en strip
                  strip.paste(photo_processed, (x_pos, y_offset))

                  # Liberar foto procesada
                  photo_processed.close()
                  del photo_processed

                  # Siguiente posición
                  y_offset += target_photo_height + PHOTO_SPACING
                finally:
                  if filtered is not None:
                      filtered.close()
                      del filtered

                  # Liberar foto original
                  photo.close()
                  del photo

                  # Forzar limpieza de memoria
                  gc.collect()
            
            # 2. Agregar diseño abajo si aplica (modo banda fija)
            if design_exists and not use_free_overlay and design_position_normalized == DESIGN_POSITION_BOTTOM:
                ImageService._paste_design(
                    strip,
                    design_path,
                    strip_width,
                    DESIGN_HEIGHT,
                    y_offset,
                    add_spacing=False,
                    spacing=PHOTO_SPACING
                )

            # 2b. Overlay libre (escala + offsets normalizados)
            if design_exists and use_free_overlay and design_path is not None:
                ImageService._paste_design_free_overlay(
                    canvas=strip,
                    design_path=design_path,
                    strip_width=strip_width,
                    strip_height=strip_height,
                    design_scale=design_scale,
                    design_offset_x=design_offset_x,
                    design_offset_y=design_offset_y,
                    design_position=design_position_normalized,
                )
            
            # 3. Guardar strip en carpeta de sesión para nomenclatura consistente
            output_dir = PHOTOS_DIR / session_id if session_id else STRIPS_DIR
            output_dir.mkdir(parents=True, exist_ok=True)
            
            output_filename = "strip.jpg" if session_id else "strip_preview.jpg"
            output_path = output_dir / output_filename
            
            # Guardar con compresión optimizada
            strip.save(
                output_path,
                format=IMAGE_CONFIG["format"],
                quality=IMAGE_CONFIG["quality"],
                dpi=IMAGE_CONFIG["dpi"],
                optimize=True  # Optimizar tamaño de archivo
            )

            # Registrar strip en metadata de sesión (solo para sesiones reales)
            if session_id:
                strip_url = get_photo_url(output_path)
                SessionService.set_strip(session_id, strip_url)

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
    def _apply_filter(photo: Image.Image, photo_filter: str) -> Image.Image:
        """Aplica un filtro sencillo a la foto y devuelve una nueva imagen.

        photo_filter soporta: "bw", "sepia", "glam". Cualquier otro valor devuelve
        una copia sin cambios.
        """
        base = photo.convert("RGB")
        name = (photo_filter or "none").strip().lower()

        if name == "bw":
            gray = ImageOps.grayscale(base)
            return gray.convert("RGB")

        if name == "sepia":
            gray = ImageOps.grayscale(base)
            # Tonos cálidos para efecto sepia suave
            sepia = ImageOps.colorize(gray, "#2b1b0f", "#f5e0c7")
            return sepia.convert("RGB")

        if name == "glam":
            glam = base.copy()
            # Ligero realce de brillo y contraste en color, consistente con el preview CSS
            glam = ImageEnhance.Brightness(glam).enhance(1.08)
            glam = ImageEnhance.Contrast(glam).enhance(1.12)
            glam = ImageEnhance.Color(glam).enhance(1.2)
            return glam

        # Filtro desconocido: devolver copia directa
        return base

    @staticmethod
    def _paste_design(
        canvas: Image.Image,
        design_path: Path,
        target_width: int,
        target_height: int,
        y_offset: int,
        add_spacing: bool,
        spacing: int
    ) -> int:
        """Coloca el diseño en el canvas y devuelve el nuevo offset."""
        design = Image.open(design_path)

        try:
            if design.size != (target_width, target_height):
                design = design.resize(
                    (target_width, target_height),
                    Image.Resampling.LANCZOS
                )

            # Manejar transparencia
            if design.mode == 'RGBA':
                bg = Image.new('RGB', design.size, 'white')
                bg.paste(design, (0, 0), design)
                canvas.paste(bg, (0, y_offset))
                bg.close()
            else:
                canvas.paste(design, (0, y_offset))

            new_offset = y_offset + target_height
            if add_spacing:
                new_offset += spacing

            return new_offset
        finally:
            design.close()
            del design
            gc.collect()

    @staticmethod
    def _paste_design_free_overlay(
        canvas: Image.Image,
        design_path: Path,
        strip_width: int,
        strip_height: int,
        design_scale: Optional[float],
        design_offset_x: Optional[float],
        design_offset_y: Optional[float],
        design_position: str,
    ) -> None:
        """Coloca el diseño como overlay libre usando escala y offsets normalizados.

        - design_scale controla el ancho relativo al strip (0-1).
        - design_offset_x/y controlan la posición del centro en coordenadas normalizadas (0-1).
        """
        # Usar rangos razonables para evitar valores extremos sin propagar magia por el código.
        MIN_SCALE = 0.3
        MAX_SCALE = 1.0
        DEFAULT_SCALE = 1.0
        DEFAULT_TOP_Y = 0.2
        DEFAULT_BOTTOM_Y = 0.8

        design = Image.open(design_path)

        try:
            if design.width <= 0 or design.height <= 0:
                raise ValueError("Design image has invalid dimensions")

            # Normalizar escala
            scale = design_scale if design_scale is not None else DEFAULT_SCALE
            if scale <= 0:
                scale = DEFAULT_SCALE
            scale = max(MIN_SCALE, min(MAX_SCALE, scale))

            target_width = int(strip_width * scale)
            # Mantener proporción original
            aspect_ratio = design.width / design.height
            target_height = max(1, int(target_width / aspect_ratio))

            # Posición normalizada (0-1)
            center_x_norm = design_offset_x if design_offset_x is not None else 0.5
            if design_offset_y is not None:
                center_y_norm = design_offset_y
            else:
                center_y_norm = DEFAULT_TOP_Y if design_position == DESIGN_POSITION_TOP else DEFAULT_BOTTOM_Y

            center_x_norm = max(0.0, min(1.0, center_x_norm))
            center_y_norm = max(0.0, min(1.0, center_y_norm))

            center_x = center_x_norm * strip_width
            center_y = center_y_norm * strip_height

            half_w = target_width / 2
            half_h = target_height / 2

            # Clamp para que el diseño no se salga completamente del canvas
            center_x = max(half_w, min(strip_width - half_w, center_x))
            center_y = max(half_h, min(strip_height - half_h, center_y))

            left = int(center_x - half_w)
            top = int(center_y - half_h)

            resized = design.resize(
                (target_width, target_height),
                Image.Resampling.LANCZOS,
            )

            if resized.mode == "RGBA":
                bg = Image.new("RGB", resized.size, "white")
                bg.paste(resized, (0, 0), resized)
                canvas.paste(bg, (left, top))
                bg.close()
            else:
                canvas.paste(resized, (left, top))

            resized.close()
        finally:
            design.close()
            del design
            gc.collect()
    
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
            output_path = strip_path.parent / "full_strip.jpg"
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
