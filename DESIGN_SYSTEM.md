# Design System - PhotoBooth

**Filosofía:** Minimalista + Divertido (pero sutil)

---

## 🎨 Colors

### Palette: Magenta Night

```css
/* Main Colors */
--bg: #0a0a0a;           /* Negro profundo */
--primary: #ff0080;       /* Magenta vibrante */
--text: #ffffff;          /* Blanco puro */

/* Secondary Colors */
--bg-secondary: #1a1a1a;  /* Negro más claro para cards */
--slot-empty: #2a2a2a;    /* Gris oscuro para slots vacíos */
--text-secondary: #a0a0a0; /* Gris claro para textos secundarios */

/* State Colors */
--success: #10b981;       /* Verde para checkmarks */
--warning: #f59e0b;       /* Amarillo para warnings */
--error: #ef4444;         /* Rojo para errores */

/* Opacity Variants (para overlays) */
--overlay-light: rgba(0, 0, 0, 0.5);   /* 50% negro */
--overlay-medium: rgba(0, 0, 0, 0.7);  /* 70% negro */
--overlay-heavy: rgba(0, 0, 0, 0.8);   /* 80% negro */
```

### Usage:

```typescript
// Fondo principal
background: var(--bg)                // #0a0a0a

// Botón primario
background: var(--primary)           // #ff0080
color: var(--text)                   // #ffffff

// Slot vacío
border: 2px solid var(--slot-empty)  // #2a2a2a

// Slot activo (con animación)
border: 2px solid var(--primary)     // #ff0080
animation: pulse

// Overlay
background: var(--overlay-medium)    // rgba(0,0,0,0.7)
```

---

## 📏 Spacing

**Sistema de 8px base**

```css
--space-xs: 4px;     /* Padding interno pequeño */
--space-sm: 8px;     /* Padding interno normal */
--space-md: 16px;    /* Gap entre elementos */
--space-lg: 24px;    /* Padding de secciones */
--space-xl: 48px;    /* Padding de layouts */
--space-2xl: 96px;   /* Espaciado muy grande */
```

### Usage:

```typescript
// Padding de botón
padding: var(--space-lg) var(--space-xl)  // 24px 48px

// Gap entre slots
gap: var(--space-lg)  // 24px

// Padding del sidebar
padding: var(--space-lg)  // 24px
```

---

## 🔤 Typography

**Font Family:** System fonts (sin cargar fonts externas)

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 
             'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 
             sans-serif;
```

### Size Scale:

```css
--text-xs: 12px;         /* Keyboard hints */
--text-sm: 14px;         /* Secondary info */
--text-base: 16px;       /* Body text */
--text-lg: 20px;         /* Subtitles */
--text-xl: 24px;         /* Section titles */
--text-2xl: 32px;        /* Button text */
--text-3xl: 48px;        /* Overlay titles */
--text-4xl: 64px;        /* Success messages */
--text-countdown: 200px; /* Countdown numbers */
```

### Font Weights:

```css
--font-normal: 400;      /* Body text */
--font-medium: 500;      /* Emphasis */
--font-bold: 700;        /* Buttons, titles */
--font-black: 900;       /* Countdown, hero */
```

### Usage:

```typescript
// Botón principal
font-size: var(--text-2xl)   // 32px
font-weight: var(--font-bold) // 700

// Countdown overlay
font-size: var(--text-countdown)  // 200px
font-weight: var(--font-black)    // 900

// Texto secundario
font-size: var(--text-sm)     // 14px
color: var(--text-secondary)  // #a0a0a0
```

---

## 🧩 Components

### Button Primary

**Uso:** Acción principal (Comenzar, Imprimir)

```typescript
<button className="btn-primary">
  TOCA PARA COMENZAR
</button>
```

```css
.btn-primary {
  background: var(--primary);        /* #ff0080 */
  color: var(--text);                /* #ffffff */
  font-size: var(--text-2xl);        /* 32px */
  font-weight: var(--font-bold);     /* 700 */
  padding: var(--space-lg) var(--space-xl); /* 24px 48px */
  min-height: 80px;                  /* Touch-friendly */
  border-radius: 9999px;             /* Completamente redondeado */
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: color-mix(in srgb, var(--primary) 90%, white);
  transform: scale(1.05);
}

.btn-primary:active {
  transform: scale(0.98);
}
```

### Button Secondary

**Uso:** Acción secundaria (Nueva sesión, Cancelar)

```typescript
<button className="btn-secondary">
  NUEVA
</button>
```

```css
.btn-secondary {
  background: transparent;
  color: var(--text);                /* #ffffff */
  font-size: var(--text-xl);         /* 24px */
  font-weight: var(--font-bold);     /* 700 */
  padding: var(--space-md) var(--space-lg); /* 16px 24px */
  min-height: 60px;                  /* Ligeramente más pequeño */
  border-radius: 9999px;
  border: 2px solid var(--text);
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}
```

### Photo Slot

**Uso:** Slot para mostrar foto capturada

```typescript
<div className="photo-slot photo-slot--filled">
  <img src={photo} />
  <div className="photo-slot__check">✓</div>
</div>
```

```css
.photo-slot {
  width: 100%;
  aspect-ratio: 4/3;                 /* 200x150 si width es 200px */
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

/* Estado: Vacío */
.photo-slot {
  background: var(--bg-secondary);   /* #1a1a1a */
  border: 2px solid var(--slot-empty); /* #2a2a2a */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Estado: Activo (esperando captura) */
.photo-slot--active {
  border: 2px solid var(--primary);  /* #ff0080 */
  animation: pulse 2s ease-in-out infinite;
}

/* Estado: Lleno (foto capturada) */
.photo-slot--filled {
  border: 2px solid var(--primary);  /* #ff0080 */
  box-shadow: 0 0 20px rgba(255, 0, 128, 0.5);
}

.photo-slot__check {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-center;
  background: rgba(0, 0, 0, 0.3);
  font-size: 64px;
  color: white;
}
```

### Overlay

**Uso:** Overlays sobre la cámara (Idle, Countdown, etc.)

```typescript
<div className="overlay">
  <div className="overlay__content">
    <h2>¡Listo!</h2>
  </div>
</div>
```

```css
.overlay {
  position: absolute;
  inset: 0;
  background: var(--overlay-medium);  /* rgba(0,0,0,0.7) */
  display: flex;
  align-items: center;
  justify-center;
  backdrop-filter: blur(4px);         /* Sutil blur */
}

.overlay__content {
  text-align: center;
  padding: var(--space-xl);
}

/* Overlay Countdown (sin blur, más opaco) */
.overlay--countdown {
  background: var(--overlay-light);   /* rgba(0,0,0,0.5) */
  backdrop-filter: none;
}

/* Overlay Success (más opaco) */
.overlay--success {
  background: var(--overlay-heavy);   /* rgba(0,0,0,0.8) */
}
```

### Spinner (Loading)

**Uso:** Indicador de procesamiento

```typescript
<div className="spinner"></div>
```

```css
.spinner {
  width: 64px;
  height: 64px;
  border: 4px solid var(--primary);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### Keyboard Hint

**Uso:** Mostrar teclas disponibles

```typescript
<div className="kbd-hint">
  <kbd>SPACE</kbd> Comenzar
</div>
```

```css
.kbd-hint {
  font-size: var(--text-sm);         /* 14px */
  color: var(--text-secondary);      /* #a0a0a0 */
  background: rgba(0, 0, 0, 0.5);
  padding: var(--space-sm);
  border-radius: 4px;
}

kbd {
  display: inline-block;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-family: monospace;
  margin-right: 8px;
}
```

---

## 🎬 Animations

### Duration:

```css
--duration-fast: 150ms;    /* Hover effects */
--duration-normal: 300ms;  /* Transitions */
--duration-slow: 500ms;    /* Entrances */
```

### Easing:

```css
--ease-default: ease;
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Keyframes:

```css
/* Pulse (para slot activo) */
@keyframes pulse {
  0%, 100% { 
    opacity: 1; 
    border-color: var(--primary);
  }
  50% { 
    opacity: 0.5;
    border-color: color-mix(in srgb, var(--primary) 50%, transparent);
  }
}

/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Scale In */
@keyframes scaleIn {
  from { 
    opacity: 0; 
    transform: scale(0.8); 
  }
  to { 
    opacity: 1; 
    transform: scale(1); 
  }
}

/* Slide In (de abajo) */
@keyframes slideInUp {
  from { 
    opacity: 0; 
    transform: translateY(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}
```

### Usage:

```css
/* Slot activo pulsando */
.photo-slot--active {
  animation: pulse 2s var(--ease-default) infinite;
}

/* Overlay apareciendo */
.overlay {
  animation: fadeIn var(--duration-normal) var(--ease-default);
}

/* Botón entrando */
.btn-primary {
  animation: scaleIn var(--duration-slow) var(--ease-bounce);
}
```

---

## 📐 Layout

### Sidebar (Photo Slots):

```css
.sidebar {
  width: 15%;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);           /* 24px */
  padding: var(--space-lg);       /* 24px */
  border-right: 1px solid var(--slot-empty);
}
```

### Main Area (Camera):

```css
.main {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.webcam {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

### Container:

```css
.container {
  display: flex;
  height: 100vh;
  width: 100vw;
  background: var(--bg);
  overflow: hidden;
}
```

---

## ♿ Accessibility

### Focus Indicators:

```css
button:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 4px;
}

/* Custom focus ring para botones primarios */
.btn-primary:focus-visible {
  box-shadow: 0 0 0 4px rgba(255, 0, 128, 0.5);
}
```

### ARIA Labels:

```typescript
// Siempre incluir aria-label en botones
<button 
  className="btn-primary"
  aria-label="Comenzar sesión de fotos"
>
  TOCA PARA COMENZAR
</button>

// Estados dinámicos
<div 
  className="photo-slot"
  role="img"
  aria-label={filled ? 'Foto capturada' : 'Esperando foto'}
/>
```

### High Contrast:

El diseño ya cumple WCAG AA:
- Texto blanco (#ffffff) sobre negro (#0a0a0a) = 21:1 (AAA)
- Magenta (#ff0080) sobre negro (#0a0a0a) = 4.8:1 (AA)

---

## 🎯 Design Tokens (Tailwind)

Si usas Tailwind, configura estos tokens:

```javascript
// tailwind.config.js
export default {
  theme: {
    colors: {
      bg: '#0a0a0a',
      'bg-secondary': '#1a1a1a',
      primary: '#ff0080',
      text: '#ffffff',
      'text-secondary': '#a0a0a0',
      'slot-empty': '#2a2a2a',
    },
    spacing: {
      'xs': '4px',
      'sm': '8px',
      'md': '16px',
      'lg': '24px',
      'xl': '48px',
      '2xl': '96px',
    },
    fontSize: {
      'xs': '12px',
      'sm': '14px',
      'base': '16px',
      'lg': '20px',
      'xl': '24px',
      '2xl': '32px',
      '3xl': '48px',
      '4xl': '64px',
      'countdown': '200px',
    },
  }
}
```

---

## 📋 Component Checklist

Al crear un nuevo componente, asegúrate de:

- [ ] Usar colores del design system
- [ ] Aplicar espaciado consistente (sistema 8px)
- [ ] Tipografía del scale establecido
- [ ] Botones touch-friendly (mín 44px, ideal 80px)
- [ ] Animaciones con durations establecidas
- [ ] ARIA labels cuando sea necesario
- [ ] Focus indicators visibles
- [ ] Responsive (aunque app es fullscreen)
- [ ] Dark mode compatible (ya es dark por default)

---

## 🎨 Examples

### Ejemplo completo: Botón Comenzar

```tsx
<button
  onClick={handleStart}
  className="
    px-20 py-8 
    bg-[#ff0080] 
    rounded-full 
    text-white text-4xl font-bold 
    hover:bg-[#ff0080]/90 
    transition-all duration-300 
    hover:scale-105
    focus:outline-none 
    focus:ring-4 
    focus:ring-[#ff0080]/50
  "
  style={{ minHeight: '80px' }}
  aria-label="Comenzar sesión de fotos"
>
  TOCA PARA COMENZAR
</button>
```

### Ejemplo: Photo Slot con estados

```tsx
<div
  className={`
    w-full aspect-[4/3] rounded-lg overflow-hidden 
    transition-all duration-300
    ${filled 
      ? 'border-2 border-[#ff0080] shadow-lg shadow-[#ff0080]/50' 
      : active 
        ? 'border-2 border-[#ff0080] animate-pulse' 
        : 'border-2 border-[#2a2a2a]'
    }
  `}
  role="img"
  aria-label={filled ? 'Foto capturada' : active ? 'Capturando foto' : 'Esperando foto'}
>
  {/* Contenido del slot */}
</div>
```

---

**Design System v1.0 - PhotoBooth** 🎨✨
