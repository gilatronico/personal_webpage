# Configuración de Google Calendar

## Estado Actual

El botón "Agendar una llamada" ahora redirige a Google Calendar en lugar de Calendly.

## Funcionamiento Actual

Cuando alguien hace clic en "Agendar una llamada":
1. Se abre Google Calendar en una nueva pestaña
2. Se crea un evento pre-rellenado con:
   - **Título**: "Consulta con Alejandro Gilabert"
   - **Fecha sugerida**: Mañana a las 10:00 AM (duración 1 hora)
   - **Detalles**: "Consulta desde landing page profesional"
   - **Ubicación**: "Online"

El usuario puede modificar la fecha/hora antes de guardar.

## Personalizar la Configuración

### Opción 1: Cambiar Fecha/Hora Sugerida

Edita la función `getNextAvailableDate()` en `index_professional.html`:

```javascript
function getNextAvailableDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);  // Cambia la hora aquí (10 = 10 AM)
    
    const endDate = new Date(tomorrow);
    endDate.setHours(11, 0, 0, 0);  // Duración: 1 hora
    
    // ... resto del código
}
```

### Opción 2: Usar Google Calendar Appointments (Recomendado)

Si tienes Google Workspace, puedes crear una página de reserva:

1. Ve a: https://calendar.google.com/calendar/appointments
2. Crea un nuevo horario de disponibilidad
3. Copia el enlace de la página de reserva
4. Reemplaza en `openCalendlyModal()`:

```javascript
function openCalendlyModal() {
    const calendarUrl = 'https://calendar.google.com/calendar/appointments/schedules/...';
    window.open(calendarUrl, '_blank', 'noopener,noreferrer');
}
```

### Opción 3: Enlace Directo a tu Calendario

Si prefieres que vean tu calendario directamente:

```javascript
function openCalendlyModal() {
    const calendarUrl = 'https://calendar.google.com/calendar/u/0/r';
    window.open(calendarUrl, '_blank', 'noopener,noreferrer');
}
```

## Ventajas de Google Calendar

- ✅ Gratis
- ✅ Integrado con Gmail
- ✅ Sincroniza automáticamente
- ✅ Notificaciones por email
- ✅ Funciona en todos los dispositivos

## Notas

- El modal de Calendly ha sido eliminado
- La función `openCalendlyModal()` ahora redirige a Google Calendar
- Se mantiene el nombre de la función por compatibilidad con el código existente
