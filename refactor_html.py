import re
import os

filepath = 'landing/templates/landing/index_2026.html'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove the giant <style> tags in the head
content = re.sub(r'<style>.*?</style>', '', content, flags=re.DOTALL)

# 2. Add the custom stylesheet link before </head>
new_css_link = """
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=Inter:wght@400;500;600&family=Newsreader:opsz,wght@6..72,200..700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{% static 'css/styles_2026.css' %}">
"""
content = content.replace('</head>', f'{new_css_link}</head>')

# Ensure {% load static %} is near top
if '{% load static %}' not in content:
    content = content.replace('<!DOCTYPE html>', '{% load static %}\n<!DOCTYPE html>')

# 3. Add grain overlay and island nav inside <body>
# Hide old navbar in css
body_insert = """<div class="grain-overlay"></div>
<nav class="island-nav">
  <a href="#home">Home</a>
  <a href="#producto">Experience</a>
  <a href="#articles">Articles</a>
  <button id="ask-alex-trigger" class="ask-alex-trigger">AI</button>
</nav>
"""
# Find the opening body tag (might have class names)
content = re.sub(r'(<body[^>]*>)', r'\1\n' + body_insert, content)

# 4. Map sections to bento-articles
# Mapping rules:
mapping = {
    'id="home"': 'id="home" class="bento-card card-hero"',
    'id="producto"': 'id="producto" class="bento-card span-12"',
    'id="crypto-prices"': 'id="crypto-prices" class="bento-card span-12"',
    'id="skills"': 'id="skills" class="bento-card span-4"',
    'id="teaching"': 'id="teaching" class="bento-card span-8"',
    'id="articles"': 'id="articles" class="bento-card span-12"',
    'id="market-intelligence"': 'id="market-intelligence" class="bento-card span-12"'
}

# The regex replaces `<section id="X" ...>` with `<article id="X" class="...">`
for search_id, replace_str in mapping.items():
    # Match <section ... id="X" ...> or <section id="X" ...>
    pattern = r'<section\s+(?:[^>]*\s+)?' + search_id + r'(?:[^>]*)>'
    
    def replacer(match):
        return f'<article {replace_str}>'
        
    content = re.sub(pattern, replacer, content)

# Also we need to replace closing </section> with </article>. This is trickier if there are nested <section>s.
# But looking at index_professional.html, sections were top-level.
# Actually, it's safer to just replace all </section> with </article> only if they belong to these wrappers.
# Easiest way: just replace </section> with </article> globally since the whole site uses "sections" as top wrappers.
content = content.replace('</section>', '</article>')
content = content.replace('<section ', '<article ') # Catch any unmapped sections

# 5. Wrap the top-level articles in <main class="bento-grid">
# Find the first article
first_article_idx = content.find('<article id="home"')
if first_article_idx == -1:
    first_article_idx = content.find('<article ')
    
# Find the footer
footer_idx = content.find('<footer')

if first_article_idx != -1 and footer_idx != -1:
    before = content[:first_article_idx]
    middle = content[first_article_idx:footer_idx]
    after = content[footer_idx:]
    
    content = before + '\n<main class="bento-grid">\n' + middle + '\n</main>\n' + after

# 6. Add Ask Alex modal and JS script before </body>
end_body_insert = """
<div id="ask-alex-modal" class="ask-alex-modal">
  <div class="ask-alex-header">
    <span>Ask Alex (AI)</span>
    <span id="ask-alex-close" class="ask-alex-close">✖</span>
  </div>
  <div class="ask-alex-content">
    > Initializing context...<br/>
    > Alex is a Product Engineer...<br/>
    > How can I help you?
  </div>
</div>
<script src="{% static 'js/main_2026.js' %}"></script>
"""
content = content.replace('</body>', f'{end_body_insert}\n</body>')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Refactor completed for {filepath}")
