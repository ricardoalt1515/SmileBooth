# 📁 Data Directory Structure

Esta carpeta contiene todos los datos generados por la aplicación de photobooth.

## 📂 Estructura de Carpetas

```
data/
├── photos/          # 📸 Fotos capturadas (NO se versionan en Git)
├── strips/          # 🎞️  Tiras de fotos generadas (NO se versionan en Git)
├── temp/            # 🗑️  Archivos temporales (NO se versionan en Git)
├── designs/         # 🎨 Diseños y templates
│   ├── custom/      # Diseños legacy (NO se versionan)
│   └── template_assets/  # Diseños de templates (NO se versionan)
├── presets.json     # ⚙️  Configuración de eventos (SÍ se versiona)
└── config/
    └── settings.json # ⚙️  Configuración global (SÍ se versiona)
```

## 🚫 Archivos Ignorados por Git

Los siguientes archivos **NO se suben a Git** para mantener el repositorio limpio:

- `photos/` - Fotos capturadas durante sesiones
- `strips/` - Tiras de fotos procesadas
- `temp/` - Archivos temporales
- `designs/template_assets/` - Diseños subidos por usuarios
- `designs/custom/` - Diseños legacy

## ✅ Archivos Versionados

Los siguientes archivos **SÍ se versionan** para mantener la configuración base:

- `presets.json` - Eventos y configuraciones de eventos
- `designs/templates.json` - Definición de templates
- `config/settings.json` - Configuración global de la aplicación
- `.gitkeep` - Archivos vacíos para mantener la estructura de carpetas

## 📝 Notas

- Las carpetas vacías se mantienen con archivos `.gitkeep`
- Los archivos de configuración (JSON) se versionan para tener una base funcional
- Las imágenes generadas por la aplicación NO se versionan para evitar que el repositorio crezca innecesariamente
