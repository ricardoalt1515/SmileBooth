# Photo Booth - Stack Tecnológico
**Proyecto**: Cabina de Fotos para Eventos  
**Plataformas**: Windows y macOS  
**Fecha**: Octubre 2025  
**Tipo**: Desktop Application (Offline-First)

---

## 📋 Resumen Ejecutivo

Aplicación desktop para cabina de fotos en eventos (bodas, XV años, etc.) que opera **offline** con laptop, cámara e impresora.

### Arquitectura
- **Frontend**: Electron + React (UI/UX)
- **Backend**: Python + FastAPI (Processing)
- **Comunicación**: HTTP local (localhost:8000)
- **Storage**: SQLite + File System

---

## 🎯 Stack Frontend

### Electron + React + TypeScript

```json
{
  "name": "photobooth-app",
  "version": "1.0.0",
  "main": "dist/main.js",
  "dependencies": {
    "electron": "^28.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

### UI Framework
```json
{
  "ui-dependencies": {
    "tailwindcss": "^3.4.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-slider": "^1.1.2",
    "shadcn/ui": "latest",
    "framer-motion": "^10.16.0",
    "lucide-react": "^0.300.0"
  }
}
```

### State Management
```json
{
  "state": {
    "zustand": "^4.4.0",
    "axios": "^1.6.0",
    "electron-store": "^8.1.0"
  }
}
```

### ¿Por qué Electron?
- ✅ Cross-platform (Windows + macOS)
- ✅ Acceso completo a hardware (cámara, impresora)
- ✅ Kiosk mode para eventos
- ✅ Offline-first por diseño
- ✅ Fácil distribución (.exe, .dmg)
- ✅ Gran ecosistema 2025

---

## 🐍 Stack Backend

### Python + FastAPI

```txt
# Python 3.12+
fastapi==0.110.0
uvicorn[standard]==0.27.0
pydantic==2.5.0
python-multipart==0.0.9
```

### Image Processing
```txt
# Core Image Libraries
pillow==10.2.0          # Image manipulation
opencv-python==4.9.0    # Computer vision, webcam
imageio==2.33.0         # GIF creation
imageio-ffmpeg==0.4.9   # Video encoding
numpy==1.26.3           # Array operations
```

### AI/ML (Background Removal)
```txt
# Offline Background Removal
rembg==2.0.50           # AI background removal (offline!)
onnxruntime==1.16.0     # ML inference
```

### Camera Control
```txt
# DSLR Camera Control
gphoto2==2.5.0          # Canon, Nikon, Sony DSLRs (Mac/Linux)

# Webcam (ya incluido en OpenCV)
```

### QR Codes
```txt
qrcode[pil]==7.4.2      # QR code generation
```

### Database
```txt
sqlalchemy==2.0.25      # ORM
alembic==1.13.0         # Migrations
```

### Printer Control

**Windows:**
```txt
pywin32==306            # Windows printing API
```

**macOS/Linux:**
```txt
pycups==2.0.1           # CUPS printing system
```

### ¿Por qué Python?
- ✅ **rembg**: Background removal offline sin APIs
- ✅ **Pillow**: Image processing profesional
- ✅ **gPhoto2**: Control DSLR nativo
- ✅ **OpenCV**: Webcam y computer vision
- ✅ **Gran comunidad** en fotografía/imagen
- ✅ **Printer control** nativo Windows/Mac

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────┐
│              ELECTRON APP (Frontend)                │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │  React UI Layer (Port: N/A - Renderer)       │ │
│  │  ────────────────────────────────────────     │ │
│  │  Components:                                  │ │
│  │   • LivePreview (camera feed)                │ │
│  │   • CountdownScreen                          │ │
│  │   • PhotoReview                              │ │
│  │   • LayoutEditor (drag-drop)                 │ │
│  │   • SettingsPanel                            │ │
│  │   • PrintQueue                               │ │
│  └───────────────────────────────────────────────┘ │
│                       ↕                             │
│                  IPC Bridge                         │
│                       ↕                             │
│  ┌───────────────────────────────────────────────┐ │
│  │  Electron Main Process (Node.js)             │ │
│  │  ────────────────────────────────────────     │ │
│  │   • Window management (fullscreen/kiosk)     │ │
│  │   • File system access                       │ │
│  │   • Hardware permissions                     │ │
│  │   • Backend process spawner                  │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                       ↕
              HTTP/WebSocket (localhost)
                       ↕
┌─────────────────────────────────────────────────────┐
│        PYTHON BACKEND (FastAPI Server)              │
│              Port: 8000 (localhost)                 │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │  API Endpoints                                │ │
│  │  ────────────────────────────────────────     │ │
│  │  POST /api/camera/capture                    │ │
│  │  POST /api/image/apply-layout                │ │
│  │  POST /api/image/remove-background           │ │
│  │  POST /api/image/add-overlay                 │ │
│  │  POST /api/gif/create                        │ │
│  │  POST /api/print/queue                       │ │
│  │  POST /api/qr/generate                       │ │
│  │  GET  /api/session/history                   │ │
│  └───────────────────────────────────────────────┘ │
│                       ↓                             │
│  ┌───────────────────────────────────────────────┐ │
│  │  Service Layer (Python Classes)              │ │
│  │  ────────────────────────────────────────     │ │
│  │  • CameraService                             │ │
│  │    - OpenCV (webcam)                         │ │
│  │    - gPhoto2 (DSLR)                          │ │
│  │                                               │ │
│  │  • ImageService                              │ │
│  │    - Pillow (resize, crop, overlay)          │ │
│  │    - rembg (background removal)              │ │
│  │    - Layout composition                      │ │
│  │                                               │ │
│  │  • PrintService                              │ │
│  │    - win32print (Windows)                    │ │
│  │    - pycups (macOS)                          │ │
│  │    - Print queue management                  │ │
│  │                                               │ │
│  │  • StorageService                            │ │
│  │    - SQLAlchemy ORM                          │ │
│  │    - File system management                  │ │
│  └───────────────────────────────────────────────┘ │
│                       ↓                             │
│  ┌───────────────────────────────────────────────┐ │
│  │  Data Layer                                   │ │
│  │  ────────────────────────────────────────     │ │
│  │  • SQLite Database (metadata)                │ │
│  │  • Local Folders:                            │ │
│  │    - photos/ (originals)                     │ │
│  │    - processed/ (with layouts)               │ │
│  │    - temp/ (working files)                   │ │
│  │    - templates/ (layout templates)           │ │
│  │    - backgrounds/ (custom backgrounds)       │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 📁 Estructura del Proyecto

```
photobooth/
├── frontend/                    # Electron + React
│   ├── src/
│   │   ├── main/               # Electron main process
│   │   │   ├── main.ts         # Entry point
│   │   │   ├── preload.ts      # IPC bridge
│   │   │   └── backend.ts      # Python process manager
│   │   │
│   │   └── renderer/           # React app
│   │       ├── App.tsx
│   │       ├── components/
│   │       │   ├── LivePreview.tsx
│   │       │   ├── Countdown.tsx
│   │       │   ├── PhotoReview.tsx
│   │       │   ├── LayoutEditor.tsx
│   │       │   └── Settings.tsx
│   │       ├── store/          # Zustand stores
│   │       ├── services/       # API clients
│   │       └── types/          # TypeScript types
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── electron-builder.yml    # Build config
│
├── backend/                     # Python FastAPI
│   ├── app/
│   │   ├── main.py             # FastAPI app
│   │   ├── api/
│   │   │   ├── camera.py       # Camera endpoints
│   │   │   ├── image.py        # Image processing
│   │   │   ├── print.py        # Printing
│   │   │   └── session.py      # Session management
│   │   │
│   │   ├── services/
│   │   │   ├── camera_service.py
│   │   │   ├── image_service.py
│   │   │   ├── bg_removal_service.py
│   │   │   ├── print_service.py
│   │   │   └── storage_service.py
│   │   │
│   │   ├── models/             # SQLAlchemy models
│   │   ├── schemas/            # Pydantic schemas
│   │   └── config.py           # Settings
│   │
│   ├── requirements.txt
│   └── pyproject.toml
│
├── data/                        # Runtime data
│   ├── photos/
│   ├── processed/
│   ├── temp/
│   ├── templates/
│   ├── backgrounds/
│   └── photobooth.db           # SQLite
│
├── scripts/                     # Build scripts
│   ├── build-backend.sh        # PyInstaller
│   └── build-app.sh            # Full build
│
└── README.md
```

---

## 🔄 Flujo de Datos

### 1. Inicio de la Aplicación

```typescript
// frontend/src/main/backend.ts
import { spawn } from 'child_process';
import path from 'path';

export class BackendManager {
  private process: ChildProcess | null = null;

  async start() {
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      // Development: Python directo
      this.process = spawn('python', ['backend/app/main.py']);
    } else {
      // Production: Ejecutable empaquetado
      const backendPath = path.join(
        process.resourcesPath,
        'backend',
        process.platform === 'win32' ? 'backend.exe' : 'backend'
      );
      this.process = spawn(backendPath);
    }

    // Esperar a que el servidor esté listo
    await this.waitForServer();
  }

  private async waitForServer() {
    const maxRetries = 30;
    for (let i = 0; i < maxRetries; i++) {
      try {
        await fetch('http://localhost:8000/health');
        console.log('✅ Backend ready');
        return;
      } catch {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    throw new Error('Backend failed to start');
  }
}
```

### 2. Captura de Foto

```typescript
// Frontend (React)
const capturePhoto = async () => {
  setCountdown(3);
  
  // Countdown visual
  for (let i = 3; i > 0; i--) {
    setCountdown(i);
    await sleep(1000);
  }
  
  // Capturar
  const response = await axios.post('http://localhost:8000/api/camera/capture', {
    camera_id: settings.cameraId,
    resolution: '1920x1080'
  });
  
  setPhotoPath(response.data.file_path);
};
```

```python
# Backend (Python)
from fastapi import APIRouter
import cv2

router = APIRouter()

@router.post("/capture")
async def capture_photo(request: CaptureRequest):
    # Captura con OpenCV (webcam)
    cap = cv2.VideoCapture(request.camera_id)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
    
    ret, frame = cap.read()
    cap.release()
    
    if not ret:
        raise HTTPException(status_code=500, detail="Capture failed")
    
    # Guardar
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"photo_{timestamp}.jpg"
    filepath = f"data/photos/{filename}"
    
    cv2.imwrite(filepath, frame)
    
    # Guardar en DB
    session = Session(
        filename=filename,
        timestamp=datetime.now(),
        status="captured"
    )
    db.add(session)
    db.commit()
    
    return {"file_path": filepath, "session_id": session.id}
```

### 3. Aplicar Layout

```python
@router.post("/apply-layout")
async def apply_layout(request: LayoutRequest):
    from PIL import Image, ImageDraw, ImageFont
    
    # Cargar foto original
    photo = Image.open(request.photo_path)
    
    # Cargar template del layout
    template = Image.open(f"data/templates/{request.template_id}.png")
    
    # Redimensionar foto para fit en template
    photo_resized = photo.resize((800, 600), Image.LANCZOS)
    
    # Pegar foto en template (posición definida en template config)
    template.paste(photo_resized, (100, 150))
    
    # Agregar texto personalizado
    if request.custom_text:
        draw = ImageDraw.Draw(template)
        font = ImageFont.truetype("arial.ttf", 48)
        draw.text(
            (template.width // 2, 50),
            request.custom_text,
            font=font,
            fill=(255, 255, 255),
            anchor="mm"
        )
    
    # Guardar resultado
    output_path = f"data/processed/{request.session_id}_layout.jpg"
    template.save(output_path, quality=95)
    
    return {"processed_path": output_path}
```

### 4. Background Removal (Offline)

```python
@router.post("/remove-background")
async def remove_background(request: BGRequest):
    from rembg import remove
    from PIL import Image
    
    # Cargar imagen
    input_image = Image.open(request.photo_path)
    
    # ¡Remover fondo con AI (offline)!
    output_image = remove(input_image)
    
    # Si hay background personalizado
    if request.background_path:
        background = Image.open(request.background_path)
        # Redimensionar background al tamaño de la foto
        background = background.resize(output_image.size)
        # Componer: background + persona sin fondo
        background.paste(output_image, (0, 0), output_image)
        output_image = background
    
    # Guardar
    output_path = f"data/processed/{request.session_id}_nobg.png"
    output_image.save(output_path)
    
    return {"processed_path": output_path}
```

### 5. Imprimir

```python
# Windows
@router.post("/print")
async def print_photo(request: PrintRequest):
    import win32print
    import win32ui
    from PIL import Image, ImageWin
    
    # Obtener impresora predeterminada o la configurada
    printer_name = request.printer_name or win32print.GetDefaultPrinter()
    
    # Abrir impresora
    hprinter = win32print.OpenPrinter(printer_name)
    
    try:
        # Crear contexto de dispositivo
        hdc = win32ui.CreateDC()
        hdc.CreatePrinterDC(printer_name)
        
        # Iniciar trabajo de impresión
        hdc.StartDoc(request.filename)
        hdc.StartPage()
        
        # Cargar y preparar imagen
        img = Image.open(request.file_path)
        dib = ImageWin.Dib(img)
        
        # Imprimir
        dib.draw(hdc.GetHandleOutput(), (0, 0, img.width, img.height))
        
        # Finalizar
        hdc.EndPage()
        hdc.EndDoc()
        hdc.DeleteDC()
        
        return {"status": "printed", "printer": printer_name}
        
    finally:
        win32print.ClosePrinter(hprinter)
```

---

## 🚀 Compilación y Distribución

### Backend (Python → Executable)

**Windows:**
```bash
# Instalar PyInstaller
pip install pyinstaller

# Compilar a .exe
pyinstaller --onefile \
  --name backend \
  --hidden-import=rembg \
  --hidden-import=onnxruntime \
  --add-data "backend/app:app" \
  backend/app/main.py

# Output: dist/backend.exe
```

**macOS:**
```bash
# Compilar a binary
pyinstaller --onefile \
  --name backend \
  --hidden-import=rembg \
  --hidden-import=onnxruntime \
  --add-data "backend/app:app" \
  backend/app/main.py

# Output: dist/backend (Unix executable)
```

### Frontend (Electron → Installer)

**electron-builder.yml:**
```yaml
appId: com.photobooth.app
productName: PhotoBooth

directories:
  output: release
  buildResources: build

files:
  - dist/**/*
  - package.json

extraResources:
  - from: ../backend/dist
    to: backend
  - from: ../data/templates
    to: templates
  - from: ../data/backgrounds
    to: backgrounds

win:
  target:
    - nsis
  icon: build/icon.ico

mac:
  target:
    - dmg
  icon: build/icon.icns
  category: public.app-category.photography

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
```

**Build Script:**
```bash
#!/bin/bash
# scripts/build-app.sh

# 1. Build backend
cd backend
pip install -r requirements.txt
pyinstaller backend.spec
cd ..

# 2. Build frontend
cd frontend
npm install
npm run build
npm run dist  # electron-builder

echo "✅ Build complete!"
echo "📦 Windows: frontend/release/PhotoBooth Setup.exe"
echo "📦 macOS: frontend/release/PhotoBooth.dmg"
```

---

## 🔧 Configuración de Desarrollo

### Prerrequisitos

**Windows:**
- Python 3.12+
- Node.js 20+
- Visual Studio Build Tools (para pywin32)
- Git

**macOS:**
- Python 3.12+ (via Homebrew)
- Node.js 20+ (via Homebrew)
- Xcode Command Line Tools
- Git

### Setup Inicial

```bash
# 1. Clonar proyecto
git clone <repo-url>
cd photobooth

# 2. Setup Backend
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS
source venv/bin/activate

pip install -r requirements.txt

# 3. Setup Frontend
cd ../frontend
npm install

# 4. Correr en desarrollo
# Terminal 1 (Backend)
cd backend
python app/main.py

# Terminal 2 (Frontend)
cd frontend
npm run dev
```

---

## 🎨 Features Roadmap

### Fase 1: MVP (2-3 semanas)
- [x] Definir stack tecnológico
- [ ] Setup proyecto
- [ ] Captura con webcam
- [ ] Countdown visual
- [ ] 1 layout básico
- [ ] Vista preview
- [ ] Guardar localmente
- [ ] Imprimir básico

### Fase 2: Core Features (2-3 semanas)
- [ ] Múltiples layouts
- [ ] Editor drag-drop layouts
- [ ] Text overlay personalizable
- [ ] Green screen básico
- [ ] Multi-foto layouts (2-4 fotos)
- [ ] Settings persistentes

### Fase 3: Advanced (2-3 semanas)
- [ ] AI Background removal (rembg)
- [ ] GIF booth mode
- [ ] Props/stickers virtuales
- [ ] QR code para download
- [ ] Session history
- [ ] Print queue management

### Fase 4: Professional (Opcional)
- [ ] DSLR support (gPhoto2)
- [ ] Email photos (cuando hay internet)
- [ ] Analytics dashboard
- [ ] Multiple cameras support
- [ ] Remote control (tablet/phone)

---

## 📊 Comparación con SparkBooth

| Feature | SparkBooth 7 | Nuestra App |
|---------|--------------|-------------|
| **Precio** | $149-189 | Gratis (desarrollo propio) |
| **Licencia** | 3 activaciones | Ilimitado |
| **Customización** | Limitada | Total control |
| **Background Removal** | APIs de pago | rembg offline gratis |
| **Plataformas** | Windows, macOS | Windows, macOS |
| **Open Source** | No | Sí |
| **Updates** | Depende de vendor | Control total |
| **Branding** | Marca SparkBooth | 100% tu marca |

---

## 🔐 Consideraciones de Seguridad

### Datos Locales
- Fotos almacenadas localmente en laptop
- No se suben a cloud por defecto
- SQLite database encriptado (opcional)
- Opción de borrado automático post-evento

### Privacidad
- Offline-first: No requiere internet
- No telemetría ni tracking
- GDPR-compliant por diseño
- Opción de anonimizar metadata

---

## 📝 Notas Finales

### Ventajas de Este Stack
- ✅ **Totalmente offline**: Perfecto para eventos sin WiFi
- ✅ **Cross-platform**: Windows + macOS con mismo código
- ✅ **Bajo costo**: Todo open source, $0 en licencias
- ✅ **Performance**: Python rápido para imagen, Electron para UI
- ✅ **Mantenible**: Stack moderno y bien documentado
- ✅ **Escalable**: Fácil agregar features nuevas

### Próximos Pasos
1. Setup estructura de carpetas
2. Configurar Electron + React
3. Configurar FastAPI backend
4. Implementar captura básica
5. Implementar primer layout
6. Testing en Windows y macOS
7. Compilar y distribuir

---

**Actualizado**: Octubre 2025  
**Stack Version**: 1.0  
**Mantenedor**: Ricardo Altamirano
