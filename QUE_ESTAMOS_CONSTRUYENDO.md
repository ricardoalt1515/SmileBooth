# 🎯 ¿QUÉ ESTAMOS CONSTRUYENDO?

**PhotoBooth Profesional para Eventos**  
Una aplicación de escritorio (Electron) tipo Sparkbooth/Breeze para eventos sociales.

---

## 🎬 CONCEPTO

Sistema completo de PhotoBooth que:
1. **Captura** 3 fotos automáticas con cámara
2. **Compone** una tira vertical con diseño personalizado (Canva)
3. **Imprime** formato 2x (2 tiras en 1 hoja 4x6")
4. **Guarda** galería digital del evento

---

## 💼 CASO DE USO REAL

### Hardware Setup:
```
Laptop → Software PhotoBooth
  ├─> TV/Monitor (HDMI) - Muestra lo que pasa
  ├─> Cámara USB/Webcam - Captura fotos
  └─> Impresora - Imprime tiras
```

### Flujo del Evento:
```
1. Usuario se acerca
2. Ve la cámara en vivo (se acomoda)
3. Presiona botón grande o SPACE
4. Countdown: 3-2-1
5. Captura 3 fotos (con countdown entre cada una)
6. Backend crea tira con diseño de Canva
7. Imprime 1 hoja = 2 tiras idénticas
8. Cliente corta por la mitad = 2 strips
9. Usuario se lleva sus fotos
10. Operador entrega fotos digitales después
```

---

## 🎨 UI/UX - FILOSOFÍA

### ✅ Minimalista + Divertida
- Sin pantallas innecesarias
- Directo a cámara al abrir
- Gradientes coloridos
- Animaciones sutiles
- Iconos y emojis

### ✅ Layout Principal
```
┌─────────────────────────────────────────────┐
│ SIDEBAR    │      CÁMARA PRINCIPAL          │
│ (280px)    │        (resto)                 │
│            │                                 │
│ [Foto 1✓]  │   📹 Preview en vivo          │
│            │                                 │
│ [Foto 2 ]  │   Usuario se ve grande         │
│            │                                 │
│ [Foto 3 ]  │                                 │
│            │   Countdown: 3... 2... 1...    │
│            │                                 │
│            │   [Botón: ¡CLICK!]             │
└─────────────────────────────────────────────┘
```

**Key Points:**
- Previews a la IZQUIERDA (no arriba)
- Cámara GRANDE y centrada
- Botón OBVIO flotante
- TODO en una pantalla

---

## 🏗️ ARQUITECTURA

### Stack Completo:

```
FRONTEND (Electron + React)
  ├─ Electron 39 - App de escritorio
  ├─ React 19 - UI components
  ├─ TypeScript - Type safety
  ├─ Vite 5 - Build tool
  ├─ Tailwind CSS v4 - Styling
  ├─ Zustand - State management
  └─ react-webcam - Preview (solo visual)

BACKEND (Python)
  ├─ FastAPI - REST API
  ├─ OpenCV - Captura real de cámara
  ├─ Pillow - Composición de imágenes
  ├─ uvicorn - Server
  └─ pycups - Impresión (macOS)

AUDIO (Nativo Browser)
  ├─ Web Speech API - Voces en español
  └─ Web Audio API - Efectos de sonido
```

### Comunicación:
```
Frontend (localhost:5173) 
    ↕ HTTP
Backend (localhost:8000)
```

---

## 📁 ESTRUCTURA DEL PROYECTO

```
photobooth/
├── backend/                     ← Python API
│   ├── app/
│   │   ├── api/                 ← Endpoints
│   │   │   ├── camera.py        ← Captura
│   │   │   ├── image.py         ← Composición
│   │   │   ├── print.py         ← Impresión
│   │   │   └── designs.py       ← Diseños Canva
│   │   ├── services/            ← Lógica
│   │   └── main.py              ← App principal
│   └── data/                    ← Fotos guardadas
│       ├── photos/              ← Fotos capturadas
│       ├── strips/              ← Tiras creadas
│       └── designs/             ← Diseños Canva
│
└── frontend-new/                ← Electron + React
    ├── src/
    │   ├── screens/             ← Pantallas UI
    │   │   ├── CaptureScreenFinal.tsx  ← PRINCIPAL ⭐
    │   │   ├── ProcessingScreen.tsx
    │   │   └── SuccessScreen.tsx
    │   ├── store/               ← State (Zustand)
    │   ├── services/            ← API client
    │   ├── hooks/               ← Audio, hotkeys
    │   └── main.ts              ← Electron main
    └── package.json
```

---

## 🎯 FEATURES PRINCIPALES

### ✅ IMPLEMENTADO (MVP Funcional)

**Core:**
- [x] Captura con OpenCV (backend)
- [x] Preview con Webcam (frontend visual)
- [x] Countdown animado
- [x] 3 fotos automáticas
- [x] Composición de tira vertical
- [x] Diseño de Canva en footer
- [x] Formato 2x (2 tiras en 1 hoja)
- [x] Impresión

**UX:**
- [x] Voces en español (TTS)
- [x] Efectos de sonido
- [x] UI minimalista + divertida
- [x] Previews lado izquierdo
- [x] Hotkey SPACE para iniciar
- [x] Auto-reset después de imprimir

**Backend:**
- [x] API REST completa
- [x] Upload de diseños Canva
- [x] Gestión de sesiones
- [x] Guardado de fotos

### 🔄 PRÓXIMO (FASE 2)

**Funcionalidades:**
- [ ] Galería del evento (ver todas las sesiones)
- [ ] Exportar fotos digitales (ZIP)
- [ ] Settings (configurar countdown, cantidad fotos)
- [ ] Selector de diseños (activar/desactivar)
- [ ] Re-imprimir sesiones anteriores

**Hotkeys:**
- [ ] F1 - Settings
- [ ] F2 - Galería
- [ ] F3 - Diseños
- [x] ESC - Volver a inicio (ya funciona)

---

## 📸 FLUJO TÉCNICO DETALLADO

### 1. Inicio de Sesión
```
Usuario ve: Cámara en vivo + Botón "¡CLICK!"
Presiona: SPACE o click en botón
Frontend: speak("¡Perfecto! Sonríe en 3 segundos")
         setTimeout(countdown, 800ms)
```

### 2. Primera Foto
```
Countdown: 3... 2... 1...
  └─ speak("3"), speak("2"), speak("1")
  └─ playBeep() en cada número

Captura:
  └─ POST /api/camera/capture { camera_id: 0 }
  └─ Backend OpenCV captura foto
  └─ Devuelve: { file_path: "/data/photos/session123/photo_1.jpg" }
  └─ Frontend guarda ruta en photoPaths[]
  └─ Muestra thumbnail en sidebar
  └─ playShutter()
  └─ speak("¡Genial! Foto 2 de 3")
```

### 3. Fotos 2 y 3
```
Repite proceso anterior
Pausa 1.5s entre cada foto
```

### 4. Procesamiento
```
Frontend: navigate('processing')
Backend:
  1. GET /api/designs/active
     └─ Obtiene diseño de Canva activo
  
  2. POST /api/image/compose-strip
     └─ photo_paths: [foto1, foto2, foto3]
     └─ design_path: ruta_diseño_canva
     └─ Crea:
         • strip_path: 600x1800 (tira simple)
         • full_page_path: 1200x1800 (2 tiras lado a lado)
  
  3. Devuelve rutas al frontend
```

### 5. Éxito + Impresión
```
Frontend: navigate('success')
Usuario ve: Fotos + Botones

Click IMPRIMIR:
  └─ POST /api/print/queue
      └─ file_path: full_page_path (formato 2x)
      └─ copies: 1
  └─ Impresora imprime 1 hoja con 2 tiras
  └─ Cliente corta por la mitad
  └─ Resultado: 2 photo strips
```

---

## 🎨 DISEÑO CANVA

### Especificaciones:
- **Tamaño recomendado:** 600x450px
- **Formato:** PNG (transparente) o JPG
- **Posición:** Footer de la tira (debajo de las 3 fotos)
- **Uso:** Logo del evento, marca, decoración

### Workflow:
```
1. Cliente diseña en Canva (600x450px)
2. Exporta PNG/JPG
3. Operador sube diseño al sistema
4. Activa diseño para el evento
5. Todas las tiras llevarán ese diseño
```

### API:
```typescript
POST /api/designs/upload          // Subir nuevo diseño
PUT  /api/designs/set-active/{id}  // Activar diseño
GET  /api/designs/active           // Ver diseño activo
```

---

## 📊 FORMATO DE IMPRESIÓN

### Tira Simple (600x1800px):
```
┌──────────┐
│  Foto 1  │  ← 600x400px
├──────────┤
│  Foto 2  │  ← 600x400px
├──────────┤
│  Foto 3  │  ← 600x400px
├──────────┤
│  Diseño  │  ← 600x450px (Canva)
└──────────┘
Total: 600x1800px
```

### Formato 2x - Para Imprimir (1200x1800px):
```
┌──────────┬──────────┐
│  Tira 1  │  Tira 2  │  ← Idénticas
│          │          │
│  Foto 1  │  Foto 1  │
│  Foto 2  │  Foto 2  │
│  Foto 3  │  Foto 3  │
│  Diseño  │  Diseño  │
│          │          │
│          │  ·····   │  ← Línea de corte
└──────────┴──────────┘
Total: 1200x1800px (4x6")
Cliente corta → 2 strips
```

---

## 🚀 COMANDOS RÁPIDOS

### Desarrollo:
```bash
# Backend
cd backend
uv sync                    # Instalar deps
uv run python -m app.main  # Levantar servidor

# Frontend
cd frontend-new
npm install                # Instalar deps
npm start                  # Levantar Electron app
```

### Testing:
```bash
# Verificar backend
curl http://127.0.0.1:8000/health

# Ver cámaras disponibles
curl http://127.0.0.1:8000/api/camera/list

# Ver diseño activo
curl http://127.0.0.1:8000/api/designs/active
```

---

## 📚 DOCUMENTACIÓN COMPLETA

Para más detalles ver:

| Documento | Contenido |
|-----------|-----------|
| **`PLAN_AJUSTADO.md`** | Plan completo de desarrollo por fases |
| **`FASE_1_COMPLETADA.md`** | Sincronización backend-frontend |
| **`MEJORAS_UI_UX.md`** | Análisis detallado de UI/UX |
| **`UI_NUEVA_RESUMEN.md`** | Guía visual de la UI |
| **`DEPLOYMENT.md`** | Cómo empaquetar para distribución |
| **`README.md`** | Documentación técnica completa |

---

## 🎯 OBJETIVO FINAL

**Crear un PhotoBooth profesional listo para eventos que:**

✅ Sea fácil de usar (cualquier persona puede operarlo)  
✅ Se vea profesional y divertido  
✅ Capture fotos de calidad  
✅ Imprima rápido  
✅ Guarde galería digital  
✅ Permita personalización (diseños Canva)  
✅ Funcione de forma autónoma en eventos  

**Competencia:** Sparkbooth, Breeze, Simple Booth  
**Nuestro plus:** Open source, personalizable, diseños Canva fáciles

---

## 💡 TIPS DE USO

### Para Operador:
1. Subir diseño del evento (logo/tema)
2. Activar diseño
3. Abrir app (va directo a cámara)
4. Conectar impresora
5. Dejar funcionando
6. Al final: exportar galería digital

### Para Usuario Final:
1. Acercarse
2. Ver cámara (acomodarse)
3. Presionar botón grande
4. Sonreír 3 veces
5. Esperar impresión
6. ¡Listo! Tomar fotos

---

**Estado actual:** ✅ MVP Funcional  
**Próximo paso:** Galería + Settings  
**ETA producción:** 2-3 días

🎉 **¡Sistema PhotoBooth profesional en desarrollo!**
