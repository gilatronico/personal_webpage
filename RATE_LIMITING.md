# Rate Limiting y Protección contra Spam

Este documento explica las medidas de seguridad implementadas para proteger el formulario de contacto contra spam y ataques.

## Medidas Implementadas

### 1. Rate Limiting con django-ratelimit

Se ha implementado rate limiting en múltiples niveles para prevenir abusos:

- **3 peticiones por minuto** por IP
- **5 peticiones por hora** por IP
- **10 peticiones por día** por IP

Estos límites se aplican automáticamente usando el decorador `@ratelimit` de django-ratelimit.

### 2. Protección Honeypot

Se ha agregado un campo oculto (honeypot) al formulario que:
- Está oculto visualmente para usuarios reales
- Si se rellena, indica que es un bot/spam
- Los bots suelen rellenar todos los campos automáticamente

### 3. Tiempo Mínimo entre Peticiones

Se implementa una validación adicional que requiere:
- **Mínimo 10 segundos** entre peticiones desde la misma IP
- Previene envíos rápidos consecutivos (burst attacks)

### 4. Logging de Seguridad

Todos los intentos bloqueados se registran en los logs:
- Intentos de spam (honeypot rellenado)
- Rate limits excedidos
- Peticiones demasiado rápidas
- Errores inesperados

## Configuración

### Límites Actuales

Los límites están configurados en `landing/views.py`:

```python
@ratelimit(key='ip', rate='3/m', method='POST', block=True)  # 3 peticiones por minuto
@ratelimit(key='ip', rate='5/h', method='POST', block=True)   # 5 peticiones por hora
@ratelimit(key='ip', rate='10/d', method='POST', block=True) # 10 peticiones por día
```

### Ajustar Límites

Si necesitas cambiar los límites, edita los decoradores en `landing/views.py`:

- `rate='3/m'` = 3 peticiones por minuto
- `rate='5/h'` = 5 peticiones por hora
- `rate='10/d'` = 10 peticiones por día

Puedes ajustar estos valores según tus necesidades.

## Respuestas del Servidor

### Rate Limit Excedido (429)

Cuando se excede el rate limit, el servidor responde con:

```json
{
    "success": false,
    "error": "Has enviado demasiados mensajes. Por favor, espera un momento antes de intentar de nuevo.",
    "rate_limited": true
}
```

Status code: `429 Too Many Requests`

### Tiempo Mínimo No Cumplido (429)

Si se intenta enviar muy rápido:

```json
{
    "success": false,
    "error": "Por favor, espera unos segundos antes de enviar otro mensaje.",
    "retry_after": 5
}
```

Status code: `429 Too Many Requests`

## Frontend

El frontend maneja automáticamente los errores 429 y muestra un mensaje apropiado al usuario usando el modal de error personalizado.

## Logs

Los logs se guardan en:
- **Consola**: Durante desarrollo (DEBUG=True)
- **Archivo**: `logs/django.log` (en producción)

Para ver los logs en tiempo real:

```bash
tail -f logs/django.log
```

## Best Practices Seguidas

✅ **Rate limiting por IP**: Previene abusos desde una misma dirección
✅ **Múltiples niveles**: Protección a corto, medio y largo plazo
✅ **Honeypot**: Protección adicional contra bots
✅ **Tiempo mínimo**: Previene ataques de ráfaga
✅ **Logging**: Registro de todos los intentos bloqueados
✅ **Mensajes claros**: El usuario sabe qué ha pasado y qué hacer
✅ **No bloquea usuarios legítimos**: Los límites son razonables

## Instalación

El rate limiting requiere `django-ratelimit` que ya está en `requirements.txt`:

```bash
pip install -r requirements.txt
```

## Verificación

Para verificar que funciona:

1. Envía un mensaje normalmente (debe funcionar)
2. Intenta enviar 4 mensajes en menos de 1 minuto (el 4º debe ser bloqueado)
3. Revisa los logs para ver los intentos bloqueados

## Notas de Producción

- En producción, considera usar Redis o Memcached para el cache (más eficiente)
- Los límites actuales son conservadores y pueden ajustarse según el tráfico real
- Considera agregar CAPTCHA si el spam persiste
- Monitorea los logs regularmente para detectar patrones de ataque
