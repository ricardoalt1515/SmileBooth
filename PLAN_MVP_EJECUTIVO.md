# Plan MVP - PhotoBooth App
**Noviembre 2025** | Enfoque: UI/UX Excepcional + Tiras de 3 Fotos

---

## 🎯 Objetivo

Crear cabina de fotos **bella, simple y confiable** para eventos offline con:
- ✅ UI/UX mejor que SparkBooth
- ✅ Tiras de 3 fotos (tu caso actual)
- ✅ Impresión automática (2 copias)
- ✅ 100% offline

---

## 🎨 Sistema de Diseño

### Colores
```css
--primary: #FF6B9D        /* Rosa vibrante */
--accent: #60A5FA         /* Azul countdown */
--success: #34D399        /* Verde éxito */
--background: #FAFAFA     /* Gris claro */
```

### Tipografía
```css
--font-display: 'Poppins'  /* Títulos */
--font-body: 'Inter'       /* Texto */
```

---

## 📱 Flow del Usuario (30 segundos total)

```
[INICIO] → Click botón
    ↓ 3s
[COUNTDOWN 3-2-1] → Primera foto
    ↓ 0.5s
[CAPTURA] ✨ Flash
    ↓ 2s
[PAUSA] "Foto 1 lista"
    ↓ 3s
[COUNTDOWN 3-2-1] → Segunda foto
    ↓ 0.5s
[CAPTURA] ✨ Flash
    ↓ 2s
[PAUSA] "Foto 2 lista"
    ↓ 3s
[COUNTDOWN 3-2-1] → Tercera foto
    ↓ 0.5s
[CAPTURA] ✨ Flash
    ↓ 3s
[PROCESANDO] "Creando tira..."
    ↓ 5-8s
[IMPRIMIENDO] Preview + 2 copias
    ↓ 5s
[ÉXITO] ¡Listo! + QR code
    ↓
[VOLVER AL INICIO]
```

---

## 🛠️ Stack Tecnológico

### Frontend
- Electron + React + TypeScript
- TailwindCSS + shadcn/ui
- Framer Motion (animaciones)
- Zustand (estado)

### Backend
- Python + FastAPI
- Pillow (composición imágenes)
- OpenCV (webcam)
- win32print/pycups (impresión)
- qrcode (QR generation)

---

## 📐 Layout: Tira de 3 Fotos + Diseño Personalizado

### Formato 2x6" (Como tu ejemplo "LIZ")
```
┌─────────────────┐
│                 │
│    FOTO 1       │ 550x413px
│                 │
├─────────────────┤
│                 │
│    FOTO 2       │ 550x413px
│                 │
├─────────────────┤
│                 │
│    FOTO 3       │ 550x413px
│                 │
├─────────────────┤
│                 │
│  DISEÑO CUSTOM  │ 600x450px
│  (Ej: "LIZ" +   │ ← TU DISEÑO
│   decoración)   │   PERSONALIZADO
│                 │
└─────────────────┘

Resolución final: 600x1800px (300 DPI)
Impresión: 2 copias automáticas
```

**🎨 Diseños Personalizados por Evento:**
- XV Años: Logo + nombre + decoración temática
- San Valentín: Corazones + mensaje romántico
- Cumpleaños: Nombre + edad + decoración festiva
- Bodas: Nombres + fecha + detalles elegantes
- Día del Amor y la Amistad: Diseño especial
- **Cualquier evento**: Subes tu diseño PNG/JPG

### Formato 4x6" (2 tiras idénticas)
```
┌──────────────────────────────────────────┐
│ TIRA 1              │  TIRA 2            │
├──────────────────────────────────────────┤
│    FOTO 1           │     FOTO 1         │
├──────────────────────────────────────────┤
│    FOTO 2           │     FOTO 2         │
├──────────────────────────────────────────┤
│    FOTO 3           │     FOTO 3         │
├──────────────────────────────────────────┤
│ DISEÑO CUSTOM       │  DISEÑO CUSTOM     │
│ (Tu branding)       │  (Tu branding)     │
└──────────────────────────────────────────┘

Resolución final: 1200x1800px (300 DPI)
```

---

## 🚀 Plan de Desarrollo

### Semana 1: Setup + Captura
**Días 1-2: Estructura**
- Setup Electron + React + TypeScript
- Setup Python + FastAPI
- Comunicación Electron ↔ Python
- Sistema de diseño base

**Días 3-5: Captura**
- Integrar webcam (react-webcam + OpenCV)
- Live preview
- Captura individual
- Guardar fotos localmente

**Entregable:** App captura 1 foto

---

### Semana 2: Flow Core
**Días 1-3: Multi-foto + Countdown**
- Countdown animado (3-2-1)
- Flash simulado
- Captura secuencial (3 fotos)
- Indicador progreso (1/3, 2/3, 3/3)
- Pausas entre fotos

**Días 4-5: Composición de Tira + Diseños Personalizados**
- Pillow: layout 3 fotos vertical
- **Sistema de diseños personalizados por evento**
- Upload diseño footer (PNG/JPG)
- Galería de diseños predefinidos
- Preview tira completa con diseño
- Endpoint: POST /api/image/compose-strip
- Endpoint: POST /api/templates/upload-design

**Entregable:** Tira de 3 fotos + diseño personalizado generada

---

### Semana 3: Impresión + Polish
**Días 1-2: Sistema Impresión**
- win32print (Windows)
- Detección impresoras
- Imprimir 2 copias automáticamente
- Barra progreso
- Manejo errores

**Días 3-4: QR + Settings + Gestor de Diseños**
- QR code para descarga
- Panel configuración (F1)
- Selección cámara/impresora
- **Gestor de diseños personalizados:**
  - Upload diseños por evento
  - Galería de diseños guardados
  - Preview en tiempo real
  - Selección rápida de diseño activo
  - Librería de diseños predefinidos
- Guardar config (electron-store)

**Días 5-7: Polish + Testing**
- Animaciones finales
- Sonidos opcionales
- Error handling
- Testing intensivo
- Bug fixes

**Entregable:** MVP listo para producción

---

## 📂 Estructura del Proyecto

```
photobooth/
├── frontend/               # Electron + React
│   ├── src/
│   │   ├── main/          # Electron main
│   │   └── renderer/      # React app
│   │       ├── components/
│   │       │   ├── screens/
│   │       │   │   ├── StartScreen.tsx
│   │       │   │   ├── CountdownScreen.tsx
│   │       │   │   ├── CaptureScreen.tsx
│   │       │   │   ├── ProcessingScreen.tsx
│   │       │   │   ├── PreviewScreen.tsx
│   │       │   │   └── SuccessScreen.tsx
│   │       │   └── shared/
│   │       ├── store/     # Zustand
│   │       └── styles/    # Tailwind
│   └── package.json
│
├── backend/               # Python FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── camera.py
│   │   │   ├── image.py
│   │   │   ├── print.py
│   │   │   └── qr.py
│   │   └── services/
│   │       ├── camera_service.py
│   │       ├── image_service.py
│   │       ├── print_service.py
│   │       └── qr_service.py
│   └── requirements.txt
│
└── data/
    ├── photos/            # Fotos originales
    ├── strips/            # Tiras finales
    ├── designs/           # Diseños personalizados por evento
    │   ├── xv_anos/
    │   ├── san_valentin/
    │   ├── bodas/
    │   └── custom/
    └── photobooth.db      # SQLite
```

---

## 🎨 Pantallas Principales

### 1. Inicio
- Live preview cámara (grande, centrado)
- Botón "📸 INICIAR SESIÓN" (gigante, imposible de perder)
- Texto: "Serán 3 fotos en una tira"

### 2. Countdown
- Número gigante: 3, 2, 1
- Texto: "Primera foto - ¡Prepárate!"
- Indicador: [● ○ ○] 1 de 3
- Animación: Scale + gradiente

### 3. Captura
- Flash blanco pantalla completa (200ms)
- Texto: "✨ ¡SONRÍE! ✨"
- Freeze frame 500ms

### 4. Entre Fotos
- "✅ Foto 1 lista"
- Thumbnail pequeño de foto capturada
- "Prepárate para la siguiente"
- [● ● ○] 2 de 3

### 5. Procesando
- Spinner elegante
- "✨ Creando tu tira ✨"
- Barra progreso

### 6. Imprimiendo
- Preview tira completa
- "🖨️ Imprimiendo..."
- Barra progreso: "[████] 2 copias"

### 7. Éxito
- "🎉 ¡Listo!"
- "Recoge tus fotos en la impresora"
- QR code grande
- "Escanea para descargar"
- Auto-return en 5s

---

## 📊 APIs Backend

### Camera
```python
POST /api/camera/capture
Body: { "camera_id": 0 }
Response: { "file_path": "...", "session_id": "..." }
```

### Image
```python
POST /api/image/compose-strip
Body: {
  "photo_paths": ["1.jpg", "2.jpg", "3.jpg"],
  "design_path": "data/designs/xv_anos/liz_design.png",
  "custom_text": "¡Boda María & Juan!" (opcional),
  "logo_path": "logo.png" (opcional)
}
Response: { "strip_path": "...", "preview_url": "..." }
```

### Design Management
```python
POST /api/designs/upload
Body: FormData with image file
Response: { "design_id": "...", "design_path": "..." }

GET /api/designs/list
Response: { "designs": [
  { "id": "1", "name": "XV Años Liz", "preview": "..." },
  { "id": "2", "name": "San Valentín", "preview": "..." }
]}

PUT /api/designs/set-active
Body: { "design_id": "1" }
Response: { "success": true }
```

### Print
```python
POST /api/print/queue
Body: {
  "file_path": "strip_001.jpg",
  "copies": 2,
  "printer_name": "Canon SELPHY"
}
Response: { "status": "printing", "job_id": "..." }
```

### QR
```python
POST /api/qr/generate
Body: { "strip_path": "strip_001.jpg" }
Response: { "qr_image": "base64...", "download_url": "..." }
```

---

## 🔮 Futuras Features (Post-MVP)

### Fase 2: Compartir
- ✉️ Email con fotos (cuando hay internet)
- 📱 WhatsApp Business API
- 📤 Upload a Google Drive/Dropbox

### Fase 3: Avanzado
- 🎥 GIF Booth mode
- 🖼️ Background removal AI (rembg)
- 🎨 Props y stickers virtuales
- 📊 Photo Kiosk (segunda laptop)
- 🎭 Filtros estilo Instagram

### Fase 4: Profesional
- 📷 DSLR support (Canon/Nikon)
- 🪞 Mirror Booth mode
- 📈 Analytics dashboard
- 🌍 Multi-idioma

---

## ✅ Checklist Pre-Evento

Antes de usar en evento real:

### Hardware
- [ ] Laptop cargada + cable conectado
- [ ] Webcam funcionando (o cámara externa)
- [ ] Impresora configurada + conectada
- [ ] Papel fotográfico suficiente (100+ tiras)
- [ ] Tinta/ribbon impresora llenos
- [ ] Iluminación adecuada (ring light)

### Software
- [ ] App instalada y testeada
- [ ] Logo del evento subido
- [ ] Texto personalizado configurado
- [ ] Impresora detectada correctamente
- [ ] Test: 10 impresiones consecutivas OK
- [ ] Storage: 50GB+ disponibles
- [ ] Modo kiosk activado (F11 fullscreen)

### Configuración
- [ ] Desactivar sleep/screensaver
- [ ] Desactivar actualizaciones automáticas
- [ ] Desactivar WiFi (si no es necesario)
- [ ] Volumen sonido adecuado
- [ ] Brillo pantalla máximo

### Contingencias
- [ ] Backup papel fotográfico extra
- [ ] Backup tinta/ribbon
- [ ] USB con app instalador
- [ ] Lista de troubleshooting
- [ ] Teléfono de soporte

---

## 📈 Métricas de Éxito

### Experiencia Usuario
- ✅ Tiempo por sesión: <35 segundos
- ✅ Clicks requeridos: 1
- ✅ Usuarios completan sin ayuda: >95%
- ✅ Tasa de error: <1%

### Técnico
- ✅ Uptime durante evento: >99%
- ✅ Impresiones fallidas: <2%
- ✅ Calidad de imagen: 300 DPI
- ✅ Storage: <100MB por sesión

---

## 🎯 Próximos Pasos

1. **Revisar y aprobar este plan**
2. **Crear estructura del proyecto**
3. **Iniciar Semana 1: Setup + Captura**
4. **Testing continuo**
5. **Iterar basado en feedback**

---

**Timeline Total MVP:** 3 semanas  
**Listo para evento:** 4 semanas (con testing)  
**Costo total:** $0 (vs $189 de SparkBooth)
