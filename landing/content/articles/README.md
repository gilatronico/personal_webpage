# Artículos

Un fichero `.md` por artículo. El nombre del fichero es la URL: `mi-articulo.md` → `/articulos/mi-articulo/`.

Cabecera obligatoria entre `---`:

| Campo | Ejemplo |
|---|---|
| `title` / `title_en` | Título en ES / EN |
| `date` | `2025-12` (año-mes) o `2025-12-04` |
| `tag` / `tag_en` | Etiqueta corta |
| `linkedin` | URL del original |
| `draft` | `true` mientras no tenga el texto completo |
| `excerpt` | Resumen de 1-3 frases |

Con `draft: true` la home enlaza al original de LinkedIn y la página interna solo se ve en local.
