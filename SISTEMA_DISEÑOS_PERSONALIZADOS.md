# Sistema de Diseños Personalizados por Evento
**Como tu ejemplo "LIZ"** | Noviembre 2025

---

## 🎨 Visión General

Basado en tu imagen, el sistema permite:
- ✅ 3 fotos en la parte superior/media
- ✅ **Diseño personalizado en la parte inferior** (footer)
- ✅ Cada evento tiene su propio diseño
- ✅ Cambio rápido entre diseños

---

## 📐 Anatomía de una Tira con Diseño

### Tu Ejemplo "LIZ"

```
┌─────────────────┐
│                 │
│    FOTO 1       │ ← 550x413px (3 fotos)
│                 │
├─────────────────┤
│                 │
│    FOTO 2       │ ← 550x413px
│                 │
├─────────────────┤
│                 │
│    FOTO 3       │ ← 550x413px
│                 │
├─────────────────┤  ─┐
│                 │   │
│   Fondo azul    │   │ 600x450px
│   con splash    │   │ DISEÑO
│                 │   │ CUSTOM
│      LIZ        │   │ (tu archivo)
│                 │   │
│   ★  ★  ★       │   │
│                 │  ─┘
└─────────────────┘

Total: 600x1800px @ 300 DPI
```

---

## 🎨 Cómo Crear Diseños Personalizados

### Especificaciones Técnicas

**Tamaño del diseño footer:**
- Ancho: 600 píxeles (2 pulgadas @ 300 DPI)
- Alto: 450 píxeles (~1.5 pulgadas)
- Formato: PNG con transparencia o JPG
- Resolución: 300 DPI

**Software recomendado:**
- Photoshop
- Canva Pro
- Figma
- GIMP (gratis)
- Procreate (iPad)

### Template Base para Diseñadores

```
Dimensiones: 600x450px @ 300 DPI

Áreas de seguridad:
- Margen exterior: 20px (contenido importante)
- Zona de texto principal: Centro vertical
- Decoraciones: Pueden llegar hasta el borde

Elementos comunes:
- Nombre del evento (grande, centrado)
- Fecha (opcional)
- Decoraciones temáticas
- Gradientes o fondos sólidos
- Iconos/stickers temáticos
```

---

## 📂 Organización de Diseños

### Estructura de Carpetas

```
data/designs/
├── xv_anos/
│   ├── liz_design.png
│   ├── sofia_xv.png
│   └── maria_quince.png
│
├── san_valentin/
│   ├── amor_2025.png
│   ├── corazones_clasico.png
│   └── romantico_moderno.png
│
├── bodas/
│   ├── maria_juan.png
│   ├── elegant_gold.png
│   └── rustic_wedding.png
│
├── cumpleanos/
│   ├── birthday_confetti.png
│   └── kids_party.png
│
└── custom/
    └── evento_personalizado.png
```

### Base de Datos de Diseños

```sql
CREATE TABLE designs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),  -- xv_anos, bodas, san_valentin, etc.
    file_path VARCHAR(255) NOT NULL,
    preview_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT FALSE
);

-- Solo un diseño activo a la vez
CREATE UNIQUE INDEX idx_active_design ON designs(is_active) WHERE is_active = TRUE;
```

---

## 💻 Implementación Backend (Python + Pillow)

### Función Principal: Agregar Diseño a Tira

```python
from PIL import Image
from typing import Optional

def compose_strip_with_design(
    photo_paths: list[str],
    design_path: str,
    output_path: str
) -> str:
    """
    Crea una tira de 3 fotos con diseño personalizado en el footer.
    
    Args:
        photo_paths: Lista de 3 rutas a fotos
        design_path: Ruta al diseño personalizado (600x450px)
        output_path: Ruta donde guardar la tira final
    
    Returns:
        str: Ruta de la tira generada
    """
    
    # Dimensiones
    STRIP_WIDTH = 600
    STRIP_HEIGHT = 1800
    PHOTO_HEIGHT = 413  # 3 fotos = 1239px
    DESIGN_HEIGHT = 450
    SPACING = 5  # Espaciado entre fotos
    
    # Crear canvas blanco
    strip = Image.new('RGB', (STRIP_WIDTH, STRIP_HEIGHT), 'white')
    
    # Y offset inicial (con margen superior)
    y_offset = 30
    
    # 1. Agregar las 3 fotos
    for photo_path in photo_paths:
        photo = Image.open(photo_path)
        
        # Redimensionar y recortar foto para 600x413
        photo_processed = resize_and_crop(photo, STRIP_WIDTH - 50, PHOTO_HEIGHT)
        
        # Centrar horizontalmente
        x_pos = (STRIP_WIDTH - photo_processed.width) // 2
        
        # Pegar foto
        strip.paste(photo_processed, (x_pos, y_offset))
        
        # Siguiente foto
        y_offset += PHOTO_HEIGHT + SPACING
    
    # 2. Agregar diseño personalizado en el footer
    design = Image.open(design_path)
    
    # Redimensionar diseño si es necesario (mantener 600x450)
    if design.size != (STRIP_WIDTH, DESIGN_HEIGHT):
        design = design.resize(
            (STRIP_WIDTH, DESIGN_HEIGHT),
            Image.Resampling.LANCZOS
        )
    
    # Pegar diseño al final
    design_y = STRIP_HEIGHT - DESIGN_HEIGHT
    
    # Si el diseño tiene transparencia (PNG), componer correctamente
    if design.mode == 'RGBA':
        # Crear fondo blanco
        bg = Image.new('RGB', design.size, 'white')
        bg.paste(design, (0, 0), design)
        strip.paste(bg, (0, design_y))
    else:
        strip.paste(design, (0, design_y))
    
    # 3. Guardar
    strip.save(output_path, quality=95, dpi=(300, 300))
    
    return output_path


def resize_and_crop(image: Image.Image, target_width: int, target_height: int) -> Image.Image:
    """Redimensiona y recorta imagen para llenar el espacio exacto."""
    img_ratio = image.width / image.height
    target_ratio = target_width / target_height
    
    if img_ratio > target_ratio:
        # Imagen más ancha
        new_height = target_height
        new_width = int(new_height * img_ratio)
    else:
        # Imagen más alta
        new_width = target_width
        new_height = int(new_width / img_ratio)
    
    # Redimensionar
    resized = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    # Recortar al centro
    left = (new_width - target_width) // 2
    top = (new_height - target_height) // 2
    right = left + target_width
    bottom = top + target_height
    
    return resized.crop((left, top, right, bottom))


# Ejemplo de uso
if __name__ == "__main__":
    photos = [
        "data/photos/session_001/photo_1.jpg",
        "data/photos/session_001/photo_2.jpg",
        "data/photos/session_001/photo_3.jpg"
    ]
    
    design = "data/designs/xv_anos/liz_design.png"
    output = "data/strips/session_001_final.jpg"
    
    strip_path = compose_strip_with_design(photos, design, output)
    print(f"✅ Tira creada: {strip_path}")
```

---

## 🖥️ API Endpoints

### Upload Diseño

```python
from fastapi import APIRouter, UploadFile, File
from pathlib import Path
import shutil
from datetime import datetime

router = APIRouter(prefix="/api/designs", tags=["designs"])

@router.post("/upload")
async def upload_design(
    file: UploadFile = File(...),
    name: str = None,
    category: str = "custom"
):
    """
    Sube un diseño personalizado.
    
    Pasos:
    1. Validar que sea imagen (PNG/JPG)
    2. Validar dimensiones (600x450px recomendado)
    3. Guardar en carpeta correspondiente
    4. Crear thumbnail para preview
    5. Registrar en base de datos
    """
    
    # Validar formato
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "Solo se permiten imágenes")
    
    # Generar nombre único
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    ext = Path(file.filename).suffix
    filename = f"{category}_{timestamp}{ext}"
    
    # Ruta de guardado
    category_path = Path(f"data/designs/{category}")
    category_path.mkdir(parents=True, exist_ok=True)
    
    file_path = category_path / filename
    
    # Guardar archivo
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Validar/ajustar dimensiones
    from PIL import Image
    img = Image.open(file_path)
    
    if img.size != (600, 450):
        # Redimensionar si es necesario
        img_resized = img.resize((600, 450), Image.Resampling.LANCZOS)
        img_resized.save(file_path)
    
    # Crear thumbnail para preview (200x150)
    thumb = img.resize((200, 150), Image.Resampling.LANCZOS)
    thumb_path = category_path / f"thumb_{filename}"
    thumb.save(thumb_path)
    
    # Guardar en base de datos
    design = Design(
        name=name or file.filename,
        category=category,
        file_path=str(file_path),
        preview_path=str(thumb_path)
    )
    db.add(design)
    db.commit()
    
    return {
        "success": True,
        "design_id": design.id,
        "file_path": str(file_path),
        "preview_url": f"/api/designs/preview/{design.id}"
    }


@router.get("/list")
async def list_designs(category: str = None):
    """Lista todos los diseños disponibles."""
    query = db.query(Design)
    
    if category:
        query = query.filter(Design.category == category)
    
    designs = query.order_by(Design.created_at.desc()).all()
    
    return {
        "designs": [
            {
                "id": d.id,
                "name": d.name,
                "category": d.category,
                "preview_url": f"/api/designs/preview/{d.id}",
                "is_active": d.is_active
            }
            for d in designs
        ]
    }


@router.put("/set-active/{design_id}")
async def set_active_design(design_id: int):
    """Activa un diseño para usar en las próximas sesiones."""
    
    # Desactivar todos
    db.query(Design).update({"is_active": False})
    
    # Activar el seleccionado
    design = db.query(Design).filter(Design.id == design_id).first()
    
    if not design:
        raise HTTPException(404, "Diseño no encontrado")
    
    design.is_active = True
    db.commit()
    
    return {
        "success": True,
        "active_design": {
            "id": design.id,
            "name": design.name,
            "file_path": design.file_path
        }
    }


@router.get("/active")
async def get_active_design():
    """Obtiene el diseño actualmente activo."""
    design = db.query(Design).filter(Design.is_active == True).first()
    
    if not design:
        return {"active_design": None}
    
    return {
        "active_design": {
            "id": design.id,
            "name": design.name,
            "file_path": design.file_path
        }
    }
```

---

## 🎨 UI: Panel de Gestión de Diseños

### Pantalla Settings → Diseños

```tsx
// DesignManager.tsx
import { useState, useEffect } from 'react';

interface Design {
  id: number;
  name: string;
  category: string;
  preview_url: string;
  is_active: boolean;
}

export function DesignManager() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadDesigns();
  }, []);

  const loadDesigns = async () => {
    const response = await fetch('http://localhost:8000/api/designs/list');
    const data = await response.json();
    setDesigns(data.designs);
  };

  const uploadDesign = async (file: File, category: string) => {
    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);
    formData.append('category', category);

    const response = await fetch('http://localhost:8000/api/designs/upload', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      await loadDesigns();
    }
    
    setUploading(false);
  };

  const setActive = async (designId: number) => {
    await fetch(`http://localhost:8000/api/designs/set-active/${designId}`, {
      method: 'PUT',
    });
    await loadDesigns();
  };

  return (
    <div className="design-manager">
      <h2>Diseños Personalizados</h2>

      {/* Upload Section */}
      <div className="upload-section">
        <h3>Subir Nuevo Diseño</h3>
        <input
          type="file"
          accept="image/png,image/jpeg"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              uploadDesign(file, 'custom');
            }
          }}
        />
        <p className="hint">
          Tamaño recomendado: 600x450px @ 300 DPI
        </p>
      </div>

      {/* Gallery */}
      <div className="design-gallery">
        {designs.map((design) => (
          <div
            key={design.id}
            className={`design-card ${design.is_active ? 'active' : ''}`}
            onClick={() => setActive(design.id)}
          >
            <img src={design.preview_url} alt={design.name} />
            <div className="design-info">
              <h4>{design.name}</h4>
              <span className="category">{design.category}</span>
              {design.is_active && (
                <span className="badge">Activo</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 📋 Workflow para Eventos

### Antes del Evento

1. **Crear diseño** en Photoshop/Canva
   - Dimensiones: 600x450px @ 300 DPI
   - Incluir: nombre, fecha, decoración
   
2. **Subir diseño** a la app
   - Settings → Diseños → Upload
   - Seleccionar categoría
   
3. **Activar diseño**
   - Click en el diseño deseado
   - Verificar preview

### Durante el Evento

- Cada foto capturada automáticamente usa el diseño activo
- Cambiar diseño si es necesario (en Settings)

### Después del Evento

- Diseño queda guardado para futuros eventos similares
- Puedes reutilizar diseños de eventos pasados

---

## 🎨 Templates de Diseño Incluidos

### Template 1: XV Años Elegante

```
Fondo: Gradiente rosa/púrpura
Nombre: Grande, fuente script
Decoraciones: Corona, estrellas
Fecha: Pequeña, abajo
```

### Template 2: San Valentín

```
Fondo: Rojo/rosa con corazones
Texto: "Día del Amor y la Amistad"
Decoraciones: Corazones, cupido
```

### Template 3: Bodas Clásicas

```
Fondo: Blanco/dorado
Nombres: Tipografía elegante
Decoraciones: Anillos, flores
Fecha: Cursiva
```

### Template 4: Cumpleaños Divertido

```
Fondo: Confetti multicolor
Texto: "¡Feliz Cumpleaños!"
Nombre + edad
Decoraciones: Globos, pastel
```

---

## ✅ Checklist de Diseño

Antes de usar un diseño en evento:

- [ ] Dimensiones correctas (600x450px)
- [ ] Resolución 300 DPI
- [ ] Texto legible (fuente no muy pequeña)
- [ ] Colores contrastantes
- [ ] Sin errores ortográficos
- [ ] Decoraciones no interfieren con contenido
- [ ] Test de impresión realizado

---

## 🚀 Próximos Pasos

1. Implementar sistema de upload
2. Crear galería de diseños
3. Integrar con composición de tiras
4. Crear 5-10 templates base
5. Testing con impresión real

---

**¡Tu ejemplo "LIZ" será el modelo perfecto!** 🎨
