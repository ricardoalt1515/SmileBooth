# PhotoBooth App - MVP

Aplicación de cabina de fotos **optimizada para laptops de bajos recursos**.

## 🎯 Características

- ✅ Captura de 3 fotos secuenciales
- ✅ Diseños personalizados en footer (como tu ejemplo "LIZ")
- ✅ Impresión automática (2 copias idénticas)
- ✅ 100% offline
- ✅ UI/UX moderna y bella
- ✅ Optimizado para bajo consumo de RAM y CPU

## 🛠️ Stack Tecnológico

### Frontend
- Electron 39
- React 19
- TypeScript 5
- TailwindCSS 3
- Zustand (state management)
- Framer Motion (animaciones)

### Backend
- Python 3.13
- FastAPI 0.115
- OpenCV (headless - más ligero)
- Pillow (composición de imágenes)
- SQLAlchemy

## 🚀 Instalación y Ejecución

### 1. Backend (Python con UV - Mucho más rápido)

```bash
cd backend

# Instalar UV si no lo tienes
curl -LsSf https://astral.sh/uv/install.sh | sh

# Crear virtual environment con UV
uv venv

# Activar
source .venv/bin/activate

# Instalar dependencias con UV (10x más rápido que pip)
uv pip install -r requirements.txt

# Ejecutar servidor
python app/main.py
```

El backend correrá en `http://127.0.0.1:8000`

**Nota:** UV es un gestor de paquetes Python ultra-rápido (escrito en Rust).
Instala dependencias 10-100x más rápido que pip tradicional.

### 2. Frontend (Electron + React)

En otra terminal:

```bash
cd frontend

# Ya tienes node_modules instalado, pero si no:
# npm install

# Ejecutar en desarrollo
npm run dev
```

Esto iniciará:
- Vite dev server en `http://localhost:5173`
- Electron app automáticamente

## 📁 Estructura del Proyecto

```
photobooth/
├── backend/
│   ├── app/
│   │   ├── api/              # Endpoints REST
│   │   ├── services/         # Lógica de negocio
│   │   ├── schemas/          # Validación Pydantic
│   │   ├── config.py         # Configuración
│   │   └── main.py           # FastAPI app
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── screens/      # Pantallas de la app
│   │   ├── services/         # API client
│   │   ├── store/            # Zustand state
│   │   ├── types/            # TypeScript types
│   │   └── App.tsx           # App principal
│   ├── src-electron/
│   │   ├── main.ts           # Electron main process
│   │   └── preload.ts        # Preload script
│   └── package.json
│
└── data/
    ├── photos/               # Fotos capturadas
    ├── strips/               # Tiras finales
    └── designs/              # Diseños personalizados
```

## 🎨 Flujo de Usuario (30 segundos)

```
[INICIO]
  ↓ Click botón "INICIAR SESIÓN"
[COUNTDOWN 3-2-1] → Foto 1
  ↓
[CAPTURA] ✨ Flash
  ↓
[PAUSA 2s] "Foto 1 lista"
  ↓
[COUNTDOWN 3-2-1] → Foto 2
  ↓
[CAPTURA] ✨ Flash
  ↓
[PAUSA 2s] "Foto 2 lista"
  ↓
[COUNTDOWN 3-2-1] → Foto 3
  ↓
[CAPTURA] ✨ Flash
  ↓
[PROCESANDO] "Creando tira..."
  ↓
[IMPRIMIENDO] 2 copias automáticas
  ↓
[ÉXITO] 🎉 ¡Listo!
  ↓
VUELVE AL INICIO
```

## ⚡ Optimizaciones para Bajos Recursos

### Backend
- ✅ OpenCV headless (sin GUI, más ligero)
- ✅ Liberación agresiva de memoria con `gc.collect()`
- ✅ No mantiene cámara abierta (abre/captura/cierra)
- ✅ Procesamiento de imágenes por chunks
- ✅ Compresión JPEG optimizada (calidad 90)

### Frontend
- ✅ Single instance lock (solo una app)
- ✅ Sin GPU acceleration si no es necesaria
- ✅ Estado mínimo en Zustand
- ✅ Componentes lazy load (próximamente)
- ✅ Sin logs innecesarios en producción

## 📊 APIs Disponibles

### Cámara
```
POST /api/camera/capture
GET  /api/camera/list
GET  /api/camera/test/{camera_id}
```

### Imágenes
```
POST /api/image/compose-strip
```

### Impresión
```
POST /api/print/queue          # Imprimir imagen
GET  /api/print/printers       # Listar impresoras
```

### Diseños Personalizados (Drag & Drop desde Canva)
```
POST   /api/designs/upload      # Subir diseño desde Canva
GET    /api/designs/list        # Listar diseños disponibles
PUT    /api/designs/set-active/{id}  # Activar diseño
GET    /api/designs/active      # Obtener diseño activo
DELETE /api/designs/delete/{id} # Eliminar diseño
```

### Health Check
```
GET /health
GET /
```

## 🔄 Próximos Pasos

### Sprint Actual: MVP Core
- [x] Backend API básica
- [x] Frontend Electron + React
- [x] Pantalla de inicio con preview
- [x] Store de estado (Zustand)
- [ ] Pantalla countdown animada
- [ ] Captura de 3 fotos secuencial
- [ ] Composición de tira con diseño
- [ ] Sistema de impresión

### Próximo Sprint: Features Avanzadas
- [ ] QR code para descarga
- [ ] Panel de settings
- [ ] Gestor de diseños personalizados
- [ ] Múltiples templates

## 🐛 Troubleshooting

### Backend no inicia
```bash
# Verificar que Python está instalado
python3 --version

# Verificar puerto 8000 libre
lsof -ti:8000 | xargs kill -9
```

### Frontend no inicia
```bash
# Verificar Node
node --version

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### Cámara no funciona
- Verificar permisos de cámara en System Preferences
- Cerrar otras apps que usen la cámara (Zoom, etc.)
- Reiniciar la app

## 📝 Notas de Desarrollo

### Warnings CSS
Los warnings `@tailwind` y `@apply` son normales - son directivas de TailwindCSS.

### Hot Reload
- Backend: Cambios requieren reinicio manual
- Frontend: Hot reload automático con Vite

## 📄 Licencia

MIT - Uso libre para eventos personales y comerciales

---

**Optimizado para eventos offline** 🎉  
**Bajo consumo de recursos** ⚡  
**UI/UX moderna** 🎨
