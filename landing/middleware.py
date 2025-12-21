"""
Middleware para minificar CSS y JavaScript en producción
"""
import re
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings


class MinifyHTMLMiddleware(MiddlewareMixin):
    """
    Middleware que minifica CSS y JavaScript inline en el HTML
    Solo se activa en producción (DEBUG=False)
    """
    
    def process_response(self, request, response):
        # Solo minificar en producción y para respuestas HTML
        if settings.DEBUG or response.get('Content-Type', '').find('text/html') == -1:
            return response
        
        try:
            content = response.content.decode('utf-8')
            
            # Minificar CSS inline
            content = self._minify_css(content)
            
            # Minificar JavaScript inline
            content = self._minify_js(content)
            
            # Comprimir espacios en blanco adicionales
            content = re.sub(r'\s+', ' ', content)
            content = re.sub(r'>\s+<', '><', content)
            
            response.content = content.encode('utf-8')
            # Actualizar Content-Length
            response['Content-Length'] = str(len(response.content))
            
        except Exception:
            # Si hay algún error, devolver la respuesta sin modificar
            pass
        
        return response
    
    def _minify_css(self, html):
        """Minifica CSS dentro de etiquetas <style>"""
        try:
            from csscompressor import compress
        except ImportError:
            # Si no está instalado, usar minificación básica
            return self._basic_css_minify(html)
        
        def replace_style(match):
            css_content = match.group(1)
            try:
                minified = compress(css_content)
                return f'<style>{minified}</style>'
            except Exception:
                return match.group(0)
        
        pattern = r'<style[^>]*>(.*?)</style>'
        return re.sub(pattern, replace_style, html, flags=re.DOTALL)
    
    def _basic_css_minify(self, html):
        """Minificación básica de CSS sin librerías externas"""
        def replace_style(match):
            css = match.group(1)
            # Remover comentarios
            css = re.sub(r'/\*.*?\*/', '', css, flags=re.DOTALL)
            # Remover espacios innecesarios
            css = re.sub(r'\s+', ' ', css)
            css = re.sub(r'\s*{\s*', '{', css)
            css = re.sub(r'\s*}\s*', '}', css)
            css = re.sub(r'\s*:\s*', ':', css)
            css = re.sub(r'\s*;\s*', ';', css)
            css = re.sub(r'\s*,\s*', ',', css)
            return f'<style>{css}</style>'
        
        pattern = r'<style[^>]*>(.*?)</style>'
        return re.sub(pattern, replace_style, html, flags=re.DOTALL)
    
    def _minify_js(self, html):
        """Minifica JavaScript dentro de etiquetas <script> (excepto JSON-LD)"""
        try:
            from jsmin import jsmin
        except ImportError:
            # Si no está instalado, usar minificación básica
            return self._basic_js_minify(html)
        
        def replace_script(match):
            script_content = match.group(1)
            script_attrs = match.group(0).split('>')[0] + '>'
            
            # No minificar JSON-LD o scripts con type="application/ld+json"
            if 'application/ld+json' in script_attrs or 'application/json' in script_attrs:
                return match.group(0)
            
            try:
                minified = jsmin(script_content)
                return f'{script_attrs}{minified}</script>'
            except Exception:
                return match.group(0)
        
        pattern = r'<script[^>]*>(.*?)</script>'
        return re.sub(pattern, replace_script, html, flags=re.DOTALL)
    
    def _basic_js_minify(self, html):
        """Minificación básica de JavaScript sin librerías externas"""
        def replace_script(match):
            script_content = match.group(1)
            script_attrs = match.group(0).split('>')[0] + '>'
            
            # No minificar JSON-LD
            if 'application/ld+json' in script_attrs or 'application/json' in script_attrs:
                return match.group(0)
            
            # Remover comentarios de línea
            script_content = re.sub(r'//.*?$', '', script_content, flags=re.MULTILINE)
            # Remover comentarios de bloque
            script_content = re.sub(r'/\*.*?\*/', '', script_content, flags=re.DOTALL)
            # Remover espacios innecesarios
            script_content = re.sub(r'\s+', ' ', script_content)
            script_content = re.sub(r'\s*{\s*', '{', script_content)
            script_content = re.sub(r'\s*}\s*', '}', script_content)
            script_content = re.sub(r'\s*;\s*', ';', script_content)
            
            return f'{script_attrs}{script_content}</script>'
        
        pattern = r'<script[^>]*>(.*?)</script>'
        return re.sub(pattern, replace_script, html, flags=re.DOTALL)

