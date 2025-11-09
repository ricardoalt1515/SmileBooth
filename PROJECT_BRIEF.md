# PhotoBooth - Project Overview

## ¿Qué es?

**PhotoBooth profesional para eventos sociales**

Aplicación de escritorio (Electron) que captura 3 fotos automáticas, crea una tira personalizada con diseño de Canva, y permite imprimir o descargar. Ideal para bodas, XV años, fiestas corporativas y eventos sociales.

---

## ¿Cómo funciona?

### Flujo del Usuario:

```
1. App abre → Usuario ve cámara en vivo
2. Toca pantalla (o SPACE) → Inicia countdown
3. Countdown 5-4-3-2-1 → Captura foto 1
4. Pausa 2 segundos → Countdown → Captura foto 2
5. Pausa 2 segundos → Countdown → Captura foto 3
6. Processing (2s) → Crea tira con diseño
7. Success → Opciones: Imprimir / Nueva sesión
8. Auto-reset en 30 segundos
```

### Setup del Evento:

```
Hardware:
├─ Laptop (macOS/Windows)
├─ TV/Monitor (HDMI) - Para que usuarios vean
├─ Cámara USB/Webcam - Captura fotos
├─ Impresora térmica - Imprime tiras
└─ Props opcionales (sombreros, lentes, etc.)

Software:
├─ Backend (Python FastAPI) - Puerto 8000
└─ Frontend (Electron App) - Auto-abre
```

---

## Stack Técnico

### Frontend:
```
- Electron 39.1.1 - Desktop app
- React 19 - UI framework
- TypeScript - Type safety
- Vite 5 - Build tool
- Tailwind CSS v4 - Styling
- Zustand - State management
- react-webcam - Camera preview
```

### Backend:
```
- Python 3.11+
- FastAPI - REST API
- OpenCV - Camera capture
- Pillow (PIL) - Image composition
- uvicorn - ASGI server
- pycups - Printing (macOS)
```

### Audio:
```
- Web Speech API - Spanish voices
- Web Audio API - Sound effects
```

---

## UX Principles

### 🎨 Minimalista
- **Colores:** Negro (`#0a0a0a`) + Magenta (`#ff0080`) + Blanco
- **Fondo:** Negro sólido (sin gradientes complejos)
- **Un solo color de acento:** Magenta vibrante
- **Sin decoraciones innecesarias**
- **Espaciado consistente:** Sistema de 8px

### 🚀 Simple
- **Una pantalla unificada** (no 5 pantallas separadas)
- **6 estados claros:** idle → countdown → capturing → pausing → processing → success
- **Botones grandes:** Mínimo 80px altura (touch-friendly)
- **Instrucciones evidentes:** "TOCA PARA COMENZAR"

### 🎉 Divertido (pero sutil)
- **Animaciones sutiles:** Pulse en slot actual, fade en transiciones
- **Voces en español:** TTS para feedback auditivo
- **Sonidos:** Beep countdown, shutter al capturar, success
- **Feedback visual:** Flash al capturar, checkmarks en slots

### ♿ Accesible
- **ARIA labels** en todos los botones
- **Keyboard navigation:** SPACE (iniciar), ESC (reset)
- **Focus indicators** visibles
- **Alto contraste:** Blanco sobre negro
- **Textos grandes:** Mínimo 16px

---

## Arquitectura

### Una Pantalla Unificada con State Machine

```
┌────────────────────────────────────────────────┐
│ SIDEBAR   │    MAIN AREA                      │
│ (15%)     │    (85%)                           │
│           │                                    │
│ [Slot 1]  │  📹 Webcam Preview                │
│           │                                    │
│ [Slot 2]  │  + State Overlays:                │
│           │    - Idle: "Toca para comenzar"   │
│ [Slot 3]  │    - Countdown: "3-2-1"           │
│           │    - Capturing: Flash             │
│           │    - Pausing: "Siguiente en 2s"   │
│           │    - Processing: Spinner          │
│           │    - Success: Botones             │
└────────────────────────────────────────────────┘
```

### State Machine:

```
idle 
  ↓ (usuario toca / SPACE)
countdown (5-4-3-2-1)
  ↓
capturing (flash + backend capture)
  ↓
pausing (2 segundos)
  ↓
countdown (si < 3 fotos) o processing (si 3 fotos)
  ↓
processing (crear tira + diseño)
  ↓
success (mostrar botones)
  ↓ (30s auto-reset o botón "NUEVA")
idle
```

---

## Formato de Salida

### Tira Simple (600x1800px):
```
┌──────────┐
│ Foto 1   │ 600x400px
├──────────┤
│ Foto 2   │ 600x400px
├──────────┤
│ Foto 3   │ 600x400px
├──────────┤
│ Diseño   │ 600x450px (Canva)
└──────────┘
```

### Formato 2x para Imprimir (1200x1800px):
```
┌───────────┬───────────┐
│  Tira 1   │  Tira 2   │
│           │           │
│  (misma)  │  (misma)  │
│           │           │
│  ·····················│ Línea de corte
└───────────┴───────────┘

Cliente corta por la mitad = 2 photo strips
```

---

## Features Implementados

### ✅ Core Funcionalidad
- [x] Captura con OpenCV (backend)
- [x] Preview con react-webcam (frontend)
- [x] Countdown 5 segundos
- [x] 3 fotos automáticas
- [x] Pausa 2s entre fotos
- [x] Composición de tira vertical
- [x] Diseño de Canva en footer
- [x] Formato 2x (2 tiras en 1 hoja)
- [x] Impresión

### ✅ UX
- [x] Una pantalla unificada
- [x] Voces en español (TTS)
- [x] Efectos de sonido
- [x] Slots laterales con estados
- [x] Hotkeys (SPACE, ESC)
- [x] Auto-reset 30 segundos
- [x] Touch-friendly (botones 80px+)

### ✅ Backend API
- [x] POST `/api/camera/capture` - Capturar foto
- [x] POST `/api/image/compose-strip` - Crear tira
- [x] POST `/api/print/queue` - Imprimir
- [x] GET/POST `/api/designs/*` - Gestionar diseños
- [x] GET `/health` - Health check

---

## Target / Usuarios

### Operador (setup):
```
Antes del evento:
1. Subir diseño del cliente (logo/tema Canva)
2. Activar diseño
3. Conectar impresora
4. Conectar TV/monitor
5. Abrir app (queda en modo idle)
6. Dejar funcionando

Durante el evento:
- Monitorear impresiones
- Reponer papel si es necesario
- Reiniciar si hay algún problema (ESC)

Después del evento:
- Exportar galería digital
- Entregar fotos al cliente
```

### Usuario Final (invitados):
```
1. Se acerca a la estación
2. Ve la cámara en vivo (se acomoda)
3. Toca pantalla grande o presiona botón
4. Sonríe 3 veces (countdown automático)
5. Espera 10 segundos (procesando + imprimiendo)
6. Recoge sus 2 tiras de fotos
7. ¡Listo!
```

---

## Documentación Completa

### Documentos del Proyecto:

| Documento | Contenido |
|-----------|-----------|
| **`PROJECT_BRIEF.md`** | Este archivo - Overview del proyecto |
| **`DESIGN_SYSTEM.md`** | Colores, tipografía, componentes |
| **`QUE_ESTAMOS_CONSTRUYENDO.md`** | Resumen técnico completo |
| **`PLAN_AJUSTADO.md`** | Plan de desarrollo por fases |
| **`MEJORAS_UI_UX.md`** | Análisis de UI/UX |
| **`FASE_1_COMPLETADA.md`** | Sincronización backend-frontend |
| **`DEPLOYMENT.md`** | Empaquetado para producción |
| **`README.md`** | Documentación técnica completa |

---

## Comandos Rápidos

### Desarrollo:
```bash
# Backend (Terminal 1)
cd backend
uv sync
uv run python -m app.main

# Frontend (Terminal 2)
cd frontend-new
npm install
npm start
```

### Testing:
```bash
# Health check backend
curl http://127.0.0.1:8000/health

# Listar cámaras
curl http://127.0.0.1:8000/api/camera/list

# Ver diseño activo
curl http://127.0.0.1:8000/api/designs/active
```

---

## Próximos Pasos (FASE 2)

### Features Pendientes:
- [ ] Galería del evento (ver todas las sesiones)
- [ ] Exportar fotos digitales (ZIP)
- [ ] Settings screen (configurar countdown, cantidad fotos)
- [ ] Selector de diseños UI
- [ ] Re-imprimir sesiones anteriores
- [ ] QR code para descargar fotos

### Hotkeys Pendientes:
- [ ] F1 - Settings
- [ ] F2 - Galería
- [ ] F3 - Diseños

---

## Estado Actual

**✅ MVP Funcional**

- Una pantalla unificada funcionando
- Captura con backend OpenCV
- Voces y sonidos
- Diseño minimalista (negro + magenta)
- Listo para eventos

**📅 ETA Producción:** 2-3 días (con FASE 2 completa)

---

## Objetivo Final

**Crear un PhotoBooth profesional que:**

✅ Sea **fácil de usar** (cualquier persona puede operarlo)  
✅ Se vea **profesional y moderno**  
✅ Capture **fotos de calidad**  
✅ **Imprima rápido**  
✅ Guarde **galería digital** del evento  
✅ Permita **personalización** (diseños Canva)  
✅ Funcione **de forma autónoma** en eventos  

**Competencia:** Sparkbooth, Breeze, Simple Booth  
**Nuestro plus:** Open source, personalizable, diseños Canva integrados

---

🎉 **PhotoBooth - Captura momentos, crea recuerdos** ✨
