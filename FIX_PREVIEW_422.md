# 🔧 FIX - Error 422 en Preview Strip

**Fecha:** 8 Nov 2025, 11:15 PM  
**Error:** `POST /api/image/preview-strip 422 (Unprocessable Content)`  
**Causa:** Schema requería `session_id` obligatorio

---

## 🐛 PROBLEMA IDENTIFICADO

```
Error: 422 Unprocessable Content
Endpoint: POST /api/image/preview-strip
```

### **Causa Raíz:**
```python
# backend/app/schemas/image.py
class ComposeStripRequest(BaseModel):
    photo_paths: list[str]
    design_path: str | None = None
    session_id: str  # ❌ REQUERIDO - causaba el error
```

El endpoint `/preview-strip` usa el mismo schema que `/compose-strip`, pero **no envía `session_id`** porque es un preview temporal.

---

## ✅ SOLUCIÓN APLICADA

### **1. Schema Actualizado:**
```python
# backend/app/schemas/image.py
class ComposeStripRequest(BaseModel):
    photo_paths: list[str]
    design_path: str | None = None
    session_id: str | None = None  # ✅ OPCIONAL
```

### **2. Logging Agregado:**

**Backend:**
```python
# backend/app/api/image.py
print(f"📸 Preview request: {request.photo_paths}")
print(f"🎨 Design: {request.design_path}")
print(f"✅ {len(photo_paths)} fotos encontradas")
```

**Frontend:**
```typescript
// frontend-new/src/screens/UnifiedBoothScreen.tsx
console.log('🎬 Generando preview del strip...');
console.log('📸 Photo paths:', photoPaths);
console.log('🎨 Diseño activo:', designPath);
console.log('🚀 Llamando API preview-strip...');
console.log('✅ Preview generado:', previewUrl);
```

### **3. Validación Mejorada:**
```python
# Validar que las fotos existan
if not abs_path.exists():
    raise HTTPException(
        status_code=404,
        detail=f"Foto no encontrada: {abs_path}"
    )
```

---

## 🧪 TESTING

### **Pasos para probar:**
```bash
# 1. Reiniciar backend
cd backend
python -m uvicorn app.main:app --reload

# 2. Reiniciar frontend
cd frontend-new
npm run dev

# 3. Capturar 3 fotos
# 4. Ver logs en consola
# 5. Verificar que aparece preview final
```

### **Logs Esperados:**

**Frontend:**
```
🎬 Generando preview del strip...
📸 Photo paths: ['/data/photos/.../photo1.jpg', ...]
🎨 Diseño activo: /data/designs/custom/design_xxx.png
🚀 Llamando API preview-strip...
✅ Preview generado: blob:http://localhost:5173/xxx
```

**Backend:**
```
📸 Preview request: ['/data/photos/.../photo1.jpg', ...]
🎨 Design: /data/designs/custom/design_xxx.png
✅ 3 fotos encontradas
```

---

## 📁 ARCHIVOS MODIFICADOS

```
✅ backend/app/schemas/image.py
   - session_id ahora es opcional

✅ backend/app/api/image.py
   - Logging agregado
   - Validación de existencia de fotos

✅ frontend-new/src/screens/UnifiedBoothScreen.tsx
   - Logging detallado en generateStripPreview
```

---

## 🎯 RESULTADO ESPERADO

```
Carousel Foto 3 
  ↓
Preview Final (5s)
  - Muestra strip completo
  - "¡Listo! 🎉"
  - "Recoge con el staff"
  - Countdown 5s
  ↓
Processing
```

---

## ⚠️ SI AÚN FALLA

**Revisar:**
1. ¿Backend reiniciado? (cambios en schema requieren restart)
2. ¿photoPaths tiene valores? (ver console.log)
3. ¿Las fotos existen en disco?
4. ¿Error 404 o 422?
   - 404 = Foto no encontrada
   - 422 = Schema inválido (no debería pasar ya)

**Comando para ver logs backend:**
```bash
cd backend
python -m uvicorn app.main:app --reload --log-level debug
```

---

## ✅ FIX APLICADO

**Estado:** Listo para testing  
**Próximo paso:** Reiniciar backend y probar captura
