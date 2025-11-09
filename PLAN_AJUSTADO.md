# 🎯 PLAN AJUSTADO - Photobooth Profesional

**Basado en el plan original pero aprovechando lo que YA EXISTE en el backend**

---

## 📊 ESTADO ACTUAL

### ✅ Backend YA tiene (No hay que crear):
- ✅ Sistema completo de diseños de Canva
- ✅ Formato 2x (duplicado) en 4x6"
- ✅ Composición de tiras con diseño
- ✅ Captura con OpenCV
- ✅ Impresión
- ✅ API REST completa

### ⚠️ Frontend FALTA:
- ❌ Conectar con API del backend
- ❌ Pantalla de diseños
- ❌ Galería del evento
- ❌ Settings/Configuración
- ❌ Hotkeys
- ❌ localStorage para persistencia

---

## 🚀 FASE 1: Sincronización Backend-Frontend (2-3 horas) ⭐⭐⭐

**CRÍTICA - Sin esto nada funciona**

### 1.1 Actualizar API Service (30 min)

**Archivo**: `frontend-new/src/services/api.ts`

Cambiar de:
```typescript
// ❌ INCORRECTO (no existe en backend)
photoboothAPI.image.upload(blob)
photoboothAPI.print.createStrip(imageIds)
```

A:
```typescript
// ✅ CORRECTO (endpoints reales)
photoboothAPI.camera.capture({ camera_id: 0, session_id })
photoboothAPI.image.composeStrip({ photo_paths, design_path, session_id })
photoboothAPI.print.queue({ file_path, copies: 2 })
photoboothAPI.designs.list()
photoboothAPI.designs.upload(file)
photoboothAPI.designs.setActive(designId)
photoboothAPI.designs.getActive()
```

### 1.2 Cambiar Captura a Backend (1 hora)

**Archivo**: `frontend-new/src/screens/CaptureScreen.tsx`

**Estrategia híbrida:**
- `react-webcam`: Solo para PREVIEW (no captura)
- Backend: Captura REAL con OpenCV (mejor calidad)

```typescript
// ANTES: Captura con webcam del browser
const imageSrc = webcamRef.current.getScreenshot();

// DESPUÉS: Captura con backend
const response = await photoboothAPI.camera.capture({
  camera_id: 0,
  session_id: sessionId
});
// response.file_path = "/photos/session123/photo_123.jpg"
```

### 1.3 Actualizar ProcessingScreen (30 min)

**Archivo**: `frontend-new/src/screens/ProcessingScreen.tsx`

```typescript
// Obtener diseño activo
const activeDesign = await photoboothAPI.designs.getActive();

// Componer strip con diseño
const stripResponse = await photoboothAPI.image.composeStrip({
  photo_paths: [
    "/photos/session123/photo_1.jpg",
    "/photos/session123/photo_2.jpg",
    "/photos/session123/photo_3.jpg"
  ],
  design_path: activeDesign?.file_path || null,
  session_id: sessionId
});

// stripResponse.strip_path = tira simple (600x1800)
// stripResponse.full_page_path = formato 2x (1200x1800)
```

### 1.4 Actualizar SuccessScreen (30 min)

```typescript
// Imprimir el formato 2x (duplicado)
await photoboothAPI.print.queue({
  file_path: fullPagePath,  // ← La hoja con 2 tiras
  copies: 1  // 1 hoja = 2 tiras
});
```

---

## 🚀 FASE 2: Pantalla de Diseños (1 hora) ⭐⭐

**IMPORTANTE - Administrar diseños de Canva**

### 2.1 Crear DesignManagerScreen

**Nuevo archivo**: `frontend-new/src/screens/DesignManagerScreen.tsx`

**Features:**
- Listar diseños disponibles
- Preview de cada diseño
- Botón "Activar" para seleccionar diseño
- Drag & drop para subir nuevo diseño
- Eliminar diseños viejos
- Badge "Activo" en el diseño seleccionado

**Acceso:**
- Hotkey: `F3`
- Botón en `StartScreen`: 🎨 Diseño

### 2.2 Componente DesignUploader

**Nuevo archivo**: `frontend-new/src/components/DesignUploader.tsx`

```typescript
interface DesignUploaderProps {
  onUpload: (file: File) => void;
}

// Features:
// - Zona drag & drop visual
// - Mostrar preview
// - Validación: PNG/JPG, max 5MB
// - Dimensiones recomendadas: 600x450px
```

### 2.3 Hook useDesigns

**Nuevo archivo**: `frontend-new/src/hooks/useDesigns.ts`

```typescript
export const useDesigns = () => {
  const [designs, setDesigns] = useState([]);
  const [activeDesign, setActiveDesign] = useState(null);

  const loadDesigns = async () => { /* ... */ };
  const uploadDesign = async (file: File) => { /* ... */ };
  const activateDesign = async (id: string) => { /* ... */ };
  const deleteDesign = async (id: string) => { /* ... */ };

  return { designs, activeDesign, loadDesigns, uploadDesign, ... };
};
```

---

## 🚀 FASE 3: Galería del Evento (2 horas) ⭐⭐⭐

**MUY IMPORTANTE - Para entregar fotos digitales**

### 3.1 EventStorage Service

**Nuevo archivo**: `frontend-new/src/services/eventStorage.ts`

```typescript
interface EventSession {
  id: string;
  timestamp: Date;
  photos: string[];         // Rutas de fotos en backend
  stripPath: string;        // Strip generado
  fullPagePath: string;     // Formato 2x
  printed: boolean;
  guestName?: string;
}

export const EventStorage = {
  // Guardar sesión
  saveSession(session: EventSession): void {
    const sessions = this.getAllSessions();
    sessions.push(session);
    localStorage.setItem('event_sessions', JSON.stringify(sessions));
  },

  // Obtener todas
  getAllSessions(): EventSession[] {
    const data = localStorage.getItem('event_sessions');
    return data ? JSON.parse(data) : [];
  },

  // Limpiar evento
  clearEvent(): void {
    localStorage.removeItem('event_sessions');
  },

  // Estadísticas
  getStats() {
    const sessions = this.getAllSessions();
    return {
      totalSessions: sessions.length,
      totalPhotos: sessions.length * 3,
      printed: sessions.filter(s => s.printed).length,
    };
  }
};
```

### 3.2 EventGalleryScreen

**Nuevo archivo**: `frontend-new/src/screens/EventGalleryScreen.tsx`

**Features:**
- Grid de sesiones del evento
- Cada sesión muestra:
  - 3 thumbnails de las fotos
  - Timestamp
  - Badge "Impreso" ✓
  - Número de sesión
- Estadísticas arriba:
  - "Sesiones: 24"
  - "Fotos: 72"
  - "Impresas: 20"
- Acciones:
  - Re-imprimir sesión
  - Ver en grande
  - Exportar todas (botón grande)
  - Limpiar galería (con confirmación)

**Acceso:**
- Hotkey: `F2`
- Botón en `StartScreen`: 📸 Galería

### 3.3 Exportar Fotos

**Función en EventGalleryScreen:**

```typescript
const exportAllPhotos = async () => {
  const sessions = EventStorage.getAllSessions();
  
  // Opción 1: Crear ZIP (requiere biblioteca)
  // Opción 2: Copiar a carpeta de descargas
  // Opción 3: Mostrar lista de rutas para copiar manual
  
  // Más simple para MVP:
  // Mostrar modal con rutas de TODAS las fotos
  const allPhotos = sessions.flatMap(s => s.photos);
  const allStrips = sessions.map(s => s.fullPagePath);
  
  // Usuario puede copiar rutas y recuperar archivos del backend
};
```

---

## 🚀 FASE 4: Settings/Configuración (1 hora) ⭐⭐

**IMPORTANTE - Personalización del evento**

### 4.1 Settings Store

**Agregar a**: `frontend-new/src/store/useAppStore.ts`

```typescript
interface Settings {
  // Captura
  photosToTake: 3 | 4 | 6;
  countdownSeconds: 3 | 5 | 10;
  timeBetweenPhotos: 1 | 1.5 | 2 | 3;
  
  // Audio
  enableVoice: boolean;
  enableSounds: boolean;
  volume: number; // 0-100
  
  // Backend
  backendUrl: string;
  cameraId: number;
  
  // Evento
  eventName: string;
  testMode: boolean; // No imprime realmente
}

// Guardar en localStorage
const loadSettings = () => {
  const saved = localStorage.getItem('photobooth_settings');
  return saved ? JSON.parse(saved) : defaultSettings;
};

const saveSettings = (settings: Settings) => {
  localStorage.setItem('photobooth_settings', JSON.stringify(settings));
};
```

### 4.2 AdminSettingsScreen

**Nuevo archivo**: `frontend-new/src/screens/AdminSettingsScreen.tsx`

**Secciones:**

1. **Captura**
   - Cantidad de fotos: [3] [4] [6]
   - Countdown inicial: [3s] [5s] [10s]
   - Tiempo entre fotos: [1s] [1.5s] [2s] [3s]

2. **Audio**
   - ☑ Voces en español
   - ☑ Efectos de sonido
   - Volumen: [======|----] 60%

3. **Evento**
   - Nombre del evento: [_______________]
   - ☑ Modo de prueba (no imprimir)
   - Botón: "Limpiar galería del evento"

4. **Avanzado**
   - URL Backend: http://127.0.0.1:8000
   - Cámara ID: [0]
   - Test cámara: [Probar]

**Acceso:**
- Hotkey: `F1`
- Botón en `StartScreen`: ⚙️ Config

---

## 🚀 FASE 5: Hotkeys y Mejoras UI (1 hora) ⭐

**ÚTIL - Navegación rápida**

### 5.1 Hook useHotkeys

**Nuevo archivo**: `frontend-new/src/hooks/useHotkeys.ts`

```typescript
export const useHotkeys = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F1: Settings
      if (e.key === 'F1') {
        e.preventDefault();
        setCurrentScreen('settings');
      }
      
      // F2: Galería
      if (e.key === 'F2') {
        e.preventDefault();
        setCurrentScreen('gallery');
      }
      
      // F3: Diseños
      if (e.key === 'F3') {
        e.preventDefault();
        setCurrentScreen('designs');
      }
      
      // ESC: Volver al inicio
      if (e.key === 'Escape') {
        e.preventDefault();
        reset();
        setCurrentScreen('start');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};
```

### 5.2 Actualizar App.tsx

Agregar nuevas pantallas al router:

```typescript
case 'settings':
  return <AdminSettingsScreen />;
case 'gallery':
  return <EventGalleryScreen />;
case 'designs':
  return <DesignManagerScreen />;
```

### 5.3 Mejorar StartScreen

Agregar botones en las esquinas:

```tsx
<div className="absolute top-4 left-4">
  <button onClick={() => setCurrentScreen('designs')}>
    🎨 Diseño (F3)
  </button>
</div>

<div className="absolute top-4 right-4">
  <button onClick={() => setCurrentScreen('gallery')}>
    📸 Galería (F2) · Sesiones: {stats.totalSessions}
  </button>
</div>

<div className="absolute bottom-4 left-4">
  <button onClick={() => setCurrentScreen('settings')}>
    ⚙️ Config (F1)
  </button>
</div>

{/* Mostrar diseño activo si hay */}
{activeDesign && (
  <div className="absolute bottom-4 right-4">
    <img src={activeDesign.preview_url} className="h-20" />
    <p className="text-xs">Diseño activo</p>
  </div>
)}
```

---

## 🚀 FASE 6: Componentes Reutilizables (2 horas) ⭐

**OPCIONAL pero recomendado**

Crear biblioteca de componentes consistentes:

```
frontend-new/src/components/ui/
├── Button.tsx          # Botones primarios/secundarios
├── Modal.tsx           # Modal con overlay
├── ConfirmDialog.tsx   # "¿Estás seguro?"
├── Badge.tsx           # Badges de estado
├── Card.tsx            # Tarjetas
└── Toast.tsx           # Notificaciones
```

---

## 📋 RESUMEN DE ARCHIVOS A CREAR

### Nuevos Archivos:

```
frontend-new/src/
├── screens/
│   ├── DesignManagerScreen.tsx     ✨ NUEVO
│   ├── EventGalleryScreen.tsx      ✨ NUEVO
│   ├── AdminSettingsScreen.tsx     ✨ NUEVO
├── components/
│   ├── DesignUploader.tsx          ✨ NUEVO
│   ├── SessionThumbnail.tsx        ✨ NUEVO
│   └── ui/
│       ├── Button.tsx              ✨ NUEVO
│       ├── Modal.tsx               ✨ NUEVO
│       ├── ConfirmDialog.tsx       ✨ NUEVO
│       └── Badge.tsx               ✨ NUEVO
├── services/
│   └── eventStorage.ts             ✨ NUEVO
└── hooks/
    ├── useDesigns.ts               ✨ NUEVO
    ├── useHotkeys.ts               ✨ NUEVO
    └── useSettings.ts              ✨ NUEVO
```

### Archivos a Modificar:

```
frontend-new/src/
├── services/
│   └── api.ts                      🔧 ACTUALIZAR endpoints
├── screens/
│   ├── CaptureScreen.tsx           🔧 Usar backend para captura
│   ├── ProcessingScreen.tsx        🔧 Usar diseño activo
│   ├── SuccessScreen.tsx           🔧 Guardar en galería
│   └── StartScreen.tsx             🔧 Agregar botones hotkeys
├── store/
│   └── useAppStore.ts              🔧 Agregar settings
└── App.tsx                         🔧 Agregar nuevas pantallas
```

---

## ⏱️ ESTIMACIÓN DE TIEMPO

| Fase | Descripción | Tiempo | Prioridad |
|------|-------------|--------|-----------|
| 1 | Sincronización Backend-Frontend | 2-3h | 🔴 CRÍTICA |
| 2 | Pantalla de Diseños | 1h | 🟡 ALTA |
| 3 | Galería del Evento | 2h | 🟡 ALTA |
| 4 | Settings/Configuración | 1h | 🟡 ALTA |
| 5 | Hotkeys y Mejoras UI | 1h | 🟢 MEDIA |
| 6 | Componentes UI | 2h | 🔵 BAJA |
| **TOTAL** | | **9-10h** | |

---

## 🎯 RESULTADO FINAL

Al completar este plan tendrás:

✅ Backend + Frontend sincronizados
✅ Sistema de diseños de Canva funcional
✅ Formato 2x (2 tiras en 1 hoja) automático
✅ Galería completa del evento
✅ Exportar todas las fotos
✅ Panel de administración
✅ Configurar cronómetro y opciones
✅ Hotkeys (F1, F2, F3, ESC)
✅ Voces en español
✅ Estadísticas del evento
✅ Modo de prueba

**¡Un photobooth profesional completo!** 🎉

---

## 🚀 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

### Día 1 (4-5 horas):
1. ✅ FASE 1 completa (Backend-Frontend sync)
2. ✅ Probar flujo end-to-end
3. ✅ FASE 2 (Diseños)

### Día 2 (3-4 horas):
4. ✅ FASE 3 (Galería)
5. ✅ FASE 4 (Settings)

### Día 3 (2-3 horas):
6. ✅ FASE 5 (Hotkeys y mejoras)
7. ✅ Testing completo
8. ✅ Documentación

### Opcional:
9. FASE 6 (Componentes UI bonitos)

---

## 📝 NOTAS IMPORTANTES

1. **Backend ya tiene lo difícil** - Solo falta conectar
2. **No reinventar la rueda** - Usar lo que ya existe
3. **Priorizar lo funcional** - UI bonita después
4. **Probar frecuentemente** - Flujo end-to-end
5. **localStorage para persistencia** - Sobrevive reinicios

---

**¿Empezamos con FASE 1?** Esa es la base para todo lo demás.
