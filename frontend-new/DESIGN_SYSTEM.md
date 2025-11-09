# 🎨 PHOTOBOOTH DESIGN SYSTEM v1.0

Sistema de design tokens profesional basado en HSL para mejor control de color y mantenibilidad.

---

## 📚 TABLA DE CONTENIDOS

1. [Variables Base (shadcn/ui)](#variables-base)
2. [Semantic Tokens](#semantic-tokens)
3. [Spacing System](#spacing-system)
4. [Animation Tokens](#animation-tokens)
5. [Typography](#typography)
6. [Shadows](#shadows)
7. [Z-Index Layers](#z-index-layers)
8. [Utility Classes](#utility-classes)
9. [Guía de Uso](#guía-de-uso)
10. [Best Practices](#best-practices)

---

## 🎯 VARIABLES BASE (shadcn/ui)

Estas variables son **críticas** para que los componentes shadcn funcionen correctamente.

```css
--background: 0 0% 3.9%;         /* #0a0a0a - Fondo principal */
--foreground: 0 0% 98%;           /* #fafafa - Texto principal */

--card: 0 0% 10%;                 /* #1a1a1a - Fondo de cards */
--card-foreground: 0 0% 98%;      /* Texto en cards */

--primary: 330 100% 50%;          /* #ff0080 - Magenta (brand color) */
--primary-foreground: 0 0% 100%;  /* Texto sobre primary */

--secondary: 0 0% 14.9%;          /* #262626 - Gris medio */
--secondary-foreground: 0 0% 98%;

--muted: 0 0% 16%;                /* #292929 - Fondo muted */
--muted-foreground: 0 0% 64%;     /* #a3a3a3 - Texto muted */

--destructive: 0 84% 60%;         /* #ef4444 - Rojo para eliminar */
--destructive-foreground: 0 0% 98%;

--border: 0 0% 20%;               /* #333333 - Bordes sutiles */
--input: 0 0% 16%;                /* #292929 - Fondo de inputs */
--ring: 330 100% 50%;             /* Magenta para focus ring */

--radius: 0.75rem;                /* 12px - Border radius global */
```

### Uso:
```tsx
// ✅ CORRECTO: Usar variables de shadcn
<div className="bg-card text-card-foreground border-border">
  <Button className="bg-primary text-primary-foreground">
    Click
  </Button>
</div>

// ❌ EVITAR: Hardcodear colores
<div className="bg-gray-900 text-white border-gray-800">
  <button className="bg-[#ff0080] text-white">Click</button>
</div>
```

---

## 🏷️ SEMANTIC TOKENS

Colores con **significado** para UI consistente:

### Brand Colors:
```css
--brand-magenta: 330 100% 50%;    /* #ff0080 - Color principal */
--brand-black: 0 0% 0%;           /* #000000 */
--brand-dark: 0 0% 3.9%;          /* #0a0a0a */
```

### Status Colors:
```css
--success: 142 76% 36%;           /* #22c55e - Verde */
--warning: 38 92% 50%;            /* #f59e0b - Amarillo */
--error: 0 84% 60%;               /* #ef4444 - Rojo */
--info: 199 89% 48%;              /* #0ea5e9 - Azul */
```

### Device Status:
```css
--status-online: 142 76% 36%;     /* Verde */
--status-offline: 0 84% 60%;      /* Rojo */
--status-warning: 38 92% 50%;     /* Amarillo */
--status-unknown: 0 0% 64%;       /* Gris */
```

### Uso:
```tsx
// ✅ CORRECTO: Usar semantic colors
<Badge className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]">
  Online
</Badge>

<Badge className="bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]">
  Warning
</Badge>

// O usar utility classes:
<span className="text-success">Activo</span>
<span className="text-error">Error</span>
```

---

## 📏 SPACING SYSTEM (8px grid)

Sistema coherente basado en múltiplos de 8px:

```css
--spacing-0: 0;
--spacing-1: 0.25rem;   /* 4px */
--spacing-2: 0.5rem;    /* 8px */
--spacing-3: 0.75rem;   /* 12px */
--spacing-4: 1rem;      /* 16px */
--spacing-5: 1.25rem;   /* 20px */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px */
--spacing-10: 2.5rem;   /* 40px */
--spacing-12: 3rem;     /* 48px */
--spacing-16: 4rem;     /* 64px */
--spacing-20: 5rem;     /* 80px */
```

### Uso:
```tsx
// ✅ CORRECTO: Usar spacing system
<div className="p-[var(--spacing-4)] gap-[var(--spacing-2)]">

// ❌ EVITAR: Valores arbitrarios
<div className="p-[17px] gap-[13px]">
```

---

## ⏱️ ANIMATION TOKENS

Durations y easing consistentes:

### Durations:
```css
--duration-instant: 0ms;
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
--duration-slower: 800ms;
```

### Easing Functions:
```css
--easing-default: cubic-bezier(0.4, 0, 0.2, 1);
--easing-in: cubic-bezier(0.4, 0, 1, 1);
--easing-out: cubic-bezier(0, 0, 0.2, 1);
--easing-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--easing-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Uso:
```tsx
// ✅ CORRECTO: Usar animation tokens
<div className="transition-all duration-[var(--duration-normal)] ease-[var(--easing-default)]">

// O usar utility class:
<div className="transition-smooth">
```

---

## 📝 TYPOGRAPHY

Sistema de escalas tipográficas:

### Font Sizes:
```css
--font-size-xs: 0.75rem;    /* 12px */
--font-size-sm: 0.875rem;   /* 14px */
--font-size-base: 1rem;     /* 16px */
--font-size-lg: 1.125rem;   /* 18px */
--font-size-xl: 1.25rem;    /* 20px */
--font-size-2xl: 1.5rem;    /* 24px */
--font-size-3xl: 1.875rem;  /* 30px */
--font-size-4xl: 2.25rem;   /* 36px */
```

### Line Heights:
```css
--line-height-tight: 1.25;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;
```

### Uso:
```tsx
<h1 className="text-[var(--font-size-4xl)] leading-[var(--line-height-tight)]">
  Título Grande
</h1>
```

---

## 🌑 SHADOWS

Sistema de profundidad visual:

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
--shadow-glow-magenta: 0 0 20px rgb(255 0 128 / 0.5);
```

### Uso:
```tsx
<Card className="shadow-[var(--shadow-lg)]">
<Button className="hover:glow-magenta">
```

---

## 🗂️ Z-INDEX LAYERS

Sistema de capas para evitar conflictos:

```css
--z-base: 0;
--z-dropdown: 10;
--z-sticky: 20;
--z-fixed: 30;
--z-modal-backdrop: 40;
--z-modal: 50;
--z-popover: 60;
--z-tooltip: 70;
--z-toast: 80;
--z-max: 9999;
```

### Uso:
```tsx
<div className="z-[var(--z-modal)]">
<Toast className="z-[var(--z-toast)]">
```

---

## 🔧 UTILITY CLASSES

Classes helper para casos comunes:

### Text Utilities:
```css
.text-brand-magenta { color: hsl(var(--brand-magenta)); }
.text-success { color: hsl(var(--success)); }
.text-warning { color: hsl(var(--warning)); }
.text-error { color: hsl(var(--error)); }
```

### Background Utilities:
```css
.bg-photobooth-dark { background-color: hsl(var(--brand-dark)); }
```

### Effect Utilities:
```css
.glow-magenta { box-shadow: var(--shadow-glow-magenta); }
.transition-smooth {
  transition-duration: var(--duration-normal);
  transition-timing-function: var(--easing-default);
}
```

### Uso:
```tsx
<span className="text-success">✓ Guardado</span>
<Button className="glow-magenta">Capturar</Button>
<div className="transition-smooth hover:scale-105">
```

---

## 📖 GUÍA DE USO

### 1. **Usar Variables de Shadcn** ✅
```tsx
// Siempre prefiere las variables de shadcn para componentes
<Card className="bg-card text-card-foreground border-border">
  <CardHeader className="border-b border-border">
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent className="text-muted-foreground">
    Contenido
  </CardContent>
</Card>
```

### 2. **Usar Semantic Colors** ✅
```tsx
// Para estados y feedback, usa semantic colors
<Badge className="bg-[hsl(var(--success))]">Activo</Badge>
<Alert className="border-[hsl(var(--warning))]">Advertencia</Alert>
<span className="text-error">Error</span>
```

### 3. **Consistencia en Spacing** ✅
```tsx
// Usa spacing system para márgenes y paddings
<div className="p-[var(--spacing-4)] gap-[var(--spacing-2)]">
  <div className="mb-[var(--spacing-6)]">
```

### 4. **Animations Consistentes** ✅
```tsx
// Usa tokens de animación para transiciones
<div className="transition-smooth">
<div className="transition-all duration-[var(--duration-fast)]">
```

---

## ✅ BEST PRACTICES

### DO ✅

```tsx
// ✅ Usar variables CSS
<div className="bg-card border-border">

// ✅ Semantic naming
<Badge className="bg-[hsl(var(--success))]">Online</Badge>

// ✅ Spacing system
<div className="p-[var(--spacing-4)]">

// ✅ Animation tokens
<div className="transition-smooth">

// ✅ Utility classes cuando aplique
<span className="text-success">✓ Completado</span>
```

### DON'T ❌

```tsx
// ❌ Hardcodear colores
<div className="bg-gray-900 border-gray-800">

// ❌ Valores mágicos sin significado
<Badge className="bg-green-500">Online</Badge>

// ❌ Spacing arbitrario
<div className="p-[17px] gap-[13px]">

// ❌ Durations hardcoded
<div className="transition-all duration-[273ms]">

// ❌ Colores sin semántica
<span className="text-red-500">Error</span>
```

---

## 🎯 VENTAJAS DEL SISTEMA

### Inmediatas:
- ✅ Shadcn funciona perfectamente
- ✅ UI consistente en toda la app
- ✅ Fácil cambiar colores globalmente
- ✅ No más hardcoded colors

### A Futuro:
- ✅ Agregar modo "Staff" fácilmente
- ✅ Modo claro (si se necesita)
- ✅ Mejor accesibilidad (contraste controlado)
- ✅ Escalable a nuevos componentes

### Best Practices:
- ✅ Semantic naming (success, warning, error)
- ✅ HSL format (mejor para manipulación)
- ✅ Spacing system coherente (8px grid)
- ✅ Z-index layers documentados
- ✅ Animation tokens reutilizables

---

## 🔄 MODO STAFF (Futuro)

Para activar variantes de color:

```tsx
<div data-mode="staff">
  <!-- Automáticamente usa colores azules en lugar de magenta -->
</div>
```

```css
[data-mode="staff"] {
  --primary: 220 100% 50%;  /* Azul */
  --ring: 220 100% 50%;
}
```

---

## 📚 RECURSOS

- **shadcn/ui Docs**: https://ui.shadcn.com/
- **HSL Colors**: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/hsl
- **Tailwind CSS**: https://tailwindcss.com/
- **Design Tokens**: https://www.w3.org/community/design-tokens/

---

**Versión:** 1.0  
**Última actualización:** 9 de Noviembre 2025  
**Mantenido por:** Team Photobooth
