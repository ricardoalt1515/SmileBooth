# Diseño UI/UX - PhotoBooth App
**Sistema de Diseño Completo** | Noviembre 2025

---

## 🎨 Filosofía de Diseño

### Principio #1: "Mi abuela puede usarlo"
- Si necesita instrucciones, fallamos
- Un botón gigante, nada más
- Feedback visual obvio
- Cero fricción

### Principio #2: "Emoción primero"
- Colores alegres y vibrantes
- Animaciones divertidas pero no distractoras
- Celebración al completar
- Experiencia memorable

### Principio #3: "Confiabilidad absoluta"
- Nunca crashear en evento
- Siempre guardar las fotos
- Degradación elegante ante errores
- Estado claro en todo momento

---

## 🎨 Sistema de Colores

### Paleta Principal: "Fiesta Elegante"

```css
/* COLORES PRIMARIOS */
--primary-50: #FFF1F6;        /* Tint más claro */
--primary-100: #FFE4ED;       /* Backgrounds hover */
--primary-200: #FFD0E0;       /* Backgrounds */
--primary-300: #FFB3CB;       /* Borders */
--primary-400: #FF8CAD;       /* Secondary buttons */
--primary-500: #FF6B9D;       /* MAIN - Botón principal */
--primary-600: #FF4777;       /* Hover state */
--primary-700: #E6245B;       /* Active state */
--primary-800: #B31945;       /* Dark accents */
--primary-900: #800F2F;       /* Text on light bg */

/* COLORES SECUNDARIOS */
--accent-countdown: #60A5FA;   /* Azul - Números countdown */
--accent-success: #34D399;     /* Verde - Éxito */
--accent-warning: #FBBF24;     /* Amarillo - Advertencia */
--accent-error: #EF4444;       /* Rojo - Error */

/* NEUTRALES */
--gray-50: #FAFAFA;           /* Background principal */
--gray-100: #F5F5F5;          /* Background secundario */
--gray-200: #E5E5E5;          /* Borders sutiles */
--gray-300: #D4D4D4;          /* Borders */
--gray-400: #A3A3A3;          /* Disabled text */
--gray-500: #737373;          /* Secondary text */
--gray-600: #525252;          /* Body text */
--gray-700: #404040;          /* Primary text */
--gray-800: #262626;          /* Headers */
--gray-900: #171717;          /* Emphasis text */

/* ESPECIALES */
--white: #FFFFFF;
--black: #000000;
--flash: #FFFFFF;             /* Flash de cámara */
--overlay: rgba(0, 0, 0, 0.5); /* Modals */
```

### Uso de Colores

```typescript
// Ejemplos de uso
const buttonPrimary = {
  background: 'var(--primary-500)',
  hover: 'var(--primary-600)',
  active: 'var(--primary-700)',
  text: 'white'
}

const countdown = {
  background: 'transparent',
  number: 'var(--accent-countdown)',
  glow: 'rgba(96, 165, 250, 0.3)'
}

const success = {
  background: 'var(--accent-success)',
  icon: 'white',
  confetti: ['var(--primary-500)', 'var(--accent-countdown)', 'var(--accent-success)']
}
```

---

## 📝 Tipografía

### Font Stack

```css
/* Display - Títulos y botones */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');

--font-display: 'Poppins', 'SF Pro Display', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;

/* Body - Texto general */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

--font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, system-ui, sans-serif;
```

### Escala de Tamaños

```css
/* MOBILE/SMALL */
--text-xs: 12px;      /* 0.75rem - Ayuda, footnotes */
--text-sm: 14px;      /* 0.875rem - Labels pequeños */
--text-base: 16px;    /* 1rem - Body text */
--text-lg: 18px;      /* 1.125rem - Subtítulos */
--text-xl: 20px;      /* 1.25rem - Títulos secundarios */
--text-2xl: 24px;     /* 1.5rem - Títulos */
--text-3xl: 30px;     /* 1.875rem - Títulos grandes */
--text-4xl: 36px;     /* 2.25rem - Hero text */

/* KIOSK/LARGE (multiplica por 1.5-2x) */
--text-kiosk-base: 24px;    /* Texto base en kiosk */
--text-kiosk-button: 32px;  /* Texto botón */
--text-kiosk-title: 48px;   /* Título */
--text-kiosk-countdown: 180px; /* Countdown GIGANTE */
```

### Pesos

```css
--font-normal: 400;    /* Body text regular */
--font-medium: 500;    /* Emphasis */
--font-semibold: 600;  /* Subtítulos, labels importantes */
--font-bold: 700;      /* Títulos */
--font-extrabold: 800; /* Botón principal */
--font-black: 900;     /* Countdown numbers */
```

### Line Heights

```css
--leading-tight: 1.2;   /* Títulos grandes */
--leading-snug: 1.375;  /* Títulos */
--leading-normal: 1.5;  /* Body text */
--leading-relaxed: 1.625; /* Texto largo */
```

---

## 📏 Espaciado y Layout

### Sistema de Espaciado (8px base)

```css
--space-0: 0px;
--space-1: 4px;      /* 0.25rem */
--space-2: 8px;      /* 0.5rem */
--space-3: 12px;     /* 0.75rem */
--space-4: 16px;     /* 1rem */
--space-5: 20px;     /* 1.25rem */
--space-6: 24px;     /* 1.5rem */
--space-8: 32px;     /* 2rem */
--space-10: 40px;    /* 2.5rem */
--space-12: 48px;    /* 3rem */
--space-16: 64px;    /* 4rem */
--space-20: 80px;    /* 5rem */
--space-24: 96px;    /* 6rem */
--space-32: 128px;   /* 8rem */
```

### Border Radius

```css
--radius-sm: 6px;     /* Input, small cards */
--radius-md: 8px;     /* Cards, modals */
--radius-lg: 12px;    /* Large cards */
--radius-xl: 16px;    /* Hero cards */
--radius-2xl: 24px;   /* Extra large */
--radius-3xl: 32px;   /* Botón principal */
--radius-full: 9999px; /* Circular */
```

### Sombras

```css
/* Elevación progresiva */
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
--shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.15);

/* Sombras especiales */
--shadow-button: 0 8px 20px rgba(255, 107, 157, 0.4);
--shadow-countdown: 0 0 60px rgba(96, 165, 250, 0.5);
--shadow-success: 0 0 40px rgba(52, 211, 153, 0.4);
```

---

## 🎬 Animaciones

### Timing Functions

```css
/* Easing personalizado */
--ease-smooth: cubic-bezier(0.4, 0.0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### Duraciones

```css
--duration-instant: 100ms;   /* Hover, ripple */
--duration-fast: 200ms;      /* Transitions rápidas */
--duration-normal: 300ms;    /* Default */
--duration-slow: 500ms;      /* Modals, overlays */
--duration-slower: 800ms;    /* Page transitions */
```

### Animaciones Predefinidas

```css
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

/* Bounce In */
@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Pulse */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
}

/* Countdown Flash */
@keyframes countdownFlash {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Flash Camera */
@keyframes cameraFlash {
  0% {
    background-color: transparent;
  }
  50% {
    background-color: rgba(255, 255, 255, 1);
  }
  100% {
    background-color: transparent;
  }
}
```

---

## 🖼️ Componentes Base

### Botón Principal

```tsx
// StartButton.tsx
<button className="start-button">
  <span className="icon">📸</span>
  <span className="text">INICIAR SESIÓN</span>
</button>
```

```css
.start-button {
  /* Tamaño */
  width: 400px;
  height: 120px;
  padding: var(--space-6) var(--space-12);
  
  /* Estilo */
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  border: none;
  border-radius: var(--radius-3xl);
  box-shadow: var(--shadow-button);
  
  /* Texto */
  font-family: var(--font-display);
  font-size: var(--text-kiosk-button);
  font-weight: var(--font-extrabold);
  color: white;
  text-transform: uppercase;
  letter-spacing: 1px;
  
  /* Layout */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  
  /* Interacción */
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-smooth);
  
  /* Animación idle */
  animation: pulse 2s ease-in-out infinite;
}

.start-button:hover {
  transform: scale(1.05);
  box-shadow: 0 12px 30px rgba(255, 107, 157, 0.5);
}

.start-button:active {
  transform: scale(0.98);
}

.start-button .icon {
  font-size: 48px;
}
```

### Countdown Number

```tsx
// CountdownNumber.tsx
<div className="countdown-number">
  <span className="number">3</span>
  <div className="glow"></div>
</div>
```

```css
.countdown-number {
  position: relative;
  display: inline-block;
}

.countdown-number .number {
  /* Tamaño GIGANTE */
  font-family: var(--font-display);
  font-size: var(--text-kiosk-countdown);
  font-weight: var(--font-black);
  
  /* Gradiente animado */
  background: linear-gradient(135deg, 
    var(--accent-countdown), 
    var(--primary-500)
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  
  /* Sombra */
  filter: drop-shadow(var(--shadow-countdown));
  
  /* Animación */
  display: block;
  animation: countdownFlash 1s var(--ease-bounce);
}

.countdown-number .glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  background: radial-gradient(
    circle,
    rgba(96, 165, 250, 0.3) 0%,
    transparent 70%
  );
  animation: pulse 1s ease-in-out;
}
```

### Progress Indicator

```tsx
// ProgressIndicator.tsx
<div className="progress-indicator">
  <div className="dot active"></div>
  <div className="dot active"></div>
  <div className="dot"></div>
</div>
<p className="progress-text">2 de 3</p>
```

```css
.progress-indicator {
  display: flex;
  gap: var(--space-3);
  justify-content: center;
  align-items: center;
}

.progress-indicator .dot {
  width: 16px;
  height: 16px;
  border-radius: var(--radius-full);
  background: var(--gray-300);
  transition: all var(--duration-normal);
}

.progress-indicator .dot.active {
  background: var(--primary-500);
  box-shadow: 0 0 20px rgba(255, 107, 157, 0.5);
  transform: scale(1.2);
}

.progress-text {
  margin-top: var(--space-2);
  font-family: var(--font-body);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--gray-600);
  text-align: center;
}
```

---

## 📱 Layouts de Pantallas

### Grid System

```css
/* Container principal */
.app-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(
    to bottom,
    var(--gray-50),
    var(--white)
  );
  overflow: hidden;
}

/* Header (settings button) */
.app-header {
  height: 80px;
  padding: var(--space-6) var(--space-8);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Main content area */
.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: var(--space-12);
}

/* Footer (optional info) */
.app-footer {
  height: 60px;
  padding: var(--space-4);
  text-align: center;
  color: var(--gray-500);
  font-size: var(--text-sm);
}
```

---

## 🎯 Pantalla por Pantalla

### 1. Start Screen

```tsx
<div className="screen start-screen">
  <header className="app-header">
    <div className="logo">
      <img src="/logo.png" alt="PhotoBooth" />
    </div>
    <button className="settings-button">
      ⚙️
    </button>
  </header>

  <main className="app-main">
    {/* Camera Preview */}
    <div className="camera-preview">
      <video autoPlay muted />
    </div>

    {/* Title */}
    <h1 className="title">¡Toma tus Fotos!</h1>
    <p className="subtitle">Serán 3 fotos en una tira</p>

    {/* Main Button */}
    <button className="start-button">
      <span className="icon">📸</span>
      <span className="text">INICIAR SESIÓN</span>
    </button>
  </main>
</div>
```

```css
.start-screen {
  background: linear-gradient(135deg, var(--gray-50), var(--white));
}

.camera-preview {
  width: 640px;
  height: 480px;
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-xl);
  margin-bottom: var(--space-8);
  border: 4px solid white;
}

.camera-preview video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1); /* Mirror effect */
}

.title {
  font-family: var(--font-display);
  font-size: var(--text-kiosk-title);
  font-weight: var(--font-bold);
  color: var(--gray-800);
  margin-bottom: var(--space-3);
  text-align: center;
}

.subtitle {
  font-family: var(--font-body);
  font-size: var(--text-kiosk-base);
  color: var(--gray-600);
  margin-bottom: var(--space-12);
  text-align: center;
}
```

### 2. Countdown Screen

```tsx
<div className="screen countdown-screen">
  <div className="camera-fullscreen">
    <video autoPlay muted />
  </div>

  <div className="countdown-overlay">
    <div className="countdown-number">
      <span className="number">3</span>
      <div className="glow"></div>
    </div>

    <p className="countdown-message">Primera foto</p>
    <p className="countdown-instruction">¡Prepárate!</p>

    <div className="progress-indicator">
      <div className="dot active"></div>
      <div className="dot"></div>
      <div className="dot"></div>
    </div>
    <p className="progress-text">1 de 3</p>
  </div>
</div>
```

```css
.countdown-screen {
  position: relative;
  background: black;
}

.camera-fullscreen {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.camera-fullscreen video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
  opacity: 0.8; /* Slightly dimmed */
}

.countdown-overlay {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  text-align: center;
}

.countdown-message {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: white;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  margin-top: var(--space-8);
}

.countdown-instruction {
  font-family: var(--font-display);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  color: white;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  margin-bottom: var(--space-16);
}
```

### 3. Success Screen

```tsx
<div className="screen success-screen">
  <div className="confetti"></div>

  <div className="success-content">
    <div className="success-icon">🎉</div>
    <h1 className="success-title">¡Listo!</h1>
    <p className="success-message">
      Recoge tus fotos en la impresora
    </p>

    <div className="qr-container">
      <img src={qrCodeUrl} alt="QR Code" />
      <p className="qr-text">Escanea para descargar</p>
    </div>

    <p className="countdown-return">
      Volviendo al inicio en 5...
    </p>
  </div>
</div>
```

```css
.success-screen {
  background: linear-gradient(135deg, 
    var(--accent-success), 
    var(--primary-500)
  );
  color: white;
  position: relative;
  overflow: hidden;
}

.success-icon {
  font-size: 120px;
  animation: bounceIn 0.8s var(--ease-bounce);
}

.success-title {
  font-family: var(--font-display);
  font-size: var(--text-kiosk-title);
  font-weight: var(--font-extrabold);
  margin: var(--space-6) 0;
  animation: fadeIn 0.5s var(--ease-smooth) 0.2s backwards;
}

.success-message {
  font-family: var(--font-body);
  font-size: var(--text-kiosk-base);
  margin-bottom: var(--space-12);
  animation: fadeIn 0.5s var(--ease-smooth) 0.4s backwards;
}

.qr-container {
  background: white;
  padding: var(--space-8);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-2xl);
  animation: scaleIn 0.5s var(--ease-bounce) 0.6s backwards;
}

.qr-container img {
  width: 200px;
  height: 200px;
}

.qr-text {
  margin-top: var(--space-4);
  color: var(--gray-700);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
}
```

---

## ✅ Resumen

Este sistema de diseño provee:
- ✅ Colores consistentes y accesibles
- ✅ Tipografía escalable y legible
- ✅ Espaciado coherente
- ✅ Animaciones suaves y profesionales
- ✅ Componentes reutilizables
- ✅ Layouts responsivos

**Próximo paso:** Implementar estos estilos en TailwindCSS + componentes shadcn/ui
