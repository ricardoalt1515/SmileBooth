# 📅 SISTEMA DE EVENTOS/PRESETS - GUÍA COMPLETA

**Fecha:** 9 de Noviembre 2025  
**Versión:** 1.0  
**Feature:** Gestión de Presets para Eventos

---

## 🎯 **¿QUÉ ES EL SISTEMA DE EVENTOS?**

El Sistema de Eventos es el **feature #1 más importante** para usar tu photobooth profesionalmente. Te permite:

1. **Guardar configuraciones completas** para diferentes tipos de eventos
2. **Cambiar de un evento a otro en 1 click** (sin ajustar sliders manualmente)
3. **Drag & drop de diseños de Canva** directamente en el evento
4. **Duplicar eventos** para crear variaciones rápidamente
5. **Ver claramente qué evento está activo** en tiempo real

---

## 🚀 **CASOS DE USO REALES**

### **Escenario 1: Eventos Privados (Boda)**
```
📅 Evento: "Boda María & Juan"
📸 Fotos: 4
⏱️  Countdown: 5s
🎨 Diseño: boda-elegante-rosa.png
💒 Tipo: Boda

✅ Click en "Activar" → Listo para el evento
```

### **Escenario 2: Eventos Públicos (Centro Comercial)**
```
📅 Evento: "Navidad Mall 2025"
📸 Fotos: 3
⏱️  Countdown: 3s (rápido para filas)
🎨 Diseño: navidad-generico.png
🌟 Tipo: Público

✅ Este queda como tu "Base" → Siempre disponible
```

### **Escenario 3: Cambio Rápido Entre Eventos**
```
10:00 AM → Boda (4 fotos, diseño elegante)
       ↓ 1 click para cambiar
3:00 PM  → XV Años (6 fotos, diseño colorido)
       ↓ 1 click para cambiar
7:00 PM  → Cumpleaños (3 fotos, diseño infantil)
```

**Resultado:** En lugar de 10 minutos ajustando settings → **5 segundos**

---

## 📖 **CÓMO USAR EL SISTEMA**

### **1. Acceder a la Gestión de Eventos**

1. Abre la aplicación
2. Presiona **`Cmd + S`** (o click en el icono de settings en StaffDock)
3. Verás **4 pestañas** en la parte superior:
   - **📅 Eventos** ← La nueva pestaña (abre por defecto)
   - ⚙️ General
   - 🎨 Diseños
   - 🖨️ Impresión

---

### **2. Crear tu Primer Evento**

#### **Paso 1: Click en "Nuevo Evento"**
```
[+ Nuevo Evento] ← Botón en la esquina superior derecha
```

#### **Paso 2: Configurar el Evento**
Un diálogo se abrirá con estos campos:

```
Nombre del Evento*:     [Boda María & Juan          ]
Tipo de Evento:         [💒 Boda                    ▼]
Fecha del Evento:       [2025-11-15                 📅]

--- CONFIGURACIÓN DE CAPTURA ---
Fotos por sesión:       [4                          ▼]
Countdown (segundos):   [5                          ▼]
Auto-reset (segundos):  [30                         ▼]

--- AUDIO ---
[✓] Audio activado
Velocidad voz:          [1.0] ━━━━━━●━━━━ [2.0]
Tono voz:               [1.0] ━━━━━━●━━━━ [2.0]

--- DISEÑO ---
Diseño de Canva:        [Arrastra tu diseño aquí    ]
                        o click para seleccionar

--- INFORMACIÓN DEL CLIENTE ---
Cliente:                [María García               ]
Contacto:               [maria@email.com            ]
Notas:                  [Boda elegante, tema rosa   ]
                        [Imprimir 200 tiras         ]

[Cancelar]  [Guardar Evento]
```

#### **Paso 3: Drag & Drop del Diseño de Canva**

**Opción A - Arrastrar:**
1. Abre tu carpeta de diseños de Canva
2. Arrastra el archivo `.png` o `.jpg` directamente a la zona de "Diseño"
3. ¡Listo! El diseño se sube automáticamente

**Opción B - Seleccionar:**
1. Click en "o click para seleccionar"
2. Navega a tu carpeta de diseños
3. Selecciona el archivo
4. ¡Listo!

---

### **3. Activar un Evento**

Una vez guardado, verás tu evento en la lista:

```
╔════════════════════════════════════════════╗
║  Boda María & Juan            💒 Boda      ║
║  📅 15 de noviembre de 2025                ║
║                                            ║
║  4 fotos  •  5s count  •  🎨 diseño       ║
║                                            ║
║  [▶ Activar]  [✏️]  [📋]  [🗑️]            ║
╚════════════════════════════════════════════╝
```

**Click en "▶ Activar"**

```
✅ ¡Evento "Boda María & Juan" activado!
```

Ahora el evento se moverá arriba con un borde verde y badge "ACTIVO":

```
╔════════════════════════════════════════════╗
║  ✓  Boda María & Juan        [🟢 ACTIVO]  ║
║  💒 Boda • 15 de noviembre de 2025        ║
║                                            ║
║  4        5s       30s       🎨           ║
║  fotos    count    reset     diseño       ║
║                                            ║
║  📝 Boda elegante, tema rosa              ║
║     Imprimir 200 tiras                    ║
╚════════════════════════════════════════════╝
```

**Todos los settings se aplicaron automáticamente:**
- ✅ Fotos: 4
- ✅ Countdown: 5s
- ✅ Diseño: boda-elegante-rosa.png
- ✅ Audio configurado

---

### **4. Duplicar un Evento**

¿Tienes una boda similar la próxima semana?

1. Click en el botón **📋 Copiar**
2. Se crea: "Boda María & Juan (Copia)"
3. Edita el nombre y la fecha
4. ¡Listo! Nueva configuración en 10 segundos

---

### **5. Evento Base (Por Defecto)**

El sistema crea automáticamente un **"Evento Público (Base)"**:

```
╔════════════════════════════════════════════╗
║  ⭐ Evento Público (Base)    [🌟 Base]    ║
║  🌟 Público                                ║
║                                            ║
║  4 fotos  •  5s count  •  Sin diseño      ║
║                                            ║
║  [▶ Activar]  [✏️]  [📋]                  ║
╚════════════════════════════════════════════╝
```

**¿Para qué sirve?**
- Tu configuración "genérica" para eventos walk-up
- No tiene diseño personalizado (o un diseño neutro)
- Siempre disponible, no se puede eliminar
- Ideal para centros comerciales, ferias, etc.

---

## 🎨 **TIPOS DE EVENTOS**

El sistema soporta 6 tipos de eventos con iconos distintivos:

| Tipo         | Icono | Color      | Uso                              |
|--------------|-------|------------|----------------------------------|
| Boda         | 💒    | Rosa       | Bodas, aniversarios              |
| Cumpleaños   | 🎂    | Amarillo   | Cumpleaños, fiestas infantiles   |
| Fiesta       | 🎉    | Morado     | Fiestas generales, despedidas    |
| Corporativo  | 🏢    | Azul       | Eventos de empresa, conferencias |
| Público      | 🌟    | Verde      | Centros comerciales, ferias      |
| Personalizado| ⚙️    | Gris       | Eventos especiales, otros        |

---

## ⚡ **FLUJO TÍPICO DE TRABAJO**

### **Setup Inicial (Una vez)**
```
1. Crear evento "Base Público" (sin diseño)
2. Crear plantillas para cada tipo:
   - "Plantilla Boda"
   - "Plantilla XV Años"
   - "Plantilla Corporativo"
3. Estos quedan guardados para siempre
```

### **Preparación de Evento Privado**
```
1. Cliente te contrata para una boda
2. En Canva, personalizas tu plantilla boda:
   - Nombres de los novios
   - Fecha
   - Colores del tema
3. Exportas el diseño: "boda-maria-juan.png"
4. En la app:
   - Duplicas "Plantilla Boda"
   - Renombras a "Boda María & Juan"
   - Drag & drop del diseño
   - Guardas
5. Día del evento:
   - 1 click en "Activar"
   - ¡Listo para capturar!
```

**Tiempo total:** 2 minutos (vs 15 minutos ajustando settings manualmente)

---

## 🔧 **ARQUITECTURA TÉCNICA**

### **Backend (FastAPI)**

**Archivos:**
- `backend/app/models/preset.py` - Modelo de datos
- `backend/app/api/presets.py` - Endpoints CRUD
- `backend/data/presets.json` - Persistencia

**Endpoints:**
```python
GET    /api/presets              # Listar todos
GET    /api/presets/{id}         # Obtener uno
POST   /api/presets              # Crear nuevo
PUT    /api/presets/{id}         # Actualizar
DELETE /api/presets/{id}         # Eliminar
POST   /api/presets/{id}/activate    # Activar
POST   /api/presets/{id}/duplicate   # Duplicar
```

**Lógica de Activación:**
```python
def activate_preset(preset_id):
    1. Buscar el preset
    2. Desactivar preset anterior
    3. Activar nuevo preset
    4. Aplicar configuración a settings.json
    5. Retornar preset activado
```

---

### **Frontend (React + shadcn/ui)**

**Archivos:**
- `frontend/src/types/preset.ts` - TypeScript tipos
- `frontend/src/components/EventsManager.tsx` - UI principal
- `frontend/src/services/api.ts` - Llamadas al backend

**Componentes:**
```tsx
<EventsManager>
  ├── Header con "Nuevo Evento"
  ├── Card de Evento Activo (destacado)
  ├── Grid de Eventos Guardados
  │   ├── PresetCard (con acciones)
  │   │   ├── Activar
  │   │   ├── Editar
  │   │   ├── Duplicar
  │   │   └── Eliminar
  │   └── ...
  └── Tip de Drag & Drop
</EventsManager>
```

---

## 📊 **DATOS GUARDADOS POR EVENTO**

Cada evento guarda:

```json
{
  "id": "abc123",
  "name": "Boda María & Juan",
  "event_type": "wedding",
  "event_date": "2025-11-15",
  
  // Captura
  "photos_to_take": 4,
  "countdown_seconds": 5,
  "auto_reset_seconds": 30,
  
  // Audio
  "audio_enabled": true,
  "voice_rate": 1.0,
  "voice_pitch": 1.0,
  "voice_volume": 1.0,
  
  // Diseño
  "design_id": "design_xyz",
  "design_name": "boda-elegante-rosa",
  "design_path": "/data/designs/design_xyz.png",
  "design_preview_url": "/api/designs/design_xyz.png",
  
  // Metadata
  "is_active": true,
  "is_default": false,
  "created_at": "2025-11-09T10:00:00",
  "updated_at": "2025-11-09T10:00:00",
  
  // Cliente
  "notes": "Boda elegante, tema rosa. Imprimir 200 tiras",
  "client_name": "María García",
  "client_contact": "maria@email.com"
}
```

---

## 💡 **TIPS & MEJORES PRÁCTICAS**

### **1. Organización de Diseños**
```
📁 Mis Diseños de Canva/
  ├── 📁 Bodas/
  │   ├── plantilla-boda-elegante.png
  │   ├── plantilla-boda-rustica.png
  │   └── plantilla-boda-moderna.png
  ├── 📁 XV Años/
  │   ├── plantilla-xv-rosa.png
  │   └── plantilla-xv-azul.png
  ├── 📁 Corporativos/
  │   └── plantilla-corporativo-simple.png
  └── 📁 Publico/
      └── base-sin-diseno.png
```

### **2. Nombra Eventos Claramente**
```
✅ BIEN:
- "Boda María & Juan - 15 Nov"
- "XV Años Ana - Casa de Eventos"
- "Corporativo TechCorp - Anual"

❌ MAL:
- "Evento1"
- "Boda"
- "Test"
```

### **3. Usa el Campo de Notas**
```
Ejemplo de notas útiles:
"""
Boda elegante, tema rosa y dorado
Ceremonia: 6pm | Recepción: 8pm
Imprimir: 200 tiras (estimado 100 sesiones)
Cliente quiere fotos extras para álbum
Contacto coordinadora: Laura 555-1234
"""
```

### **4. Duplica en Lugar de Crear Desde Cero**
- Si tienes un evento similar, duplícalo
- Cambia solo lo necesario (nombre, fecha, diseño)
- Ahorra tiempo y mantiene consistencia

---

## 🎬 **PRÓXIMOS PASOS**

Ahora que tienes el Sistema de Eventos funcionando:

### **TODO PENDIENTE:**
1. ✅ **Crear diálogo para crear/editar eventos** (con drag & drop)
2. ✅ **Agregar indicador de evento activo en UnifiedBoothScreen**
3. ⏳ **Agregar filtros/búsqueda en lista de eventos**
4. ⏳ **Estadísticas por evento** (fotos capturadas, sesiones, etc.)
5. ⏳ **Exportar/importar eventos** (para compartir entre equipos)

---

## 🐛 **TROUBLESHOOTING**

### **Problema: No puedo eliminar un evento**
**Solución:** 
- Solo puedes eliminar eventos **inactivos**
- No puedes eliminar el **evento base** (tiene badge ⭐)
- Activa otro evento primero, luego elimina

### **Problema: Mi diseño no se muestra**
**Solución:**
1. Verifica que el archivo sea `.png` o `.jpg`
2. Verifica que el tamaño sea razonable (<10MB)
3. Intenta arrastrar de nuevo el archivo

### **Problema: Los settings no cambian al activar**
**Solución:**
1. Verifica que el backend esté corriendo
2. Abre DevTools y busca errores
3. Reinicia la aplicación

---

## 📞 **SOPORTE**

¿Necesitas ayuda con el Sistema de Eventos?

1. **Revisa este documento primero**
2. **Verifica logs del backend:** `backend/logs/`
3. **Verifica DevTools** del navegador
4. **Contacta al desarrollador**

---

**¡Disfruta tu sistema profesional de gestión de eventos!** 🎉
