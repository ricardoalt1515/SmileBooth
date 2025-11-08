# Photobooth App - Frontend

Frontend de aplicación de escritorio para photobooth construido con tecnologías modernas.

## 🚀 Stack Tecnológico

### Core
- **Electron** 39.1.1 - Framework para aplicaciones de escritorio multiplataforma
- **React** 19.2.0 - Librería UI con hooks modernos
- **TypeScript** (modo estricto) - Type-safety y mejor DX
- **Vite** 5.4+ - Build tool ultra-rápido con HMR

### Build & Packaging
- **Electron Forge** 7.10.2 - Herramienta oficial para empaquetado
- **Plugin Vite** - Integración Vite + Electron
- **Plugin Fuses** - Seguridad hardening

### Frontend
- **Tailwind CSS** v4.1+ - Framework CSS utility-first
- **Zustand** - State management simple y poderoso
- **Axios** - Cliente HTTP para backend API

## 📁 Estructura del Proyecto

```
frontend-new/
├── src/
│   ├── main.ts              # Proceso principal de Electron
│   ├── preload.ts           # Script de preload (bridge seguro)
│   ├── renderer.tsx         # Entry point de React
│   ├── App.tsx              # Componente raíz con navegación
│   ├── index.css            # Estilos globales + Tailwind
│   ├── components/          # Componentes reutilizables
│   ├── screens/             # Pantallas principales
│   │   ├── StartScreen.tsx
│   │   ├── CountdownScreen.tsx
│   │   ├── CaptureScreen.tsx
│   │   └── SuccessScreen.tsx
│   ├── store/               # Estado global
│   │   └── useAppStore.ts   # Zustand store
│   ├── services/            # Servicios externos
│   │   └── api.ts           # Cliente API para backend
│   ├── types/               # Definiciones TypeScript
│   │   └── index.ts
│   ├── hooks/               # Custom React hooks
│   └── utils/               # Utilidades y helpers
├── forge.config.ts          # Configuración Electron Forge
├── vite.renderer.config.mjs # Config Vite para renderer
├── vite.main.config.mjs     # Config Vite para main
├── vite.preload.config.mjs  # Config Vite para preload
├── tsconfig.json            # Configuración TypeScript
├── package.json
└── index.html               # Template HTML

```

## 🛠️ Comandos Disponibles

### Desarrollo
```bash
npm start
```
- Inicia la aplicación en modo desarrollo
- Hot Module Replacement (HMR) activado
- DevTools abierto automáticamente
- URL local: http://localhost:5173

### Packaging
```bash
npm run package
```
- Crea el paquete de la aplicación sin instalador
- Output en carpeta `out/`

### Make (Build de Producción)
```bash
npm run make
```
- Crea instaladores para la plataforma actual:
  - **Windows**: Instalador NSIS (`.exe`)
  - **macOS**: ZIP con app (`.app`)
  - **Linux**: DEB y RPM packages

### Linting
```bash
npm run lint
```
- Ejecuta ESLint en todos los archivos TypeScript/TSX

## 🎮 Modo Kiosk

La aplicación soporta modo kiosk para producción (pantalla completa sin controles).

### Activar Modo Kiosk:
```bash
KIOSK_MODE=true npm start
```

### Características del Modo Kiosk:
- Pantalla completa real (no solo fullscreen)
- Sin barra de menú
- Sin controles de ventana
- Single instance lock (previene múltiples instancias)
- Optimizaciones de memoria

## 🔧 Configuración Principal

### main.ts (src/main.ts:1)
Proceso principal de Electron con:
- ✅ Single instance lock
- ✅ Ventana 1920x1080 (configurable)
- ✅ Modo Kiosk opcional vía env var
- ✅ Context isolation activado (seguridad)
- ✅ Background throttling desactivado (importante para photobooth)
- ✅ DevTools en desarrollo
- ✅ Memory optimization (garbage collection)

### API Backend (src/services/api.ts:1)
Cliente configurado para:
- **Base URL**: `http://127.0.0.1:8000` (configurable vía `VITE_API_URL`)
- **Timeout**: 30 segundos
- **Interceptors**: Logging automático de requests/responses

Endpoints disponibles:
- `/health` - Health check
- `/camera/*` - Gestión de cámara
- `/image/*` - Upload de imágenes
- `/print/*` - Creación e impresión de strips
- `/design/*` - Plantillas de diseño

### Store (src/store/useAppStore.ts:1)
Estado global con Zustand:
- `currentScreen` - Navegación entre pantallas
- `sessionId` - ID de sesión actual
- `countdownSeconds` - Segundos de countdown (default: 3)
- `photosToTake` - Cantidad de fotos a capturar (default: 3)

## 📱 Flujo de Navegación

La app usa navegación basada en estado (sin router):

```
StartScreen → CountdownScreen → CaptureScreen → SuccessScreen
    ↑                                                   ↓
    └─────────────────────────────────────────────────┘
                     (Botón "Volver")
```

**Implementación**: Ver `src/App.tsx:1` para la lógica de routing.

## 🎨 Tailwind CSS v4

Configuración moderna usando `@tailwindcss/vite`:
- Import directo en CSS: `@import "tailwindcss";`
- Sin archivo de configuración necesario
- JIT mode por defecto
- Tree-shaking automático

## 🔐 Seguridad

### Configuración Segura:
- ✅ `nodeIntegration: false` - No expone Node.js al renderer
- ✅ `contextIsolation: true` - Aísla contextos
- ✅ Preload script para bridge seguro
- ✅ Fuses activados (ver forge.config.ts)

### Fuses Configurados:
- RunAsNode: disabled
- EnableCookieEncryption: enabled
- EnableNodeOptionsEnvironmentVariable: disabled
- EnableNodeCliInspectArguments: disabled
- EnableEmbeddedAsarIntegrityValidation: enabled
- OnlyLoadAppFromAsar: enabled

## 📦 Permisos (macOS)

Configurados en `forge.config.ts:16`:
- **NSCameraUsageDescription** - Acceso a cámara
- **NSMicrophoneUsageDescription** - Acceso a micrófono (opcional)
- **NSDocumentsFolderUsageDescription** - Guardar fotos
- **NSDownloadsFolderUsageDescription** - Guardar fotos

## 🐛 Troubleshooting

### Error: ESM/CommonJS mismatch
**Solución**: Los archivos de configuración de Vite deben ser `.mjs` (ya configurado)

### Error: Cannot find module 'electron'
**Solución**: `npm install`

### La cámara no funciona
**Verificar**:
1. Permisos del sistema operativo
2. Backend corriendo en puerto 8000
3. Endpoint `/camera/list` accesible

### HMR no funciona
**Verificar**:
1. Vite dev server corriendo (check console)
2. Puerto 5173 disponible
3. No hay firewalls bloqueando

## 🚀 Próximos Pasos para Desarrollo

1. **Integrar cámara real**:
   - Usar `react-webcam` o API nativa
   - Implementar captura en CaptureScreen

2. **Conectar con backend**:
   - Llamar API en cada acción
   - Manejar errores y loading states

3. **Agregar animaciones**:
   - Transiciones entre screens
   - Feedback visual durante captura

4. **Testing**:
   - Unit tests con Vitest
   - E2E tests con Playwright

5. **Build para producción**:
   - Code signing (macOS/Windows)
   - Auto-updater con Squirrel
   - Analytics (opcional)

## 📚 Recursos

- [Electron Docs](https://www.electronjs.org/docs/latest)
- [Electron Forge Docs](https://www.electronforge.io/)
- [React 19 Docs](https://react.dev/)
- [Vite Docs](https://vite.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Zustand Docs](https://zustand.docs.pmnd.rs/)

## 📄 Licencia

MIT

---

**Creado con** ⚡ Electron Forge + React + Vite + Tailwind CSS v4
