# Plan de Producto - Photo Booth (Clone de SparkBooth 7 Mejorado)
**Fecha**: Octubre 2025  
**Filosofía**: Feature-Complete + Modern UI + Better UX

---

## 🎯 Visión del Producto

**Recrear SparkBooth 7 con tecnología moderna, mejor UX y gratis.**

Todas las features profesionales de SparkBooth pero con:
- UI más moderna y bonita
- Mejor rendimiento (64-bit nativo)
- Sin costo de licencia
- Código abierto y customizable

### Objetivos
1. **Paridad con SparkBooth 7**: Todas las features principales
2. **Mejor UX**: Interface más intuitiva y moderna
3. **Gratis**: Sin licencias ni suscripciones
4. **Extensible**: Fácil agregar features custom

---

## 👥 Usuarios

### Primario: Invitados del Evento
- **Edad**: 5-80 años
- **Tech-savvy**: Bajo a ninguno
- **Expectativa**: Diversión instantánea
- **Tiempo de atención**: 30 segundos

### Secundario: Organizador del Evento
- **Edad**: 20-50 años
- **Tech-savvy**: Medio
- **Necesidad**: Setup rápido, sin problemas
- **Tiempo disponible**: 10 minutos para configurar

---

## 🎨 Principios de Diseño

### 1. **Un Botón Gigante**
La pantalla principal tiene UN solo botón grande que dice "TOMAR FOTO"

### 2. **Feedback Visual Obvio**
- Countdown grande y colorido
- Animaciones suaves
- Sonidos opcionales
- Sin textos complejos

### 3. **Cero Decisiones Innecesarias**
- No preguntar layout (se configura antes)
- No preguntar cantidad de fotos
- No preguntar si quiere imprimir
- Todo automático

### 4. **Diseño Emocional**
- Colores vibrantes y alegres
- Animaciones divertidas
- Celebración visual al terminar
- Experiencia memorable

---

## 🔄 Flujo Principal de Usuario (Invitado)

```
┌─────────────────────────────────────────┐
│                                         │
│     [PANTALLA DE INICIO]                │
│                                         │
│     "¡Toma tu Foto!"                    │
│                                         │
│     ┌─────────────────────────┐         │
│     │                         │         │
│     │   [TOMAR FOTO]  ⭐      │         │
│     │                         │         │
│     └─────────────────────────┘         │
│                                         │
│     Vista previa de la cámara           │
│                                         │
└─────────────────────────────────────────┘
               ↓ (Click)
┌─────────────────────────────────────────┐
│                                         │
│     [COUNTDOWN]                         │
│                                         │
│           ⏰ 3                          │
│                                         │
│     Vista previa de la cámara           │
│     (centrado, grande)                  │
│                                         │
└─────────────────────────────────────────┘
               ↓ (Auto)
┌─────────────────────────────────────────┐
│                                         │
│           ⏰ 2                          │
│                                         │
└─────────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│                                         │
│           ⏰ 1                          │
│                                         │
└─────────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│                                         │
│           ✨ ¡SONRÍE! ✨               │
│                                         │
│     [FLASH BLANCO]                      │
│                                         │
└─────────────────────────────────────────┘
               ↓ (Auto)
┌─────────────────────────────────────────┐
│                                         │
│     [PREVIEW FOTO]                      │
│                                         │
│     ┌───────────────────┐               │
│     │                   │               │
│     │   Tu foto con     │               │
│     │   layout aplicado │               │
│     │                   │               │
│     └───────────────────┘               │
│                                         │
│     🖨️ Imprimiendo...                  │
│     [Barra de progreso]                 │
│                                         │
└─────────────────────────────────────────┘
               ↓ (5 segundos)
┌─────────────────────────────────────────┐
│                                         │
│     [PANTALLA FINAL]                    │
│                                         │
│     ✅ ¡Listo!                          │
│                                         │
│     Recoge tu foto en la impresora      │
│                                         │
│     [QR Code para descargar]            │
│                                         │
└─────────────────────────────────────────┘
               ↓ (3 segundos)
          VUELVE AL INICIO
```

**Tiempo total**: ~15 segundos  
**Clicks requeridos**: 1  
**Decisiones del usuario**: 0

---

## ✨ Features Completas (Paridad SparkBooth 7)

### Fase 1: Core Booth (2-3 semanas)

#### 1. **Modos de Operación**
- ✅ Photo Booth (1-4 fotos)
- ✅ GIF Booth (animaciones, boomerang, rewind)
- ✅ Selección de modo en pantalla inicio

#### 2. **Captura Profesional**
- ✅ Webcam support
- ✅ Countdown visual (3-2-1)
- ✅ Voice prompts (audio personalizable)
- ✅ Live preview grande
- ✅ Flash simulado

#### 3. **Layouts**
- ✅ Múltiples templates (5-10 incluidos)
- ✅ Editor drag-and-drop visual
- ✅ Custom text overlay
- ✅ Logo/imagen overlay
- ✅ Portrait, landscape, square, strips
- ✅ Multi-foto layouts (1, 2, 3, 4 fotos)

#### 4. **Impresión**
- ✅ Auto-print o manual
- ✅ Seleccionar cantidad de copias
- ✅ Configurar impresora
- ✅ Preview antes de imprimir

#### 5. **Compartir**
- ✅ QR code para download
- ✅ Email fotos
- ✅ SMS/MMS (Twilio)
- ✅ Guardar local
- ✅ Upload a cloud (Dropbox, Google Drive)

### Fase 2: Features Avanzadas (2-3 semanas)

#### 6. **Background Removal**
- ✅ Green screen tradicional
- ✅ AI background removal (rembg offline)
- ✅ Custom backgrounds
- ✅ Biblioteca de fondos

#### 7. **Props y Stickers**
- ✅ Props virtuales drag-drop
- ✅ Stickers predefinidos
- ✅ Upload props custom
- ✅ Resize, rotate interactivo

#### 8. **Photo Kiosk** (Estación Separada)
- ✅ Browse fotos del evento
- ✅ Compartir desde kiosk
- ✅ Imprimir copias extra
- ✅ Segunda computadora sincronizada

#### 9. **Settings Completos**
- ✅ Configuración de cámara
- ✅ Gestión de layouts
- ✅ Configuración de impresora
- ✅ Opciones de compartir
- ✅ Branding (logo, colores)
- ✅ Voice prompts custom

### Fase 3: Pro Features (Opcional)

#### 10. **DSLR Support**
- ⏭️ Canon DSLR (gPhoto2)
- ⏭️ Nikon DSLR
- ⏭️ Live view mejorado

#### 11. **Mirror Booth Mode**
- ⏭️ Videos en lugar de live view
- ⏭️ Animaciones custom

#### 12. **Analytics**
- ⏭️ Contador de sesiones
- ⏭️ Estadísticas de uso
- ⏭️ Export de datos  

---

## 🎛️ Panel de Administrador

**Acceso**: Tecla F1 o botón Settings (esquina superior derecha)

### Settings Completos (Estilo SparkBooth)

```
┌─────────────────────────────────────────────────┐
│  ⚙️ CONFIGURACIÓN                               │
├─────────────────────────────────────────────────┤
│                                                 │
│  [General] [Cámara] [Layouts] [Impresión]     │
│  [Compartir] [Branding] [Avanzado]             │
│                                                 │
├─────────────────────────────────────────────────┤
│  📸 CÁMARA                                      │
│  ├─ Dispositivo: [Dropdown]                    │
│  ├─ Resolución: [1920x1080 ▼]                  │
│  ├─ Flash: [✓] Activado                        │
│  └─ Countdown: [3] segundos                    │
│                                                 │
│  🖼️ LAYOUTS                                     │
│  ├─ Modo: ◉ Photo  ○ GIF  ○ Ambos             │
│  ├─ Layout activo: [Gallery visual]            │
│  ├─ Fotos por sesión: [4 ▼]                    │
│  ├─ Editor de layout: [Abrir Editor →]         │
│  └─ Texto personalizado: [___________]         │
│                                                 │
│  🖨️ IMPRESIÓN                                   │
│  ├─ Impresora: [Dropdown]                      │
│  ├─ Auto-imprimir: [✓] Sí                      │
│  ├─ Copias: [2 ▼]                              │
│  └─ Tamaño papel: [4x6" ▼]                     │
│                                                 │
│  📤 COMPARTIR                                    │
│  ├─ QR Code: [✓] Activado                      │
│  ├─ Email: [✓] Activado                        │
│  │  └─ Servicio: [Gmail ▼] [Configurar]       │
│  ├─ SMS: [ ] Activado                          │
│  │  └─ Provider: [Twilio ▼] [Configurar]      │
│  └─ Cloud: [✓] Dropbox [Conectar]              │
│                                                 │
│  🎨 BRANDING                                     │
│  ├─ Logo: [Upload] [Preview]                   │
│  ├─ Color tema: [🎨 #FF6B9D]                   │
│  ├─ Nombre evento: [___________]               │
│  └─ Marca de agua: [ ] Activar                 │
│                                                 │
│  🎵 AUDIO                                        │
│  ├─ Voice prompts: [✓] Activado                │
│  ├─ Voz: [Default ▼]                           │
│  ├─ Upload custom: [.mp3]                      │
│  └─ Volumen: [████████░░] 80%                  │
│                                                 │
│  🌟 GREEN SCREEN / BACKGROUND                    │
│  ├─ Modo: ○ Green Screen  ◉ AI Removal         │
│  ├─ Backgrounds: [Gallery]                     │
│  └─ Upload custom: [Seleccionar]               │
│                                                 │
│  [GUARDAR]  [CANCELAR]  [RESTAURAR DEFAULTS]   │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🎨 Diseño Visual

### Paleta de Colores (Alegre y Moderna)

```css
--primary: #FF6B9D      /* Rosa vibrante */
--secondary: #C06C84    /* Rosa oscuro */
--accent: #F67280       /* Coral */
--background: #F8F9FA   /* Gris muy claro */
--text: #2C3E50         /* Azul oscuro */
--success: #4ECDC4      /* Turquesa */
```

### Tipografía

```css
--font-display: 'Poppins', sans-serif  /* Bold, para títulos */
--font-body: 'Inter', sans-serif       /* Regular, para texto */
```

### Botón Principal

```
┌────────────────────────────────────┐
│                                    │
│         📸 TOMAR FOTO              │
│                                    │
└────────────────────────────────────┘

- Tamaño: 400px x 120px
- Border radius: 60px (muy redondeado)
- Sombra: grande y suave
- Hover: Crece ligeramente
- Click: Animación de "press"
```

### Countdown

```
      ⏰
       3
       
- Número: 200px de alto
- Font weight: 900 (ultra bold)
- Animación: Scale in/out
- Color: Gradiente animado
```

---

## 📱 Pantallas Completas

### 1. Pantalla de Inicio

```
╔═══════════════════════════════════════════╗
║                                           ║
║                                           ║
║     ┌─────────────────────────────┐       ║
║     │                             │       ║
║     │   VISTA PREVIA CÁMARA       │       ║
║     │   (1280x720 centered)       │       ║
║     │                             │       ║
║     └─────────────────────────────┘       ║
║                                           ║
║            ¡Toma tu Foto!                 ║
║                                           ║
║      ┌─────────────────────────┐          ║
║      │                         │          ║
║      │   📸 TOMAR FOTO        │          ║
║      │                         │          ║
║      └─────────────────────────┘          ║
║                                           ║
║                                           ║
╚═══════════════════════════════════════════╝
```

### 2. Pantalla Countdown

```
╔═══════════════════════════════════════════╗
║                                           ║
║              [Live Preview]               ║
║                                           ║
║                                           ║
║                   ⏰                       ║
║                   3                       ║
║                                           ║
║                                           ║
║              Prepárate...                 ║
║                                           ║
╚═══════════════════════════════════════════╝
```

### 3. Pantalla Review + Imprimiendo

```
╔═══════════════════════════════════════════╗
║                                           ║
║        ┌─────────────────────┐            ║
║        │                     │            ║
║        │   TU FOTO           │            ║
║        │   (Con layout)      │            ║
║        │                     │            ║
║        └─────────────────────┘            ║
║                                           ║
║         🖨️ Imprimiendo...                ║
║         [████████░░] 80%                  ║
║                                           ║
╚═══════════════════════════════════════════╝
```

### 4. Pantalla Final

```
╔═══════════════════════════════════════════╗
║                                           ║
║                  ✅                       ║
║              ¡Listo!                      ║
║                                           ║
║      Recoge tu foto en la impresora       ║
║                                           ║
║         ┌─────────────────┐               ║
║         │                 │               ║
║         │   [QR CODE]     │               ║
║         │                 │               ║
║         └─────────────────┘               ║
║                                           ║
║      Escanea para descargar               ║
║                                           ║
╚═══════════════════════════════════════════╝
```

---

## 🚀 Roadmap de Desarrollo

### Sprint 1 (1 semana): Setup + MVP
- [ ] Estructura del proyecto (Electron + React + Python)
- [ ] Setup de desarrollo
- [ ] Captura con webcam
- [ ] Countdown visual + voice prompts
- [ ] 1 layout básico funcionando
- [ ] Preview de foto
- [ ] Impresión básica

### Sprint 2 (1 semana): Layouts + Multi-foto
- [ ] Sistema de múltiples layouts
- [ ] Gallery de templates (5-10)
- [ ] Multi-foto (1, 2, 3, 4 fotos por layout)
- [ ] Text overlay en layouts
- [ ] Logo overlay
- [ ] Settings panel básico

### Sprint 3 (1 semana): Compartir + QR
- [ ] QR code generation
- [ ] Email integration (Gmail/SMTP)
- [ ] Upload a Dropbox/Google Drive
- [ ] Local storage management
- [ ] Session history/database

### Sprint 4 (1 semana): GIF Booth + Effects
- [ ] GIF Booth mode
- [ ] Boomerang/rewind GIFs
- [ ] Props y stickers básicos
- [ ] Drag-drop interactivo
- [ ] Animaciones suaves

### Sprint 5 (1 semana): Background Removal
- [ ] Green screen tradicional
- [ ] AI background removal (rembg)
- [ ] Biblioteca de backgrounds
- [ ] Upload backgrounds custom
- [ ] Preview en tiempo real

### Sprint 6 (1 semana): Editor de Layouts
- [ ] Drag-and-drop layout editor
- [ ] Add/remove photo zones
- [ ] Text tool
- [ ] Image tool
- [ ] Save/load custom layouts

### Sprint 7 (3-5 días): Photo Kiosk
- [ ] App separada para kiosk
- [ ] Browse fotos
- [ ] Compartir desde kiosk
- [ ] Reprint functionality
- [ ] Sync con booth principal

### Sprint 8 (3-5 días): Polish + Testing
- [ ] UI polish completo
- [ ] Animaciones finales
- [ ] Testing Windows
- [ ] Testing macOS
- [ ] Bug fixes
- [ ] Performance optimization

### Sprint 9 (2-3 días): Build + Deploy
- [ ] PyInstaller para backend
- [ ] electron-builder para frontend
- [ ] Instalador Windows (.exe)
- [ ] Instalador macOS (.dmg)
- [ ] Documentación de usuario
- [ ] README completo

**Tiempo total MVP completo**: 8-10 semanas  
**Tiempo MVP básico (Sprints 1-3)**: 3 semanas

---

## 🎯 Métricas de Éxito

### Experiencia de Usuario
- ✅ Tiempo por foto: <15 segundos
- ✅ Clicks necesarios: 1
- ✅ Tasa de error: <1%
- ✅ Usuarios que completan sin ayuda: >95%

### Técnico
- ✅ Tiempo de startup: <10 segundos
- ✅ Uptime durante evento: >99%
- ✅ Calidad de impresión: Alta
- ✅ Funciona sin internet: 100%

---

## 💡 Comparación Detallada vs SparkBooth 7

| Feature | SparkBooth 7 | Nuestra App | Ventaja |
|---------|--------------|-------------|---------|
| **Precio** | $189 (DSLR) | Gratis | 💰 Nuestra |
| **Licencia** | 3 activaciones | Ilimitado | ✅ Nuestra |
| **Photo Booth** | ✅ | ✅ | = |
| **GIF Booth** | ✅ | ✅ | = |
| **Mirror Booth** | ✅ | ⏭️ Fase 3 | SparkBooth |
| **Multi-foto layouts** | ✅ 1-4 | ✅ 1-4 | = |
| **Editor layouts** | ✅ Drag-drop | ✅ Drag-drop | = |
| **Green screen** | ✅ | ✅ | = |
| **AI BG Removal** | APIs de pago | ✅ Offline gratis | 🎯 Nuestra |
| **Props/Stickers** | ✅ | ✅ | = |
| **QR Codes** | ✅ | ✅ | = |
| **Email** | ✅ | ✅ | = |
| **SMS** | ✅ (Twilio) | ✅ (Twilio) | = |
| **Social Media** | ✅ | ✅ | = |
| **Photo Kiosk** | ✅ | ✅ | = |
| **DSLR Support** | ✅ Canon/Nikon | ⏭️ Fase 3 | SparkBooth |
| **Voice Prompts** | ✅ | ✅ | = |
| **Impresión** | ✅ | ✅ | = |
| **Offline** | ✅ | ✅ | = |
| **Multi-idioma** | ✅ 11 idiomas | 🔄 Español/Inglés | SparkBooth |
| **UI Moderna** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 🎨 Nuestra |
| **Performance** | 32-bit (old) | 64-bit nativo | 🚀 Nuestra |
| **Código abierto** | ❌ | ✅ | ✅ Nuestra |
| **Customizable** | Limitado | Total | 🛠️ Nuestra |
| **Updates** | Vendor | Control total | ✅ Nuestra |

### Resumen

**Paridad**: ~90% de features principales  
**Ventajas únicas nuestras**: 
- ✅ Gratis y open source
- ✅ AI background removal offline
- ✅ UI más moderna
- ✅ Mejor performance (64-bit)
- ✅ Customización total

**Ventajas de SparkBooth**:
- ✅ DSLR support inmediato (nosotros Fase 3)
- ✅ Mirror booth (nosotros Fase 3)
- ✅ Multi-idioma completo
- ✅ 15 años de madurez

---

## 🎨 Inspiración de Diseño

**Referencias**:
- Apple FaceTime (simplicidad)
- Instagram Stories (UX fluida)
- Snapchat (diversión instantánea)
- Photo booths físicos clásicos (simplicidad)

**Sentimiento**:
- Alegre y festivo
- Moderno pero accesible
- Profesional pero divertido
- Rápido pero cuidado

---

## 📝 Próximos Pasos

1. ✅ Stack técnico definido
2. ✅ Plan de producto definido
3. 🔄 **Siguiente**: Crear wireframes interactivos (Figma)
4. ⏭️ Setup estructura de proyecto
5. ⏭️ Implementar Sprint 1

---

**Lema del Producto**:
> "SparkBooth 7 reimaginado: Gratis, moderno y tuyo."

---

## 📝 Resumen Final

Este producto es un **clon completo de SparkBooth 7** con:
- ✅ 90% paridad de features
- ✅ UI/UX modernizada
- ✅ Tecnología 2025 (Electron + React + Python)
- ✅ Sin costo de licencia
- ✅ Código abierto
- ✅ Mejor performance

**Enfoque de desarrollo**:
1. **Sprints 1-3** (3 semanas): MVP funcional básico
2. **Sprints 4-6** (3 semanas): Features avanzadas (GIF, BG removal, Editor)
3. **Sprints 7-9** (2 semanas): Kiosk, polish, deploy

**Total**: 8-10 semanas para producto completo

**Actualizado**: Octubre 2025  
**Version**: 2.0 (Clone SparkBooth)
