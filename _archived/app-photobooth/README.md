# 📸 PhotoBooth App - Frontend

Aplicación de PhotoBooth moderna construida con Electron, React, Vite y Tailwind CSS v4.

## 🚀 Tecnologías

- **Electron 39.1.1** - Framework desktop
- **React 19** - UI Library
- **Vite 5.4** - Build tool con HMR
- **Tailwind CSS v4** - Styling con plugin de Vite
- **TypeScript** - Type safety
- **Zustand** - State management
- **Axios** - HTTP client
- **React Webcam** - Acceso a cámara
- **Framer Motion** - Animaciones
- **Radix UI** - Componentes accesibles

## 📦 Instalación

```bash
npm install
```

## 🧪 Modo Desarrollo

### Opción 1: Frontend solo (sin backend)
```bash
npm start
```

La app se abrirá en una ventana de Electron con:
- ✅ Hot Module Replacement (HMR)
- ✅ DevTools abiertos automáticamente
- ✅ Preview de cámara funcional
- ⚠️  Backend no conectado (verás warning en consola)

### Opción 2: Frontend + Backend (sistema completo)

1. **Terminal 1 - Backend:**
```bash
cd ../backend
source .venv/bin/activate  # o .venv\Scripts\activate en Windows
uv run python main.py
```

Verás:
```
✅ Backend corriendo en http://127.0.0.1:8000
✅ FastAPI server iniciado
```

2. **Terminal 2 - Frontend:**
```bash
npm start
```

Verás en la consola de DevTools:
```
✅ Backend conectado
```

## 🎮 Cómo Usar la Aplicación

### Pantalla de Inicio (StartScreen)
- Verás el preview de tu cámara web
- Haz clic en el botón gigante **"INICIAR SESIÓN"**
- Si la cámara no funciona, verifica permisos del sistema

### Flujo de Captura
1. **Countdown** - Cuenta regresiva 3, 2, 1
2. **Capture** - Se toman 3 fotos automáticamente
3. **Processing** - Se crea la tira con el diseño
4. **Success** - ¡Listo! Recoge tus fotos

## 🔧 Comandos Disponibles

```bash
# Desarrollo
npm start           # Iniciar app en modo desarrollo

# Build
npm run package     # Empaquetar para distribución
npm run make        # Crear instalador

# Linting (cuando esté configurado)
npm run lint
```

## 📁 Estructura del Proyecto

```
app-photobooth/
├── src/
│   ├── components/
│   │   └── screens/          # Pantallas de la app
│   │       ├── StartScreen.tsx
│   │       ├── CountdownScreen.tsx
│   │       └── CaptureScreen.tsx
│   ├── store/
│   │   └── useAppStore.ts    # Estado global (Zustand)
│   ├── services/
│   │   └── api.ts            # Cliente API backend
│   ├── types/
│   │   └── index.ts          # TypeScript types
│   ├── lib/
│   │   └── utils.ts          # Utilidades (cn, etc)
│   ├── App.tsx               # Componente principal
│   ├── renderer.jsx          # Punto de entrada React
│   ├── main.js               # Proceso principal Electron
│   └── preload.js            # Preload script
├── package.json
├── vite.renderer.config.mjs  # Config Vite
└── forge.config.js           # Config Electron Forge
```

## 🐛 Troubleshooting

### La cámara no funciona
- **macOS:** Ve a `Preferencias del Sistema > Seguridad y Privacidad > Cámara`
- **Windows:** Verifica permisos en Configuración
- **Linux:** Asegúrate de tener permisos de video: `sudo usermod -a -G video $USER`

### Backend no conecta
1. Verifica que el backend esté corriendo en `http://127.0.0.1:8000`
2. Prueba abrir `http://127.0.0.1:8000/health` en tu navegador
3. Revisa que no haya otro proceso usando el puerto 8000

### Puerto 5173 en uso
```bash
# Encuentra el proceso
lsof -ti:5173

# Mátalo
kill -9 $(lsof -ti:5173)
```

### DevTools no se abre
- Presiona `Cmd+Option+I` (macOS) o `Ctrl+Shift+I` (Windows/Linux)
- O descomenta `mainWindow.webContents.openDevTools()` en `src/main.js`

## 🎨 Personalización

### Cambiar a Modo Kiosk (Fullscreen)
En `src/main.js`, descomenta:
```javascript
fullscreen: true,
kiosk: true,
```

### Cambiar tamaño de ventana
En `src/main.js`:
```javascript
width: 1920,   // Tu ancho
height: 1080,  // Tu alto
```

### Backend URL
En `src/services/api.ts`:
```javascript
const API_BASE_URL = 'http://127.0.0.1:8000';  // Cambia aquí
```

## 📝 Notas de Desarrollo

- **HMR:** Los cambios en React se reflejan instantáneamente
- **Main Process:** Cambios en `main.js` requieren reiniciar (teclea `rs` en terminal)
- **TypeScript:** Los errores de tipo se muestran en tiempo real
- **Tailwind:** IntelliSense funciona automáticamente

## 🚢 Producción

Para crear un build de producción:

```bash
npm run package
```

Esto creará un ejecutable en la carpeta `out/`.

## 📞 Soporte

Si encuentras problemas, revisa:
1. Consola de DevTools (errores frontend)
2. Terminal donde corre `npm start` (errores de build)
3. Backend logs (errores de API)

## 🎉 ¡Listo!

Tu PhotoBooth app está lista para usarse. Disfruta capturando momentos increíbles! 📸✨
