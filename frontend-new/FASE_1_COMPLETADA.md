# ✅ FASE 1 COMPLETADA: Sincronización Backend-Frontend

**Fecha**: Noviembre 8, 2025  
**Status**: ✅ Implementado y listo para probar

---

## 🎯 QUÉ SE HIZO

### 1. **API Service Actualizado** (`src/services/api.ts`)

Se actualizaron TODOS los endpoints para usar la API real del backend:

#### Antes (❌ Incorrecto):
```typescript
photoboothAPI.image.upload(blob)          // No existe
photoboothAPI.print.createStrip(ids)      // No existe  
photoboothAPI.print.send(stripId)         // No existe
```

#### Después (✅ Correcto):
```typescript
// Captura con OpenCV
photoboothAPI.camera.capture({ camera_id: 0, session_id })
// → { success, session_id, file_path }

// Componer strip con diseño
photoboothAPI.image.composeStrip({ 
  photo_paths: [...],
  design_path: "...",
  session_id 
})
// → { success, strip_path, full_page_path }

// Imprimir formato 2x
photoboothAPI.print.queue({ 
  file_path: full_page_path,
  copies: 1 
})
// → { success, message, printer_used }

// Diseños de Canva
photoboothAPI.designs.list()
photoboothAPI.designs.upload(file, name)
photoboothAPI.designs.setActive(id)
photoboothAPI.designs.getActive()
photoboothAPI.designs.delete(id)
```

---

### 2. **Store Actualizado** (`src/store/useAppStore.ts`)

Se agregaron nuevos campos para manejar rutas del backend:

```typescript
interface AppState {
  // ... campos existentes ...
  
  // ✨ NUEVO: Rutas del backend para compose-strip
  photoPaths: string[];          // ["/photos/session123/photo_1.jpg", ...]
  addPhotoPath: (path: string) => void;
  clearPhotoPaths: () => void;
}
```

**¿Por qué?**  
El backend devuelve rutas de archivos que luego se usan para componer el strip.

---

### 3. **CaptureScreen Actualizado** (`src/screens/CaptureScreen.tsx`)

#### Cambio Principal: Captura con Backend (OpenCV)

**Antes:**
```typescript
// ❌ Captura con webcam del browser
const imageSrc = webcamRef.current.getScreenshot();
const blob = await fetch(imageSrc).then(r => r.blob());
```

**Después:**
```typescript
// ✅ Captura con backend (OpenCV - mejor calidad)
const response = await photoboothAPI.camera.capture({
  camera_id: 0,
  session_id: sessionId
});

// Guardar ruta del backend
addPhotoPath(response.file_path);
// → "/photos/20251108_143025/photo_143025_123.jpg"
```

#### Beneficios:
- ✅ Mejor calidad de imagen (OpenCV vs webcam browser)
- ✅ Soporte para cámaras profesionales (DSLR)
- ✅ Fotos guardadas en servidor (persistentes)
- ✅ Mismo flujo para todas las plataformas

#### Nota:
`react-webcam` todavía se usa para **PREVIEW** (mostrar video en vivo), pero NO para capturar.

---

### 4. **ProcessingScreen Actualizado** (`src/screens/ProcessingScreen.tsx`)

#### Cambio Principal: Usar Diseño de Canva

```typescript
// 1. Obtener diseño activo
const activeDesignResponse = await photoboothAPI.designs.getActive();
const designPath = activeDesignResponse.active_design?.file_path;

// 2. Componer strip con diseño
const stripResponse = await photoboothAPI.image.composeStrip({
  photo_paths: photoPaths,  // Rutas del backend
  design_path: designPath,  // Diseño de Canva (opcional)
  session_id: sessionId
});

// 3. Backend devuelve 2 archivos:
// - strip_path: Tira simple (600x1800px)
// - full_page_path: Formato 2x (1200x1800px) ← Para imprimir
```

#### Qué hace el Backend:
1. Toma las 3 fotos
2. Las redimensiona y recorta (600x400 cada una)
3. Las apila verticalmente
4. Agrega el diseño de Canva abajo (600x450px)
5. Crea la tira simple (600x1800px)
6. Duplica la tira lado a lado (1200x1800px) ← **2x format**
7. Agrega línea de corte punteada

---

### 5. **SuccessScreen Actualizado** (`src/screens/SuccessScreen.tsx`)

#### Cambio Principal: Imprimir Formato 2x

```typescript
const handlePrint = async () => {
  // ✅ Imprimir full_page_path (formato 2x)
  await photoboothAPI.print.queue({
    file_path: stripImageUrl,  // full_page_path (2 tiras)
    copies: 1  // 1 hoja = 2 tiras
  });
};
```

**Resultado:**
- 1 hoja impresa = 2 tiras idénticas
- Cliente corta por la mitad
- Obtiene 2 photo strips para repartir

---

### 6. **App.tsx Mejorado** (`src/App.tsx`)

Se agregó:
- ✅ Verificación periódica del backend (cada 30 seg)
- ✅ Cleanup automático al volver a `start`
- ✅ Reset de `photoPaths` entre sesiones

---

## 🔄 FLUJO COMPLETO ACTUALIZADO

```
1. START
   └─> Usuario presiona "INICIAR SESIÓN"

2. COUNTDOWN (3-2-1)
   └─> Voces: "3... 2... 1... ¡Sonríe!"

3. CAPTURE (3 fotos)
   └─> Para cada foto:
       ├─> Preview: react-webcam muestra video
       ├─> Countdown: 3-2-1
       ├─> Captura: Backend OpenCV captura foto
       │   └─> POST /api/camera/capture
       │       └─> Devuelve: { file_path: "/photos/..." }
       ├─> Store: Guarda ruta en photoPaths[]
       └─> UI: Muestra thumbnail en preview

4. PROCESSING
   ├─> Obtiene diseño activo de Canva
   │   └─> GET /api/designs/active
   ├─> Compone strip con backend
   │   └─> POST /api/image/compose-strip
   │       ├─> photo_paths: [3 rutas]
   │       ├─> design_path: ruta del diseño
   │       └─> Devuelve:
   │           ├─> strip_path (600x1800)
   │           └─> full_page_path (1200x1800) ← Formato 2x
   └─> Guarda rutas en store

5. SUCCESS
   ├─> Muestra fotos capturadas
   ├─> Botón IMPRIMIR
   │   └─> POST /api/print/queue
   │       ├─> file_path: full_page_path
   │       └─> copies: 1
   │       └─> Imprime 1 hoja con 2 tiras
   ├─> Auto-reset en 15 segundos
   └─> Botón "Nueva Sesión" para reiniciar
```

---

## 📁 ARCHIVOS MODIFICADOS

```
frontend-new/src/
├── services/
│   └── api.ts                    🔧 Endpoints actualizados
├── store/
│   └── useAppStore.ts            🔧 photoPaths agregado
├── screens/
│   ├── CaptureScreen.tsx         🔧 Usa backend OpenCV
│   ├── ProcessingScreen.tsx      🔧 Usa diseño de Canva
│   └── SuccessScreen.tsx         🔧 Imprime formato 2x
└── App.tsx                       🔧 Cleanup mejorado
```

---

## ✅ LISTO PARA PROBAR

### Requisitos:

1. **Backend corriendo**:
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload
   # o
   python app/main.py
   ```
   Debe estar en: `http://127.0.0.1:8000`

2. **Frontend corriendo**:
   ```bash
   cd frontend-new
   npm start
   ```

### Testing Manual:

1. ✅ Abrir app
2. ✅ Verificar "Backend connected" en consola
3. ✅ Presionar "INICIAR SESIÓN"
4. ✅ Pasar countdown
5. ✅ Capturar 3 fotos
   - Ver en consola: "POST /api/camera/capture"
   - Ver thumbnails en la parte inferior
6. ✅ Ver processing
   - Ver en consola: "POST /api/image/compose-strip"
7. ✅ Ver success
8. ✅ Presionar "Imprimir"
   - Ver en consola: "POST /api/print/queue"

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Backend no conecta

**Síntoma**: `⚠️ Backend not available` en consola

**Solución**:
```bash
# Verificar que backend esté corriendo
curl http://127.0.0.1:8000/health

# Debe devolver: {"status":"healthy",...}
```

### Error al capturar foto

**Síntoma**: `Error capturing photo` en UI

**Posibles causas**:
1. Backend no está corriendo
2. Cámara no disponible
3. Permisos de cámara denegados

**Solución**:
```bash
# Test de cámara en backend
curl http://127.0.0.1:8000/api/camera/list

# Debe devolver lista de cámaras
```

### Error al componer strip

**Síntoma**: `Error al procesar imágenes`

**Solución**:
- Verificar que las 3 fotos se capturaron
- Ver consola del backend para errores
- Verificar que carpeta `/photos` exista y tenga permisos

### Error al imprimir

**Síntoma**: `Error al enviar a imprimir`

**Solución**:
```bash
# Listar impresoras
curl http://127.0.0.1:8000/api/print/printers

# Debe devolver lista de impresoras disponibles
```

---

## 📊 ENDPOINTS USADOS

| Endpoint | Método | Usado en | Qué hace |
|----------|--------|----------|----------|
| `/health` | GET | App.tsx | Verificar backend |
| `/api/camera/capture` | POST | CaptureScreen | Capturar foto con OpenCV |
| `/api/designs/active` | GET | ProcessingScreen | Obtener diseño activo |
| `/api/image/compose-strip` | POST | ProcessingScreen | Crear strip con diseño |
| `/api/print/queue` | POST | SuccessScreen | Imprimir formato 2x |

---

## 🎯 PRÓXIMOS PASOS (FASE 2)

1. **Pantalla de Diseños** (1 hora)
   - Listar diseños disponibles
   - Subir nuevo diseño de Canva
   - Activar/desactivar diseños

2. **Galería del Evento** (2 horas)
   - Ver todas las sesiones del día
   - Exportar fotos digitales
   - Re-imprimir sesiones

3. **Settings** (1 hora)
   - Configurar cronómetro
   - Ajustar cantidad de fotos
   - Configuración de audio

4. **Hotkeys** (30 min)
   - F1: Settings
   - F2: Galería
   - F3: Diseños
   - ESC: Volver a inicio

---

## 💬 NOTAS IMPORTANTES

### React-Webcam vs Backend Capture

**¿Por qué mantener react-webcam?**
- Para mostrar PREVIEW en vivo
- Buena UX (usuario se ve antes de capturar)

**¿Por qué capturar con backend?**
- Mejor calidad de imagen
- Soporte para cámaras profesionales
- Fotos persistentes en servidor
- Mismo código para todas las plataformas

### Formato 2x

**Backend ya lo hace automáticamente:**
- `strip_path`: Tira simple (600x1800)
- `full_page_path`: 2 tiras lado a lado (1200x1800)

**No hay que implementar nada más** ✅

### Diseños de Canva

**Backend ya soporta:**
- Upload de PNG/JPG
- Redimensión automática a 600x450
- Activar/desactivar diseños
- Aplicar diseño al componer strip

**Solo falta la UI** (FASE 2)

---

**¿Todo claro?** ¡Ahora a probarlo! 🚀
