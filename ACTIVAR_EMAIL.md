# 🚀 Activar Emails Reales con Gmail - Guía Rápida

## ⚡ Pasos Rápidos

### 1. Generar Contraseña de Aplicación

1. Ve a: https://myaccount.google.com/apppasswords
   - O: Google Account → Seguridad → Contraseñas de aplicaciones

2. Si te pide iniciar sesión, hazlo

3. Selecciona:
   - **App**: Correo
   - **Dispositivo**: Otro (nombre personalizado) → "Django Landing"
   - Clic en **"Generar"**

4. **Copia la contraseña de 16 caracteres** (ejemplo: `abcd efgh ijkl mnop`)

### 2. Configurar en Django

1. Abre `landing_project/settings.py`

2. Busca esta línea (alrededor de la línea 130):
   ```python
   EMAIL_HOST_PASSWORD = 'TU_CONTRASEÑA_DE_APLICACION_AQUI'
   ```

3. Reemplázala con tu contraseña:
   ```python
   EMAIL_HOST_PASSWORD = 'abcd efgh ijkl mnop'  # Tu contraseña de 16 caracteres
   ```

### 3. Probar la Configuración

Ejecuta el script de prueba:
```bash
python test_email.py
```

Si todo está bien, recibirás un email de prueba en `agilabertcomunicaciones@gmail.com`

### 4. Listo! 🎉

Ahora cada vez que alguien envíe el formulario de contacto:
- ✅ Se guarda en la base de datos
- ✅ Recibes un email en `agilabertcomunicaciones@gmail.com`

## 📋 Checklist

- [ ] Verificación en 2 pasos activada en Google
- [ ] Contraseña de aplicación generada (16 caracteres)
- [ ] Contraseña configurada en `settings.py`
- [ ] Script de prueba ejecutado exitosamente
- [ ] Email de prueba recibido

## 🔍 Ver Emails Recibidos

1. Ve a Django Admin: `http://127.0.0.1:8000/admin/`
2. Inicia sesión con tu usuario admin
3. Ve a **"Landing"** → **"Consultas de contacto"**
4. Verás todas las peticiones guardadas

## ⚠️ Importante

- La contraseña de aplicación es diferente a tu contraseña de Gmail
- Solo se muestra una vez al generarla
- Si la pierdes, genera una nueva
- No compartas esta contraseña públicamente

## 📚 Documentación Completa

Para más detalles, revisa:
- `GENERAR_PASSWORD_GMAIL.md` - Guía detallada paso a paso
- `CONFIGURAR_EMAIL.md` - Configuración avanzada y otros proveedores
