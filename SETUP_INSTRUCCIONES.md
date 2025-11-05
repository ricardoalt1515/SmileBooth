# Setup del Proyecto PhotoBooth - Comandos CLI
**Noviembre 2025** | Versiones Actuales

---

## ✅ Requisitos Previos

### macOS (tu sistema actual)
```bash
# Verificar versiones instaladas
node --version    # Debe ser 18+
python3 --version # Debe ser 3.12+
git --version

# Si no están instaladas o versiones antiguas:
# Instalar Homebrew (si no lo tienes)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalar Node.js (última versión LTS)
brew install node

# Instalar Python 3.12
brew install python@3.12

# Verificar Git
brew install git
```

---

## 🚀 Paso 1: Crear Estructura del Proyecto

```bash
# Ya estás en el directorio correcto
cd /Users/ricardoaltamirano/Developer/photobooth

# Crear estructura de carpetas
mkdir -p frontend backend data/{photos,strips,designs/{xv_anos,san_valentin,bodas,custom},temp} scripts docs

# Verificar estructura
tree -L 2 -d
```

---

## ⚡ Paso 2: Setup Frontend (Electron + React + TypeScript)

```bash
# Entrar a la carpeta frontend
cd frontend

# Inicializar proyecto con Vite + React + TypeScript (última versión)
npm create vite@latest . -- --template react-ts

# Cuando pregunte si desea sobrescribir, responde: y (yes)

# Instalar dependencias base
npm install

# Instalar Electron (última versión)
npm install electron electron-builder --save-dev
npm install electron-is-dev concurrently wait-on cross-env --save-dev

# Instalar UI dependencies (versiones actuales)
npm install tailwindcss postcss autoprefixer --save-dev
npm install @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-slider
npm install framer-motion lucide-react
npm install clsx tailwind-merge class-variance-authority

# State management y utilities
npm install zustand axios
npm install electron-store

# Camera y QR
npm install react-webcam qrcode

# Instalar shadcn/ui CLI
npm install -D @shadcn/ui

# Inicializar Tailwind
npx tailwindcss init -p

# Verificar package.json se creó correctamente
cat package.json
```

### Configurar package.json scripts

Agregar estos scripts al `package.json`:

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:vite\" \"wait-on http://localhost:5173 && npm run dev:electron\"",
    "dev:vite": "vite",
    "dev:electron": "cross-env NODE_ENV=development electron .",
    "build": "tsc && vite build",
    "build:electron": "electron-builder",
    "preview": "vite preview"
  },
  "main": "dist-electron/main.js"
}
```

---

## 🐍 Paso 3: Setup Backend (Python + FastAPI)

```bash
# Volver al root y entrar a backend
cd ../backend

# Crear entorno virtual con Python 3.12
python3.12 -m venv venv

# Activar entorno virtual
source venv/bin/activate

# Actualizar pip
pip install --upgrade pip

# Crear requirements.txt con versiones actuales
cat > requirements.txt << 'EOF'
# API Framework
fastapi==0.115.0
uvicorn[standard]==0.30.6
pydantic==2.9.2
python-multipart==0.0.17

# Image Processing
pillow==10.4.0
opencv-python==4.10.0.84
numpy==2.1.2

# QR Codes
qrcode[pil]==7.4.2

# Database
sqlalchemy==2.0.35
alembic==1.13.3

# Utils
python-dotenv==1.0.1

# macOS Printing
pycups==2.0.4

# Future: Background Removal (comentado por ahora)
# rembg==2.0.59
# onnxruntime==1.19.2
EOF

# Instalar dependencias
pip install -r requirements.txt

# Verificar instalación
pip list
```

### Crear estructura de carpetas backend

```bash
# Dentro de backend/
mkdir -p app/{api,services,models,schemas}

# Crear archivos __init__.py
touch app/__init__.py
touch app/api/__init__.py
touch app/services/__init__.py
touch app/models/__init__.py
touch app/schemas/__init__.py
```

---

## ⚙️ Paso 4: Crear Archivos Base

### Frontend: main.ts (Electron Main Process)

```bash
cd ../frontend
mkdir -p src/main
cat > src/main/main.ts << 'EOF'
import { app, BrowserWindow } from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // En desarrollo: Vite dev server
  // En producción: archivos build
  const url = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(url);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
EOF
```

### Frontend: preload.ts

```bash
cat > src/main/preload.ts << 'EOF'
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Aquí agregaremos métodos IPC después
  sendMessage: (channel: string, data: any) => {
    ipcRenderer.send(channel, data);
  },
  onMessage: (channel: string, callback: Function) => {
    ipcRenderer.on(channel, (_, data) => callback(data));
  },
});
EOF
```

### Backend: main.py

```bash
cd ../backend
cat > app/main.py << 'EOF'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="PhotoBooth API", version="1.0.0")

# CORS para desarrollo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "PhotoBooth API is running"}

@app.get("/")
async def root():
    return {"message": "PhotoBooth API - Ready for events!"}

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )
EOF
```

---

## 🎨 Paso 5: Configurar TailwindCSS

```bash
cd ../frontend

# Crear tailwind.config.js
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF1F6',
          100: '#FFE4ED',
          200: '#FFD0E0',
          300: '#FFB3CB',
          400: '#FF8CAD',
          500: '#FF6B9D',
          600: '#FF4777',
          700: '#E6245B',
          800: '#B31945',
          900: '#800F2F',
        },
        accent: {
          countdown: '#60A5FA',
          success: '#34D399',
          warning: '#FBBF24',
          error: '#EF4444',
        },
      },
      fontFamily: {
        display: ['Poppins', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
EOF

# Crear globals.css con imports de Tailwind
cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

@layer base {
  :root {
    --space-xs: 4px;
    --space-sm: 8px;
    --space-md: 16px;
    --space-lg: 24px;
    --space-xl: 32px;
    
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-xl: 24px;
    --radius-full: 9999px;
  }
  
  body {
    @apply font-body bg-gray-50 text-gray-900;
  }
  
  h1, h2, h3, h4, h5, h6 {
    @apply font-display;
  }
}
EOF
```

---

## 🧪 Paso 6: Testing del Setup

### Terminal 1: Backend
```bash
cd backend
source venv/bin/activate
python app/main.py

# Deberías ver:
# INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Terminal 2: Frontend (en otra terminal)
```bash
cd frontend
npm run dev

# Deberías ver:
# VITE v5.x.x  ready in xxx ms
# ➜  Local:   http://localhost:5173/
```

### Verificar:
1. Abre http://localhost:5173 - Deberías ver la app React
2. Abre http://127.0.0.1:8000/docs - Deberías ver la documentación FastAPI
3. Abre http://127.0.0.1:8000/health - Deberías ver `{"status":"ok"}`

---

## 📦 Paso 7: Crear Git Repository

```bash
# En el root del proyecto
cd /Users/ricardoaltamirano/Developer/photobooth

# Inicializar Git
git init

# Crear .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
frontend/node_modules/
backend/venv/
__pycache__/
*.pyc
*.pyo
*.pyd

# Build outputs
frontend/dist/
frontend/dist-electron/
backend/dist/
*.egg-info/

# Environment
.env
.env.local
*.local

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Data (no subir fotos de eventos)
data/photos/
data/strips/
data/designs/custom/
data/*.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
EOF

# Primer commit
git add .
git commit -m "🎉 Initial setup: Electron + React + Python + FastAPI"
```

---

## ✅ Verificación Final

Ejecuta estos comandos para verificar todo:

```bash
# Verificar estructura
tree -L 3 -I 'node_modules|venv|__pycache__'

# Verificar versiones Node/Python
echo "Node version:"
node --version

echo "NPM version:"
npm --version

echo "Python version:"
python3 --version

echo "Pip packages:"
cd backend
source venv/bin/activate
pip list | grep -E "fastapi|uvicorn|pillow|opencv"
```

---

## 🎯 Próximos Pasos

Ahora que el setup está listo:

1. **Backend**: Crear endpoints para cámara
2. **Frontend**: Crear componente de live preview
3. **Integración**: Conectar Electron con Python
4. **Testing**: Primera captura de foto

---

## 🆘 Troubleshooting

### Error: "command not found: npm"
```bash
brew install node
```

### Error: "Python version too old"
```bash
brew install python@3.12
```

### Error: "Cannot find module 'electron'"
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Error: "Port 5173 already in use"
```bash
# Matar proceso en puerto 5173
lsof -ti:5173 | xargs kill -9
```

### Error: "Port 8000 already in use"
```bash
# Matar proceso en puerto 8000
lsof -ti:8000 | xargs kill -9
```

---

**¡Setup completo!** ✅ Ahora tienes la base para empezar a desarrollar.
