"""
Servicio de composición de imágenes - OPTIMIZADO
- Procesamiento en chunks
- Liberación agresiva de memoria
- Compresión eficiente
"""
import gc
from pathlib import Path
from typing import List, Optional
from PIL import Image, ImageDraw, ImageFont

from app.config import IMAGE_CONFIG, STRIPS_DIR


class ImageService:
    """Servicio ligero de composición de tiras"""
    
    @staticmethod
    def compose_strip(
        photo_paths: List[Path],
        design_path: Optional[Path] = None,
        session_id: str = None
    ) -> Path:
        """
        Compone una tira de 3 fotos + diseño personalizado.
        Optimizado para liberar memoria progresivamente.
        """
        if len(photo_paths) != 3:
            raise ValueError("Se requieren exactamente 3 fotos")
        
        # Configuración
        width = IMAGE_CONFIG["strip_width"]
        height = IMAGE_CONFIG["strip_height"]
        photo_height = IMAGE_CONFIG["photo_height"]
        design_height = IMAGE_CONFIG["design_height"]
        spacing = 5
        
        # Crear canvas blanco
        strip = Image.new('RGB', (width, height), 'white')
        
        try:
            # Y offset inicial
            y_offset = 30
            
            # 1. Procesar y agregar las 3 fotos UNA POR UNA
            for i, photo_path in enumerate(photo_paths):
                # Cargar foto
                photo = Image.open(photo_path)
                
                # Procesar foto
                photo_processed = ImageService._process_photo(
                    photo, 
                    width - 50, 
                    photo_height
                )
                
                # Liberar foto original
                photo.close()
                del photo
                
                # Calcular posición centrada
                x_pos = (width - photo_processed.width) // 2
                
                # Pegar en strip
                strip.paste(photo_processed, (x_pos, y_offset))
                
                # Liberar foto procesada
                photo_processed.close()
                del photo_processed
                
                # Forzar limpieza de memoria
                gc.collect()
                
                # Siguiente posición
                y_offset += photo_height + spacing
            
            # 2. Agregar diseño si existe
            if design_path and design_path.exists():
                design = Image.open(design_path)
                
                # Redimensionar si es necesario
                if design.size != (width, design_height):
                    design = design.resize(
                        (width, design_height),
                        Image.Resampling.LANCZOS
                    )
                
                # Posición del diseño (al final)
                design_y = height - design_height
                
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
        Crea imagen 4x6" con 2 tiras idénticas lado a lado.
        """
        strip = Image.open(strip_path)
        
        try:
            # Dimensiones 4x6"
            full_width = 1200
            full_height = 1800
            
            # Crear canvas
            full_page = Image.new('RGB', (full_width, full_height), 'white')
            
            # Pegar ambas copias
            full_page.paste(strip, (0, 0))
            full_page.paste(strip, (600, 0))
            
            # Agregar línea de corte sutil
            draw = ImageDraw.Draw(full_page)
            for y in range(0, full_height, 20):
                draw.line(
                    [(598, y), (598, y + 10)],
                    fill=(200, 200, 200),
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
