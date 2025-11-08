# 🚀 Quick Start Guide

## Inicio Rápido (5 minutos)

### 1. Instalar dependencias (si no está hecho)
```bash
npm install
```

### 2. Iniciar en modo desarrollo
```bash
npm start
```

La aplicación se abrirá automáticamente con:
- ✅ Hot Module Replacement activo
- ✅ DevTools abierto
- ✅ Navegación funcional entre pantallas

### 3. Probar el flujo
1. Click en "INICIAR SESIÓN"
2. Ver countdown de 3 segundos
3. Pantalla de captura (simulada)
4. Pantalla de éxito
5. Click en "VOLVER AL INICIO"

## 🔧 Desarrollo

### Archivo principal para editar
- **`src/App.tsx`** - Navegación y lógica principal
- **`src/screens/*.tsx`** - Pantallas individuales
- **`src/store/useAppStore.ts`** - Estado global
- **`src/services/api.ts`** - Llamadas al backend

### Hot Reload
Cualquier cambio en archivos `.tsx`, `.ts`, `.css` se recargará automáticamente.

### Conectar con Backend
1. Asegúrate que el backend está corriendo en `http://127.0.0.1:8000`
2. Edita `src/screens/CaptureScreen.tsx` para usar la API:

```tsx
import photoboothAPI from '../services/api';

// Ejemplo de captura
const capturePhoto = async () => {
  try {
    const result = await photoboothAPI.camera.capture();
    console.log('Foto capturada:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## 📦 Build para Producción

### Crear instalador
```bash
npm run make
```

Outputs en `out/make/`:
- Windows: `.exe` installer
- macOS: `.app` bundle in ZIP
- Linux: `.deb` y `.rpm` packages

### Modo Kiosk (Producción)
```bash
KIOSK_MODE=true npm start
```

## 🎨 Personalización

### Cambiar colores
Edita `src/index.css` o usa clases de Tailwind CSS:
```tsx
<div className="bg-gradient-to-br from-blue-500 to-purple-600">
```

### Agregar nueva pantalla
1. Crear `src/screens/MiPantalla.tsx`
2. Agregar tipo en `src/store/useAppStore.ts`:
   ```ts
   type Screen = 'start' | 'countdown' | 'capture' | 'mi-pantalla' | 'success';
   ```
3. Agregar case en `src/App.tsx`:
   ```tsx
   case 'mi-pantalla':
     return <MiPantalla />;
   ```

### Modificar configuración de ventana
Edita `src/main.ts:33` para cambiar tamaño, fullscreen, etc.

## ❓ Problemas Comunes

**App no inicia:**
```bash
rm -rf node_modules package-lock.json
npm install
npm start
```

**Puerto 5173 ocupado:**
Vite elegirá automáticamente otro puerto (5174, 5175, etc.)

**Backend no responde:**
Verifica que el backend esté corriendo:
```bash
curl http://127.0.0.1:8000/health
```

## 📚 Siguiente Pasos

1. **Implementar captura real**: Ver `src/screens/CaptureScreen.tsx`
2. **Agregar react-webcam**: `npm install react-webcam`
3. **Conectar todos los endpoints**: Usar `src/services/api.ts`
4. **Agregar manejo de errores**: Loading states, error boundaries
5. **Mejorar UI/UX**: Animaciones, transiciones, feedback visual

## 🤝 Necesitas Ayuda?

- Revisa `README.md` para documentación completa
- Consulta logs en DevTools (Console tab)
- Verifica el backend en http://127.0.0.1:8000

---

**Happy Coding! 🎉**
