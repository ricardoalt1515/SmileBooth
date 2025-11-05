# Layout de Tiras de Fotos - Especificación Técnica
**Formato: 3 Fotos por Tira** | Noviembre 2025

---

## 📸 Tu Caso de Uso Actual

### Descripción
- **Formato actual**: 6 fotos impresas (3 fotos duplicadas)
- **Resultado**: 2 tiras idénticas en la misma impresión
- **Uso**: 1 para el invitado, 1 para el organizador/álbum

### Ventajas de Este Formato
✅ Solo necesitas 1 impresión (ahorra tiempo)  
✅ Ambas copias son perfectamente idénticas  
✅ No hay riesgo de errores en re-impresión  
✅ Más rápido para el invitado

---

## 📐 Formatos de Impresión

### Opción 1: Formato 2x6" (Clásico Photo Strip)

**Medidas:**
- Ancho total: 2 pulgadas (5.08 cm)
- Alto total: 6 pulgadas (15.24 cm)
- Resolución: 600x1800 píxeles @ 300 DPI

**Layout:**
```
┌─────────────────────┐ ▲
│  [Logo del Evento]  │ │ 0.5" (150px)
│  María & Juan 2025  │ │
├─────────────────────┤ ├─
│                     │ │
│                     │ │
│     FOTO 1          │ │ 1.6" (480px)
│                     │ │
│                     │ │
├─────────────────────┤ ├─
│                     │ │
│                     │ │
│     FOTO 2          │ │ 1.6" (480px)
│                     │ │
│                     │ │
├─────────────────────┤ ├─
│                     │ │
│                     │ │
│     FOTO 3          │ │ 1.6" (480px)
│                     │ │
│                     │ │
├─────────────────────┤ ├─
│ www.tuevent.com  📷 │ │ 0.3" (90px)
└─────────────────────┘ ▼
    2" (600px)

DUPLICADO (en la misma hoja):
┌─────────────────────┐
│  [Logo del Evento]  │
│  María & Juan 2025  │
├─────────────────────┤
│     FOTO 1          │
├─────────────────────┤
│     FOTO 2          │
├─────────────────────┤
│     FOTO 3          │
├─────────────────────┤
│ www.tuevent.com  📷 │
└─────────────────────┘
```

**Especificaciones:**
```json
{
  "paper_size": "4x6 inches",
  "layout": {
    "strips_per_page": 2,
    "strip_width": "2 inches",
    "strip_height": "6 inches",
    "orientation": "portrait"
  },
  "resolution": {
    "dpi": 300,
    "total_pixels": "1200x1800",
    "strip_pixels": "600x1800"
  },
  "sections": {
    "header": {
      "height_px": 150,
      "content": ["logo", "event_text"]
    },
    "photo_1": {
      "height_px": 480,
      "aspect_ratio": "4:3"
    },
    "photo_2": {
      "height_px": 480,
      "aspect_ratio": "4:3"
    },
    "photo_3": {
      "height_px": 480,
      "aspect_ratio": "4:3"
    },
    "footer": {
      "height_px": 90,
      "content": ["website", "icon"]
    }
  }
}
```

---

### Opción 2: Formato 4x6" (Dos Tiras Completas)

**Medidas:**
- Ancho total: 4 pulgadas (10.16 cm)
- Alto total: 6 pulgadas (15.24 cm)
- Resolución: 1200x1800 píxeles @ 300 DPI
- **2 tiras idénticas lado a lado**

**Layout:**
```
┌──────────────────────────────────────────┐
│ TIRA 1              │  TIRA 2            │
├──────────────────────────────────────────┤
│ [Logo] María & Juan │ [Logo] María & Juan│
├──────────────────────────────────────────┤
│                     │                    │
│     FOTO 1          │     FOTO 1         │
│                     │                    │
├──────────────────────────────────────────┤
│                     │                    │
│     FOTO 2          │     FOTO 2         │
│                     │                    │
├──────────────────────────────────────────┤
│                     │                    │
│     FOTO 3          │     FOTO 3         │
│                     │                    │
├──────────────────────────────────────────┤
│ www.evento.com      │ www.evento.com     │
└──────────────────────────────────────────┘
     2" (600px)            2" (600px)

Después de cortar con tijeras:
2 tiras idénticas de 2x6"
```

**Ventaja:** Corte fácil con tijeras o guillotina

---

## 🎨 Templates Predefinidos

### Template 1: "Classic White"

```
Características:
- Background: Blanco puro
- Borde: 10px gris claro
- Header: Logo centrado + texto evento
- Fotos: Separador sutil entre cada una
- Footer: Website + icono cámara
```

```css
.template-classic {
  background: #FFFFFF;
  border: 10px solid #F0F0F0;
  font-family: 'Poppins', sans-serif;
}

.header {
  padding: 20px;
  text-align: center;
  background: linear-gradient(to bottom, #FFFFFF, #F8F8F8);
}

.header .logo {
  max-height: 60px;
  margin-bottom: 10px;
}

.header .event-text {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.photo-slot {
  padding: 8px;
  border-bottom: 2px dashed #E0E0E0;
}

.footer {
  padding: 15px;
  text-align: center;
  font-size: 12px;
  color: #666;
  background: #F8F8F8;
}
```

---

### Template 2: "Modern Pink"

```
Características:
- Background: Gradiente rosa suave
- Sin bordes
- Header: Logo + texto con sombra
- Fotos: Sin separadores (fluidas)
- Footer: Minimalista
```

```css
.template-modern {
  background: linear-gradient(
    to bottom,
    #FFE4F0,
    #FFD0E0,
    #FFE4F0
  );
  font-family: 'Inter', sans-serif;
}

.header {
  padding: 25px 15px;
  text-align: center;
}

.header .logo {
  max-height: 70px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

.header .event-text {
  margin-top: 10px;
  font-size: 18px;
  font-weight: 700;
  color: #FF6B9D;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.photo-slot {
  padding: 5px;
  /* Sin separadores */
}

.photo-slot img {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.footer {
  padding: 12px;
  text-align: center;
  font-size: 11px;
  color: #333;
  font-weight: 500;
}
```

---

### Template 3: "Elegant Gold"

```
Características:
- Background: Blanco con bordes dorados
- Estilo elegante para bodas
- Header: Nombres con tipografía script
- Fotos: Marcos individuales
- Footer: Fecha del evento
```

```css
.template-elegant {
  background: #FFFFFF;
  border: 15px solid;
  border-image: linear-gradient(
    to bottom,
    #D4AF37,
    #F4E5C2,
    #D4AF37
  ) 1;
  font-family: 'Playfair Display', serif;
}

.header {
  padding: 30px 20px;
  text-align: center;
  border-bottom: 2px solid #D4AF37;
}

.header .logo {
  max-height: 50px;
  opacity: 0.8;
}

.header .event-text {
  margin-top: 15px;
  font-size: 20px;
  font-weight: 400;
  color: #333;
  font-style: italic;
}

.photo-slot {
  padding: 12px;
}

.photo-slot img {
  border: 3px solid #F4E5C2;
  box-shadow: 0 3px 10px rgba(0,0,0,0.15);
}

.footer {
  padding: 20px;
  text-align: center;
  font-size: 14px;
  color: #666;
  border-top: 2px solid #D4AF37;
}
```

---

## 💻 Implementación en Python (Pillow)

### Función Principal: Crear Tira

```python
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from typing import List, Dict, Optional

def create_photo_strip(
    photos: List[str],
    template: str = "classic",
    config: Dict = None
) -> Image.Image:
    """
    Crea una tira de 3 fotos con el template especificado.
    
    Args:
        photos: Lista de 3 rutas a fotos
        template: Nombre del template ("classic", "modern", "elegant")
        config: Configuración adicional {
            "event_name": str,
            "logo_path": str,
            "website": str,
            "date": str
        }
    
    Returns:
        PIL Image de la tira completa (600x1800px)
    """
    
    # Validar que hay 3 fotos
    if len(photos) != 3:
        raise ValueError("Se requieren exactamente 3 fotos")
    
    # Dimensiones de la tira
    STRIP_WIDTH = 600  # 2 pulgadas @ 300 DPI
    STRIP_HEIGHT = 1800  # 6 pulgadas @ 300 DPI
    
    # Dimensiones de secciones
    HEADER_HEIGHT = 150
    PHOTO_HEIGHT = 480
    FOOTER_HEIGHT = 90
    
    # Crear canvas base
    strip = Image.new('RGB', (STRIP_WIDTH, STRIP_HEIGHT), 'white')
    draw = ImageDraw.Draw(strip)
    
    # 1. Dibujar header
    y_offset = 0
    strip = _draw_header(strip, config, template, HEADER_HEIGHT)
    y_offset += HEADER_HEIGHT
    
    # 2. Agregar las 3 fotos
    for i, photo_path in enumerate(photos):
        photo = Image.open(photo_path)
        strip = _add_photo_to_strip(
            strip, 
            photo, 
            y_offset, 
            PHOTO_HEIGHT, 
            template
        )
        y_offset += PHOTO_HEIGHT
    
    # 3. Dibujar footer
    strip = _draw_footer(strip, config, template, y_offset, FOOTER_HEIGHT)
    
    return strip


def _draw_header(
    strip: Image.Image,
    config: Dict,
    template: str,
    height: int
) -> Image.Image:
    """Dibuja el header (logo + texto evento)"""
    
    draw = ImageDraw.Draw(strip)
    width = strip.width
    
    if template == "classic":
        # Background blanco con gradiente sutil
        for y in range(height):
            color = int(255 - (y / height) * 8)  # Gradiente sutil
            draw.line([(0, y), (width, y)], fill=(color, color, color))
    
    elif template == "modern":
        # Gradiente rosa
        for y in range(height):
            r = int(255 - (y / height) * 25)
            g = int(228 - (y / height) * 20)
            b = int(240 - (y / height) * 16)
            draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    # Agregar logo si existe
    if config and config.get('logo_path'):
        logo = Image.open(config['logo_path'])
        # Redimensionar logo manteniendo aspect ratio
        logo.thumbnail((width - 40, 70), Image.Resampling.LANCZOS)
        logo_x = (width - logo.width) // 2
        logo_y = 20
        strip.paste(logo, (logo_x, logo_y), logo if logo.mode == 'RGBA' else None)
    
    # Agregar texto del evento
    if config and config.get('event_name'):
        try:
            font = ImageFont.truetype("arial.ttf", 18)
        except:
            font = ImageFont.load_default()
        
        text = config['event_name']
        # Centrar texto
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_x = (width - text_width) // 2
        text_y = height - 35
        
        # Color según template
        text_color = {
            "classic": (51, 51, 51),
            "modern": (255, 107, 157),
            "elegant": (51, 51, 51)
        }.get(template, (0, 0, 0))
        
        draw.text((text_x, text_y), text, fill=text_color, font=font)
    
    return strip


def _add_photo_to_strip(
    strip: Image.Image,
    photo: Image.Image,
    y_offset: int,
    height: int,
    template: str
) -> Image.Image:
    """Agrega una foto a la tira en la posición especificada"""
    
    width = strip.width
    padding = 8 if template == "classic" else 5
    
    # Área disponible para la foto
    available_width = width - (padding * 2)
    available_height = height - (padding * 2)
    
    # Redimensionar foto para que llene el espacio
    photo_resized = _resize_and_crop(
        photo, 
        available_width, 
        available_height
    )
    
    # Aplicar efectos según template
    if template == "modern":
        # Esquinas redondeadas
        photo_resized = _round_corners(photo_resized, radius=8)
    elif template == "elegant":
        # Agregar borde
        border_width = 3
        bordered = Image.new(
            'RGB',
            (photo_resized.width + border_width * 2,
             photo_resized.height + border_width * 2),
            (244, 229, 194)  # Color dorado claro
        )
        bordered.paste(
            photo_resized,
            (border_width, border_width)
        )
        photo_resized = bordered
    
    # Pegar foto en el strip
    x_pos = padding
    y_pos = y_offset + padding
    strip.paste(photo_resized, (x_pos, y_pos))
    
    # Agregar separador si es classic
    if template == "classic":
        draw = ImageDraw.Draw(strip)
        separator_y = y_offset + height - 1
        draw.line(
            [(20, separator_y), (width - 20, separator_y)],
            fill=(224, 224, 224),
            width=2
        )
    
    return strip


def _draw_footer(
    strip: Image.Image,
    config: Dict,
    template: str,
    y_offset: int,
    height: int
) -> Image.Image:
    """Dibuja el footer (website + icono)"""
    
    draw = ImageDraw.Draw(strip)
    width = strip.width
    
    # Background según template
    if template == "classic":
        draw.rectangle(
            [(0, y_offset), (width, y_offset + height)],
            fill=(248, 248, 248)
        )
    
    # Texto del footer
    footer_text = ""
    if config:
        if config.get('website'):
            footer_text = config['website']
        elif config.get('date'):
            footer_text = config['date']
    
    if footer_text:
        try:
            font = ImageFont.truetype("arial.ttf", 12)
        except:
            font = ImageFont.load_default()
        
        bbox = draw.textbbox((0, 0), footer_text, font=font)
        text_width = bbox[2] - bbox[0]
        text_x = (width - text_width) // 2
        text_y = y_offset + (height // 2) - 8
        
        draw.text(
            (text_x, text_y),
            footer_text,
            fill=(102, 102, 102),
            font=font
        )
    
    return strip


def _resize_and_crop(
    image: Image.Image,
    target_width: int,
    target_height: int
) -> Image.Image:
    """
    Redimensiona y recorta una imagen para llenar exactamente
    el espacio target manteniendo el aspect ratio.
    """
    # Calcular aspect ratios
    img_ratio = image.width / image.height
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
    resized = image.resize(
        (new_width, new_height),
        Image.Resampling.LANCZOS
    )
    
    # Recortar al centro
    left = (new_width - target_width) // 2
    top = (new_height - target_height) // 2
    right = left + target_width
    bottom = top + target_height
    
    cropped = resized.crop((left, top, right, bottom))
    
    return cropped


def _round_corners(image: Image.Image, radius: int) -> Image.Image:
    """Aplica esquinas redondeadas a una imagen"""
    
    # Crear máscara
    mask = Image.new('L', image.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle(
        [(0, 0), image.size],
        radius=radius,
        fill=255
    )
    
    # Aplicar máscara
    output = Image.new('RGBA', image.size, (0, 0, 0, 0))
    output.paste(image, (0, 0))
    output.putalpha(mask)
    
    # Convertir de vuelta a RGB
    background = Image.new('RGB', image.size, (255, 255, 255))
    background.paste(output, (0, 0), output)
    
    return background


def create_duplicate_strip(
    strip: Image.Image
) -> Image.Image:
    """
    Crea una imagen 4x6" con dos copias idénticas de la tira
    lado a lado, listas para cortar.
    """
    
    # Dimensiones 4x6" @ 300 DPI
    FULL_WIDTH = 1200
    FULL_HEIGHT = 1800
    
    # Crear canvas completo
    full_page = Image.new('RGB', (FULL_WIDTH, FULL_HEIGHT), 'white')
    
    # Pegar primera copia (izquierda)
    full_page.paste(strip, (0, 0))
    
    # Pegar segunda copia (derecha)
    full_page.paste(strip, (600, 0))
    
    # Agregar línea de corte (opcional, sutil)
    draw = ImageDraw.Draw(full_page)
    for y in range(0, FULL_HEIGHT, 20):
        draw.line(
            [(598, y), (598, y + 10)],
            fill=(200, 200, 200),
            width=1
        )
    
    return full_page


# Ejemplo de uso
if __name__ == "__main__":
    # Configuración del evento
    config = {
        "event_name": "María & Juan - 2025",
        "logo_path": "logo_boda.png",
        "website": "www.mariajuan.com",
        "date": "15 de Febrero, 2025"
    }
    
    # Rutas de las 3 fotos
    photos = [
        "data/photos/session_001/photo_1.jpg",
        "data/photos/session_001/photo_2.jpg",
        "data/photos/session_001/photo_3.jpg"
    ]
    
    # Crear tira simple
    strip = create_photo_strip(photos, template="modern", config=config)
    
    # Crear versión duplicada (4x6" con 2 tiras)
    full_page = create_duplicate_strip(strip)
    
    # Guardar
    full_page.save(
        "data/strips/session_001_strip.jpg",
        quality=95,
        dpi=(300, 300)
    )
    
    print("✅ Tira creada: data/strips/session_001_strip.jpg")
    print("📏 Tamaño: 4x6 pulgadas (1200x1800px)")
    print("🖨️ Lista para imprimir 2 copias idénticas")
```

---

## 📋 Checklist de Calidad

### Antes de Imprimir

- [ ] Resolución correcta (300 DPI mínimo)
- [ ] Colores en espacio RGB
- [ ] Fotos bien encuadradas (sin cabezas cortadas)
- [ ] Logo legible y bien posicionado
- [ ] Texto sin errores ortográficos
- [ ] Bordes y márgenes respetados
- [ ] Línea de corte visible si es necesario

### Configuración Impresora

- [ ] Papel correcto (4x6" photo paper)
- [ ] Calidad: Máxima
- [ ] Sin escalado (100%)
- [ ] Sin bordes automáticos
- [ ] Color: Full color
- [ ] Orientación: Portrait

---

## 🎯 Resumen

**Tu configuración óptima:**
- Formato: 4x6" con 2 tiras idénticas
- Resolución: 1200x1800px @ 300 DPI
- Template: "Modern Pink" (o el que prefieras)
- Impresión: 1 hoja = 2 tiras listas para cortar
- Tiempo: ~5-8 segundos por impresión

**Ventajas:**
- ✅ Solo 1 impresión necesaria
- ✅ 2 copias perfectamente idénticas
- ✅ Rápido y eficiente
- ✅ Sin desperdicio de papel
- ✅ Fácil de cortar con tijeras

**Próximo paso:** Implementar templates en el backend Python
