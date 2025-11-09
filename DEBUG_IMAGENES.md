# 🔍 DEBUG: IMÁGENES NO SE VEN EN GALLERY

## 🧪 PASOS PARA DEBUGGEAR

### **1. Abre la consola del navegador**
```bash
1. npm start
2. Abre Chrome DevTools (F12)
3. Ve a la tab Console
4. Abre Gallery (click en StaffDock)
```

### **2. Revisa los logs**

Busca estos mensajes en la consola:
```javascript
📸 Gallery API Response: {...}
📸 Total photos: 24
📸 First photo: {...}
📸 Constructed URL: http://127.0.0.1:8000/uploads/...
```

### **3. Verifica el formato de URL**

**Formato CORRECTO:**
```javascript
{
  url: "/uploads/20251109/photo_20251109_090504.jpg"
}
// Construido: http://127.0.0.1:8000/uploads/20251109/photo_20251109_090504.jpg
```

**Formato INCORRECTO:**
```javascript
{
  url: "http://127.0.0.1:8000/uploads/..."  // ❌ Ya incluye dominio
}
// Construido: http://127.0.0.1:8000http://127.0.0.1:8000/... ← DUPLICADO
```

### **4. Prueba URLs manualmente**

Copia una URL de la consola y pégala directamente en el navegador:
```
http://127.0.0.1:8000/uploads/20251109/photo_20251109_090504.jpg
```

Si la imagen se ve → Backend OK, problema en frontend  
Si la imagen NO se ve → Problema en backend

---

## 🔧 SOLUCIONES SEGÚN EL PROBLEMA

### **Problema 1: URL ya incluye dominio**

**Síntoma:**
```javascript
photo.url = "http://127.0.0.1:8000/uploads/..."
```

**Solución:**
```typescript
// En GalleryScreen.tsx, línea ~261:
<img
  src={photo.url}  // ← Quitar ${API_BASE_URL}
  alt={photo.filename}
/>
```

---

### **Problema 2: CORS bloqueado**

**Síntoma en consola:**
```
Access to image at 'http://127.0.0.1:8000/...' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**Solución Backend:**
```python
# En backend/app/main.py:
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### **Problema 3: Archivos no existen**

**Síntoma:**
```
404 Not Found
```

**Verificación:**
```bash
# Verifica que existan los archivos:
ls -la backend/data/uploads/

# Debería mostrar:
20251109/
  photo_20251109_090504.jpg
  photo_20251109_090512.jpg
  ...
```

**Solución:**
Si no existen, hay problema en el endpoint de captura.

---

### **Problema 4: Backend no sirve archivos estáticos**

**Síntoma:**
URL correcta pero 404

**Verificación Backend:**
```python
# En backend/app/main.py, verifica:
from fastapi.staticfiles import StaticFiles

app.mount("/uploads", StaticFiles(directory="data/uploads"), name="uploads")
```

---

## 🚀 SOLUCIÓN RÁPIDA (SI TODO FALLA)

Si después de debuggear no funciona, usa esta solución temporal:

```typescript
// En GalleryScreen.tsx:
<img
  src={photo.url.startsWith('http') ? photo.url : `${API_BASE_URL}${photo.url}`}
  alt={photo.filename}
  onError={(e) => {
    console.error('❌ Failed to load:', photo.url);
    e.currentTarget.src = 'data:image/svg+xml,...'; // Placeholder
  }}
/>
```

---

## 📋 CHECKLIST DE DEBUG

```
[ ] 1. Abrir consola Chrome DevTools
[ ] 2. Ver logs "📸 Gallery API Response"
[ ] 3. Copiar URL construida
[ ] 4. Pegar URL en navegador
[ ] 5. ¿Se ve la imagen?
    [ ] SÍ → Problema en frontend (URL duplicada?)
    [ ] NO → Problema en backend (archivos/CORS?)
[ ] 6. Verificar formato de photo.url
[ ] 7. Verificar CORS en backend
[ ] 8. Verificar archivos existen en disco
```

---

## 💬 COMPARTE LOS RESULTADOS

Después de debuggear, comparte:
1. Logs de consola
2. URL construida
3. Si la URL funciona al pegarla en navegador
4. Cualquier error de CORS

Con eso puedo darte la solución exacta! 🎯
