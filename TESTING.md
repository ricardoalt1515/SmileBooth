# 🧪 Guía de Testing - PhotoBooth App

## 📋 Checklist de Pruebas

### ✅ Setup Inicial

1. **Instalar dependencias:**
```bash
cd app-photobooth
npm install
```

2. **Verificar backend (opcional para pruebas básicas):**
```bash
cd backend
source .venv/bin/activate
uv run python main.py
```

---

## 🎯 Escenarios de Prueba

### Test 1: Frontend Solo (Sin Backend)

**Objetivo:** Verificar que la UI funciona independientemente

```bash
cd app-photobooth
npm start
```

**Verificaciones:**
- [ ] App abre en ventana Electron (1920x1080)
- [ ] Preview de cámara se muestra
- [ ] DevTools está abierto
- [ ] Console muestra: `⚠️  Backend no responde`
- [ ] Botón "INICIAR SESIÓN" está visible
- [ ] Tailwind CSS está aplicado (colores, gradientes)
- [ ] Hot reload funciona (edita `src/App.tsx` y guarda)

**Problemas comunes:**
- Si cámara no carga: revisar permisos del sistema
- Si ventana no abre: revisar logs en terminal

---

### Test 2: Frontend + Backend (Sistema Completo)

**Objetivo:** Probar flujo completo de captura

#### Paso 1: Iniciar Backend
```bash
# Terminal 1
cd /Users/ricardoaltamirano/Developer/photobooth/backend
source .venv/bin/activate
uv run python main.py
```

**Verificar:**
```bash
# En otro terminal o navegador
curl http://127.0.0.1:8000/health
# Respuesta esperada: {"status":"healthy"}
```

#### Paso 2: Iniciar Frontend
```bash
# Terminal 2
cd /Users/ricardoaltamirano/Developer/photobooth/app-photobooth
npm start
```

**Verificaciones:**
- [ ] Console muestra: `✅ Backend conectado`
- [ ] Click en "INICIAR SESIÓN"
- [ ] Countdown aparece (3, 2, 1)
- [ ] Se toman 3 fotos automáticamente
- [ ] Pantalla "Processing" aparece
- [ ] Pantalla "Success" con 🎉

#### Paso 3: Verificar Fotos Creadas
```bash
cd /Users/ricardoaltamirano/Developer/photobooth/backend
ls -la sessions/
# Deberías ver carpetas con timestamps
```

---

### Test 3: Estado de Zustand

**Objetivo:** Verificar gestión de estado

1. Abrir DevTools (está abierto por defecto)
2. En Console, ejecutar:
```javascript
// Ver estado completo
window.__ZUSTAND__ = require('./src/store/useAppStore').useAppStore
window.__ZUSTAND__.getState()
```

**Estado inicial esperado:**
```javascript
{
  currentScreen: 'start',
  currentSession: null,
  settings: { cameraId: 0, designPath: null, autoPrint: true, printCopies: 2 },
  countdown: 0,
  isLoading: false
}
```

---

### Test 4: Tailwind CSS v4

**Objetivo:** Verificar que Tailwind funciona

1. Inspeccionar cualquier elemento en DevTools
2. Verificar clases aplicadas: `bg-gradient-to-br`, `text-white`, etc.
3. Los estilos deben estar compilados (no warning en console)

**Modificación en vivo:**
```typescript
// Edita src/App.tsx
<div className="bg-red-500 text-white p-8">
  Tailwind funciona!
</div>
```
Debe verse rojo inmediatamente.

---

### Test 5: React Webcam

**Objetivo:** Verificar acceso a cámara

**Verificaciones:**
- [ ] Preview se muestra en StartScreen
- [ ] Video es espejo (mirrored)
- [ ] Resolución: 640x480
- [ ] Sin delays perceptibles

**Permisos:**
- **macOS:** Sistema → Privacidad → Cámara → Agregar Electron
- **Windows:** Configuración → Privacidad → Cámara
- **Linux:** Usuario en grupo `video`

---

### Test 6: API Communication

**Objetivo:** Verificar llamadas HTTP

1. Abrir DevTools → Network tab
2. Click "INICIAR SESIÓN"
3. Verificar requests:
   - [ ] `POST /api/camera/capture` (3 veces)
   - [ ] `POST /api/image/compose-strip` (1 vez)
   - [ ] Responses: `200 OK`

---

### Test 7: Performance

**Objetivo:** Verificar bajo consumo de recursos

```bash
# En macOS
open -a "Activity Monitor"
# Buscar "Electron"

# En Linux
htop
```

**Valores esperados:**
- CPU: < 10% en idle
- RAM: < 300MB
- GPU: Mínimo (si está habilitado)

---

## 🐛 Debugging

### Console útil

```javascript
// Estado actual
console.log(useAppStore.getState())

// Cambiar pantalla manualmente
useAppStore.setState({ currentScreen: 'countdown' })

// Forzar reset
useAppStore.getState().resetSession()
```

### Logs Backend

```bash
# Terminal donde corre el backend
# Verás:
INFO:     127.0.0.1:xxxxx - "POST /api/camera/capture HTTP/1.1" 200 OK
```

---

## 🚀 Build de Producción

### Test Build

```bash
cd app-photobooth
npm run package
```

**Verificar:**
- [ ] Build completa sin errores
- [ ] Ejecutable creado en `out/`
- [ ] App funciona sin DevTools
- [ ] Tamaño razonable (< 200MB)

---

## 📊 Matriz de Compatibilidad

| OS | Versión | Estado | Notas |
|---|---|---|---|
| macOS | 12+ | ✅ Tested | Permisos cámara requeridos |
| Windows | 10/11 | ✅ Tested | Defender puede bloquear |
| Linux | Ubuntu 22.04+ | ✅ Tested | Grupo `video` requerido |

---

## 🎉 Test Exitoso: Checklist Final

- [ ] ✅ App abre correctamente
- [ ] ✅ Cámara funciona
- [ ] ✅ Backend conecta
- [ ] ✅ Se capturan 3 fotos
- [ ] ✅ Tira se genera
- [ ] ✅ Archivos se guardan
- [ ] ✅ No hay errores en console
- [ ] ✅ Hot reload funciona
- [ ] ✅ Performance es buena

## 🔥 Tips Avanzados

### Modo Kiosk
Para testing en producción, edita `src/main.js`:
```javascript
fullscreen: true,
kiosk: true,
```

### Debug Mode
```bash
ELECTRON_ENABLE_LOGGING=1 npm start
```

### Remote Debugging
```bash
npm start -- --remote-debugging-port=9222
```

---

¡Listo para probar! 🚀
