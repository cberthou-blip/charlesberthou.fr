"""Validation et HTML des ressources, en amélioration progressive et sans dépendance."""
from datetime import date
from html import escape
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit

RESOURCE_URL = 'https://charlesberthou.fr/ressources/'
RESOURCE_DESCRIPTION = 'Les ressources du Passage IA : usages personnels de l’intelligence artificielle, prompts à adapter et conseils de Charles Berthou.'
EMPTY_STATE = '''<section class="resources-empty" aria-labelledby="resources-empty-title">
   <p class="eyebrow">Prochainement</p>
   <h2 id="resources-empty-title">Les premières ressources<br>sont en préparation.</h2>
   <p>Je partagerai ici mes expériences, accompagnées des prompts et des conseils pour les reproduire.</p>
   <a class="text-link" href="/#editions">Découvrir les articles <span class="arrow" aria-hidden="true">→</span></a>
  </section>'''


def text(value, field):
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f'Texte de ressource manquant ou invalide : {field}')
    return value


def items(value, field):
    if not isinstance(value, list):
        raise ValueError(f'Liste attendue : {field}')
    return value


def resource_url(value, root):
    """Accepte HTTPS ou un document local existant, jamais une URL exécutable."""
    text(value, 'url')
    parsed = urlsplit(value)
    if any(char.isspace() or ord(char) < 32 for char in value):
        raise ValueError('L’adresse de ressource contient un espace ou caractère de contrôle')
    if parsed.scheme == 'https' and parsed.hostname and not parsed.username and not parsed.password:
        return value
    path = Path(unquote(parsed.path))
    if (not parsed.scheme and not parsed.netloc and value.startswith('/assets/resources/')
            and '..' not in path.parts and '\\' not in str(path)):
        file = (root / str(path).lstrip('/')).resolve()
        if file.is_relative_to((root / 'assets/resources').resolve()) and file.is_file():
            return value
    raise ValueError(f'Adresse de ressource invalide ou fichier absent : {value}')


def validate(data, root):
    updated = date.fromisoformat(data['updated'])
    seen = set()
    published = []
    for item in items(data['resources'], 'resources'):
        if not isinstance(item, dict):
            raise ValueError('Chaque ressource doit être un objet')
        slug = text(item.get('slug'), 'slug')
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', slug) or slug in seen:
            raise ValueError('Identifiant de ressource invalide ou dupliqué')
        seen.add(slug)
        if type(item.get('published', False)) is not bool:
            raise ValueError(f'published doit être un booléen : {slug}')
        if not item.get('published', False):
            continue
        for field in ('title', 'summary'):
            text(item.get(field), field)
        for field in ('paragraphs', 'tips'):
            for value in items(item.get(field, []), field):
                text(value, field)
        for prompt in items(item.get('prompts', []), 'prompts'):
            if not isinstance(prompt, dict):
                raise ValueError('Chaque prompt doit être un objet')
            text(prompt.get('title', 'Prompt à adapter'), 'prompt.title')
            text(prompt.get('text'), 'prompt.text')
        for doc in items(item.get('links', []), 'links'):
            if not isinstance(doc, dict):
                raise ValueError('Chaque lien doit être un objet')
            text(doc.get('label'), 'link.label')
            resource_url(doc.get('url'), root)
        if not any(item.get(field) for field in ('paragraphs', 'prompts', 'tips', 'links')):
            raise ValueError(f'Une ressource publiée doit avoir du contenu : {slug}')
        if image := item.get('image'):
            if not isinstance(image, dict):
                raise ValueError('L’illustration doit être un objet')
            text(image.get('alt'), 'image.alt')
            if not image.get('src', '').startswith('/assets/resources/'):
                raise ValueError('Les illustrations doivent être locales : /assets/resources/')
            resource_url(image['src'], root)
            for field in ('width', 'height'):
                if type(image.get(field)) is not int or image[field] <= 0:
                    raise ValueError(f'Dimension d’illustration invalide : {slug}')
        published.append(item)
    return updated, published


def render_resource(item, asset):
    """Le texte fourni reste du texte : tout HTML est échappé à la génération."""
    prefix = 'resource-' + item['slug']
    content = ''.join(f'<p>{escape(p)}</p>' for p in item.get('paragraphs', []))
    if image := item.get('image'):
        content += f'<figure class="resource-figure"><img src="{escape(asset(image["src"]))}" alt="{escape(image["alt"])}" width="{image["width"]}" height="{image["height"]}" loading="lazy" decoding="async"></figure>'
    for index, prompt in enumerate(item.get('prompts', []), 1):
        prompt_id = f'{prefix}-prompt-{index}'
        content += f'''<section class="resource-prompt" aria-labelledby="{prompt_id}-title">
      <div class="prompt-heading"><h3 id="{prompt_id}-title">{escape(prompt.get('title', 'Prompt à adapter'))}</h3>
       <button class="button button-copy" type="button" data-copy="{prompt_id}" aria-describedby="{prompt_id}-title" hidden>Copier le prompt</button></div>
      <pre id="{prompt_id}" tabindex="0" aria-labelledby="{prompt_id}-title">{escape(prompt['text'])}</pre>
      <p class="copy-feedback" role="status" aria-live="polite" aria-atomic="true"></p>
     </section>'''
    if tips := item.get('tips'):
        content += '<section class="resource-tips"><h3>Conseils pratiques</h3><ul>'
        content += ''.join(f'<li>{escape(tip)}</li>' for tip in tips) + '</ul></section>'
    if links := item.get('links'):
        content += '<ul class="resource-links" aria-label="Documents et liens utiles">'
        content += ''.join(f'<li><a class="text-link" href="{escape(doc["url"])}">{escape(doc["label"])} <span aria-hidden="true">→</span></a></li>' for doc in links) + '</ul>'
    label = 'Voir la méthode et les prompts' if item.get('prompts') else 'Lire la ressource'
    return f'''<article class="resource-entry" id="{prefix}" aria-labelledby="{prefix}-title">
   <h2 id="{prefix}-title"><a href="#{prefix}">{escape(item['title'])}</a></h2>
   <p class="resource-summary">{escape(item['summary'])}</p>
   <details><summary>{label}<span class="visually-hidden"> : {escape(item['title'])}</span></summary>
    <div class="resource-body">{content}</div>
   </details>
  </article>'''


def structured_data(published, author):
    page = {
        '@type': 'CollectionPage' if published else 'WebPage',
        '@id': RESOURCE_URL + '#page', 'url': RESOURCE_URL,
        'name': 'Ressources | Le Passage IA',
        'description': RESOURCE_DESCRIPTION if published else 'Les ressources du Passage IA sont en préparation.',
        'inLanguage': 'fr-FR', 'author': {'@type': 'Person', **author},
        'isPartOf': {'@type': 'WebSite', '@id': 'https://charlesberthou.fr/#website',
                     'name': 'Le Passage IA', 'url': 'https://charlesberthou.fr/'},
        'breadcrumb': {'@id': RESOURCE_URL + '#breadcrumb'},
    }
    if published:
        page['mainEntity'] = {'@type': 'ItemList', 'numberOfItems': len(published), 'itemListElement': [
            {'@type': 'ListItem', 'position': i + 1, 'item': {
                '@type': 'CreativeWork', 'name': item['title'], 'description': item['summary'],
                'url': RESOURCE_URL + '#resource-' + item['slug'],
                'inLanguage': 'fr-FR', 'author': {'@type': 'Person', **author}}}
            for i, item in enumerate(published)]}
    return {'@context': 'https://schema.org', '@graph': [page, {
        '@type': 'BreadcrumbList', '@id': RESOURCE_URL + '#breadcrumb', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Le Passage IA', 'item': 'https://charlesberthou.fr/'},
            {'@type': 'ListItem', 'position': 2, 'name': 'Ressources', 'item': RESOURCE_URL}]}]}
