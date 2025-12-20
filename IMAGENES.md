# Gestión de Imágenes

Este documento lista todas las imágenes utilizadas en el proyecto y su ubicación.

## Ubicación de Imágenes

Todas las imágenes están almacenadas en: `static/images/`

## Imágenes Utilizadas

### Imágenes Principales
- `corporativa copia 2.png` - Imagen principal del hero/background
- `spain.png` - Bandera de España (selector de idioma)
- `uk.png` - Bandera del Reino Unido (selector de idioma)

### Redes Sociales
- `linkedin.jpg` - Icono de LinkedIn
- `twitter 2.png` - Icono de Twitter/X
- `github.png` - Icono de GitHub

### Criptomonedas
- `bitcoin.png` - Logo de Bitcoin
- `eth.png` - Logo de Ethereum
- `solana.png` - Logo de Solana
- `monero.png` - Logo de Monero
- `bnb.png` - Logo de Binance Coin
- `xrp.png` - Logo de Ripple/XRP

### Logos de Enseñanza
- `teaching/cedeu-logo.png` - Logo de CEDEU
- `teaching/santander-logo.png` - Logo de Santander FI
- `teaching/medusa-logo.png` - Logo de Medusa Capital

### Otras Imágenes
- `Bitcoin.svg` - Versión SVG del logo de Bitcoin
- `astrovinilo.png` - Imagen adicional
- `toma3.jpg` - Imagen adicional
- `twitter.png` - Versión alternativa del icono de Twitter

## Rutas en el Código

### En Templates (HTML)
Las imágenes se referencian usando el tag `{% static %}`:
```django
{% static 'images/nombre-imagen.png' %}
```

### En JavaScript
Se usa la variable global `STATIC_IMAGES_URL`:
```javascript
const STATIC_IMAGES_URL = '{% static "images/" %}';
const imagePath = STATIC_IMAGES_URL + 'bitcoin.png';
```

### En CSS
Las imágenes en CSS también usan `{% static %}`:
```css
background-image: url('{% static "images/corporativa copia 2.png" %}');
```

## Copiar Nuevas Imágenes

Para agregar nuevas imágenes:

1. Copiar la imagen a `static/images/`
2. Si es una subcarpeta (como `teaching/`), mantener la estructura
3. Actualizar las referencias en el código usando `{% static %}` o `STATIC_IMAGES_URL`

## Verificación

Para verificar que todas las imágenes están presentes:
```bash
find static/images -type f | wc -l
```
