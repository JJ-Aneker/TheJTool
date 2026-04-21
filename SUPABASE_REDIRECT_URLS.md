# Supabase Redirect URLs Configuration

## Donde Configurar

**Supabase Dashboard** → Authentication → URL Configuration

---

## URLs a Agregar

### 1. **Desarrollo Local**
```
http://127.0.0.1:5500/
http://localhost:5500/
```

### 2. **Producción (Vercel)**
```
https://the-j-tool.vercel.app/
```

---

## Pasos en Supabase Dashboard

1. **Abre**: [https://app.supabase.com](https://app.supabase.com)
2. **Selecciona tu proyecto**
3. **Ve a**: Authentication → URL Configuration (izquierda)
4. **En "Site URL"**: 
   - Desarrollo: `http://127.0.0.1:5500`
   - Producción: `https://the-j-tool.vercel.app`
5. **En "Redirect URLs"** → Agregar estas (una por línea):
   ```
   http://127.0.0.1:5500
   http://localhost:5500
   https://the-j-tool.vercel.app
   ```

---

## Variables de Entorno

El código detecta automáticamente la URL base:
- **En desarrollo**: `http://127.0.0.1:5500`
- **En producción**: `https://the-j-tool.vercel.app`

No necesitas cambiar nada en el código - se ajusta solo.

---

## Testing

**Después de configurar en Supabase:**

1. **Local**: Login en `http://127.0.0.1:5500/login.html` → debe redirigir a home
2. **Vercel**: Login en `https://the-j-tool.vercel.app/login.html` → debe redirigir a home

Si ves errores de redirect, verifica que las URLs estén exactas en Supabase (sin trailing slash extra).

---

## Notas Importantes

⚠️ **Site URL** es la URL principal donde vive tu app
⚠️ **Redirect URLs** son direcciones adonde puede regresar después de OAuth
⚠️ Deben coincidir exactamente (protocolo, dominio, puerto)
