# Guía: Diseños Personalizados desde Canva
**Sistema Drag & Drop Simple** | Noviembre 2025

---

## 🎨 Flujo Completo (Super Simple)

### 1. Crear Diseño en Canva

```
1. Abre Canva.com
2. Crear diseño → Tamaño personalizado → 600 x 450 px
3. Diseña tu footer personalizado:
   - Nombre del evento
   - Fecha
   - Decoraciones temáticas
   - Logo
   - Lo que quieras!
4. Exportar → PNG o JPG → Descargar
```

### 2. Subir a PhotoBooth

**Opción A: Drag & Drop (más fácil)**
```
1. Abre la app PhotoBooth
2. Click en ⚙️ Settings
3. Tab "Diseños"
4. Arrastra el archivo desde tu carpeta de descargas
5. ¡Listo! Automáticamente activado
```

**Opción B: API (para testing)**
```bash
# Con curl desde terminal
curl -X POST http://localhost:8000/api/designs/upload \
  -F "file=@/ruta/a/tu/diseño.png" \
  -F "name=XV Años Liz"
```

### 3. Usar en Evento

```
- El diseño activo se aplica automáticamente
- Cada tira tendrá ese diseño en el footer
- Cambiar diseño en cualquier momento
- Sin reiniciar la app
```

---

## 📐 Especificaciones Técnicas

### Dimensiones Exactas

```
Ancho:  600 píxeles
Alto:   450 píxeles
DPI:    300 (opcional en Canva, lo ajustamos automáticamente)
Formato: PNG (con transparencia) o JPG
```

### Template de Canva

**Configuración recomendada:**
```
1. Nuevo diseño → 600 x 450 px
2. Fondo: Color sólido o degradado
3. Elementos permitidos:
   - Texto (nombre, fecha, mensaje)
   - Formas (corazones, estrellas, círculos)
   - Stickers de Canva
   - Tu logo
   - Decoraciones temáticas
4. NO incluir fotos (las fotos van arriba automáticamente)
```

---

## 🎨 Ejemplos de Diseños

### Ejemplo 1: XV Años (Como "LIZ")

```
Canva Setup:
├─ Fondo: Gradiente azul (#4A90E2 → #5AB9EA)
├─ Texto principal: "LIZ" (tamaño 80px, fuente Poppins Bold)
├─ Decoraciones: Estrellas blancas dispersas
├─ Elementos: Splash/manchas de pintura
└─ Color texto: Blanco #FFFFFF

Exportar: PNG con transparencia
```

### Ejemplo 2: San Valentín

```
Canva Setup:
├─ Fondo: Degradado rosa/rojo
├─ Texto: "Día del Amor ❤️" (centrado)
├─ Decoraciones: Corazones flotantes
├─ Fecha: "14 Febrero 2025" (pequeño, abajo)
└─ Stickers: Cupido, flechas

Exportar: PNG
```

### Ejemplo 3: Bodas

```
Canva Setup:
├─ Fondo: Blanco elegante con textura sutil
├─ Texto: "María & Juan" (fuente script elegante)
├─ Fecha: "15 de Febrero, 2025"
├─ Decoraciones: Flores minimalistas en esquinas
├─ Color: Dorado/oro #D4AF37
└─ Elementos: Anillos, corazón sutil

Exportar: PNG
```

### Ejemplo 4: Cumpleaños

```
Canva Setup:
├─ Fondo: Multicolor festivo con confetti
├─ Texto: "¡Feliz Cumpleaños!"
├─ Nombre: "Carlos" (grande, centrado)
├─ Edad: "30 AÑOS" (destacado)
├─ Decoraciones: Globos, pastel, velas
└─ Colores: Vibrantes y alegres

Exportar: PNG
```

---

## 🛠️ Gestión de Diseños

### Listar Diseños Disponibles

```http
GET http://localhost:8000/api/designs/list

Response:
{
  "designs": [
    {
      "id": "design_20251102_214530",
      "name": "XV Años Liz",
      "file_path": "/path/to/design.png",
      "preview_url": "/api/designs/preview/design_20251102_214530",
      "is_active": true,
      "created_at": "2025-11-02T21:45:30"
    }
  ],
  "active_design": {...}
}
```

### Activar Diseño Diferente

```http
PUT http://localhost:8000/api/designs/set-active/design_20251102_214530

Response:
{
  "success": true,
  "message": "Diseño 'design_20251102_214530' activado"
}
```

### Eliminar Diseño

```http
DELETE http://localhost:8000/api/designs/delete/design_20251102_214530

Response:
{
  "success": true,
  "message": "Diseño eliminado"
}
```

---

## 💡 Tips y Mejores Prácticas

### ✅ DO (Hacer)

- **Usar colores contrastantes** - Fondo oscuro + texto claro (o viceversa)
- **Fuentes legibles** - Tamaño mínimo 24px en Canva
- **Diseño centrado** - Importante visualmente en el centro
- **Guardar múltiples versiones** - Para diferentes eventos
- **Probar antes** - Haz una impresión de prueba
- **Usar PNG** - Si necesitas transparencia

### ❌ DON'T (Evitar)

- **Texto muy pequeño** - No se leerá en impresión
- **Colores muy claros** - Se pierden en papel
- **Demasiados elementos** - Mantén simple
- **Fotos de fondo** - Complica lectura del texto
- **Bordes muy al límite** - Deja margen de 20px

---

## 🔄 Flujo Completo en Evento

### Antes del Evento (10 minutos)

```bash
1. Crear diseño en Canva → 5 min
2. Descargar PNG/JPG
3. Abrir PhotoBooth
4. Settings → Diseños → Upload
5. Probar con foto de prueba
6. Verificar impresión test
7. ¡Listo!
```

### Durante el Evento

```
- Diseño se aplica automáticamente
- Cada sesión usa el diseño activo
- Puedes cambiar diseño sin reiniciar
```

### Cambiar Diseño Mid-Evento

```bash
Escenario: Tienes 2 eventos seguidos

Evento 1 (XV Años):
1. Diseño "XV Liz" activo
2. 50 sesiones → OK

[Cambio de evento]

Evento 2 (Boda):
3. Settings → Diseños → Click en "Boda María"
4. Automáticamente activo
5. Próximas sesiones usan nuevo diseño
6. Sin reiniciar app
```

---

## 🎯 Casos de Uso Reales

### Caso 1: Fotógrafo Freelance

```
Situación: 3 eventos diferentes en fin de semana

Viernes (XV Años):
- Diseño: Rosa/púrpura con corona
- Nombre: "Sofía"

Sábado (Boda):  
- Diseño: Blanco elegante
- Nombre: "Ana & Luis"

Domingo (Cumpleaños):
- Diseño: Multicolor festivo
- Nombre: "Carlos - 30 años"

Resultado: 3 diseños pre-cargados, cambias en Settings en 5 segundos
```

### Caso 2: Empresa de Eventos

```
Situación: Eventos corporativos con branding

Crear diseño base:
- Logo de la empresa cliente
- Colores corporativos
- Mensaje customizado
- Redes sociales

Upload una vez:
- Usar todo el mes
- Consistencia en branding
- Cliente feliz
```

---

## 📱 Próximas Features (Futuro)

### En Desarrollo

- [ ] **Galería de templates** - Diseños pre-hechos
- [ ] **Editor inline** - Editar texto sin salir de app
- [ ] **Variables dinámicas** - {nombre}, {fecha} automáticos
- [ ] **Preview en vivo** - Ver diseño antes de evento
- [ ] **Biblioteca compartida** - Compartir diseños entre usuarios

---

## 🆘 Troubleshooting

### "Mi diseño se ve cortado"

**Problema:** Dimensiones incorrectas  
**Solución:** Verifica que sean exactamente 600x450px en Canva

### "El texto no se lee bien"

**Problema:** Bajo contraste  
**Solución:** Usa fondo oscuro + texto claro (o viceversa)

### "La imagen es muy pesada"

**Problema:** Archivo PNG muy grande  
**Solución:** Exporta como JPG con calidad 90%

### "El diseño no se aplica"

**Problema:** No está activado  
**Solución:** 
```http
GET http://localhost:8000/api/designs/active
# Verifica cuál está activo
```

---

## ✅ Checklist Pre-Evento

Antes de cada evento, verifica:

- [ ] Diseño creado en Canva (600x450px)
- [ ] Exportado como PNG o JPG
- [ ] Subido a PhotoBooth
- [ ] Activado (check verde)
- [ ] Prueba impresa OK
- [ ] Texto legible
- [ ] Colores correctos
- [ ] Logo visible
- [ ] Sin errores ortográficos

---

**¡Tu sistema está listo para recibir diseños desde Canva!** 🎨

Simplemente: Diseña → Descarga → Arrastra → ¡Listo!
