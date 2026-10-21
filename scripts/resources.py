"""Validation et HTML des ressources, en amélioration progressive et sans dépendance."""
from datetime import date
from html import escape
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit
from resource_icons import ICONS, render_icon

RESOURCE_URL = 'https://charlesberthou.fr/ressources/'
RESOURCE_DESCRIPTION = 'Des usages réels de l’IA, du projet au résultat : courses, livre, énergie, mails et applications. Modes d’emploi et prompts de Charles Berthou.'
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


def validate_guide(guide, root):
    if not isinstance(guide, dict):
        raise ValueError('Le mode d’emploi doit être un objet')
    text(guide.get('result'), 'guide.result')
    if 'start' in guide:
        if not isinstance(guide['start'], dict):
            raise ValueError('Les prérequis doivent être un objet')
        for field in ('where', 'access'):
            text(guide['start'].get(field), 'guide.start.' + field)
    if 'extension' in guide:
        text(guide['extension'], 'guide.extension')
    if 'extension_title' in guide:
        text(guide['extension_title'], 'guide.extension_title')
        if 'extension' not in guide:
            raise ValueError('Le titre du prolongement doit accompagner son contenu')
    for field in ('preparation', 'checks'):
        values = items(guide.get(field), 'guide.' + field)
        if not values:
            raise ValueError(f'Le mode d’emploi doit préciser : {field}')
        for value in values:
            text(value, 'guide.' + field)
    for field, fields in (('tools', ('name', 'role')), ('steps', ('title', 'text'))):
        values = items(guide.get(field), 'guide.' + field)
        if not values:
            raise ValueError(f'Le mode d’emploi doit préciser : {field}')
        for value in values:
            if not isinstance(value, dict):
                raise ValueError(f'Objet attendu : guide.{field}')
            for name in fields:
                text(value.get(name), f'guide.{field}.{name}')
            if field == 'tools' and 'url' in value:
                resource_url(value['url'], root)


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
        kind = item.get('kind', 'usage')
        if kind not in ('usage', 'astuce'):
            raise ValueError(f'Type de ressource inconnu : {slug}')
        icon = item.get('icon')
        if icon is not None and (not isinstance(icon, str) or icon not in ICONS):
            raise ValueError(f'Pictogramme inconnu : {slug}')
        for field in ('title', 'summary'):
            text(item.get(field), field)
        if 'short_title' in item:
            text(item['short_title'], 'short_title')
        if 'experience' in item:
            text(item['experience'], 'experience')
        if kind == 'astuce':
            text(item.get('try_it'), 'try_it')
            if any(item.get(field) for field in ('paragraphs', 'prompts', 'tips', 'image', 'experience')) or 'guide' in item:
                raise ValueError(f'Une astuce contient son texte, « À essayer » et des liens facultatifs : {slug}')
        elif 'try_it' in item:
            raise ValueError(f'« À essayer » est réservé aux astuces : {slug}')
        if 'guide' in item:
            validate_guide(item['guide'], root)
            if not item.get('prompts'):
                raise ValueError(f'Un mode d’emploi doit proposer un prompt : {slug}')
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
        if not any(item.get(field) for field in ('paragraphs', 'prompts', 'tips', 'links', 'try_it')):
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


def render_start(guide, prefix):
    setup = guide.get('start')
    where = f'<p>{escape(setup["where"])}</p>' if setup else ''
    access = f'<p>{escape(setup["access"])}</p>' if setup else ''
    preparation = ''.join(f'<li>{escape(value)}</li>' for value in guide['preparation'])
    start = f'''<section class="guide-start" aria-labelledby="{prefix}-start"><h4 id="{prefix}-start">Pour démarrer</h4>
     {where}<ul id="{prefix}-prepare">{preparation}</ul></section>'''
    tools = ''
    for tool in guide['tools']:
        name = escape(tool['name'])
        if 'url' in tool:
            name = f'<a href="{escape(tool["url"])}">{name}</a>'
        tools += f'<div><dt>{name}</dt><dd>{escape(tool["role"])}</dd></div>'
    return start + f'<details class="guide-tools-disclosure" id="{prefix}-tools"><summary>Installation et accès</summary>{access}<dl class="guide-tools">{tools}</dl></details>'


def render_guide(guide, prefix):
    steps = ''.join(f'<li><h5>{escape(step["title"])}</h5><p>{escape(step["text"])}</p></li>' for step in guide['steps'])
    return f'<section class="guide-section" aria-labelledby="{prefix}-steps"><h4 id="{prefix}-steps">{render_icon("list", "section-icon")}Les étapes</h4><ol class="guide-steps">{steps}</ol></section>'


def render_links(links):
    if not links:
        return ''
    return '<ul class="resource-links" aria-label="Documents et liens utiles">' + ''.join(
        f'<li><a class="text-link" href="{escape(doc["url"])}">{escape(doc["label"])} <span aria-hidden="true">→</span></a></li>'
        for doc in links) + '</ul>'


def render_resource(item, asset):
    """Le texte fourni reste du texte : tout HTML est échappé à la génération."""
    prefix = 'resource-' + item['slug']
    heading = f'<h3 id="{prefix}-title"><a href="#{prefix}">{render_icon(item.get("icon"))}<span>{escape(item["title"])}</span></a></h3>'
    summary_anchor = f' id="{prefix}-experience"' if item.get('kind') != 'astuce' and not item.get('experience') else ''
    summary = f'<p class="resource-summary"{summary_anchor}>{escape(item["summary"])}</p>'
    if item.get('kind') == 'astuce':
        return f'''<article class="resource-entry resource-astuce" id="{prefix}" aria-labelledby="{prefix}-title">
   {heading}
   <div class="resource-copy">{summary}
    <p class="resource-try"><strong>À essayer :</strong> {escape(item['try_it'])}</p>{render_links(item.get('links'))}
   </div>
  </article>'''
    content = ''.join(f'<p>{escape(p)}</p>' for p in item.get('paragraphs', []))
    if experience := item.get('experience'):
        content += f'<section class="guide-experience" aria-labelledby="{prefix}-experience"><h4 id="{prefix}-experience">Ce que j’ai réalisé</h4><p>{escape(experience)}</p></section>'
    if guide := item.get('guide'):
        content += f'<p class="guide-result"><strong>À obtenir :</strong> {escape(guide["result"])}</p>'
    if image := item.get('image'):
        content += f'<figure class="resource-figure"><img src="{escape(asset(image["src"]))}" alt="{escape(image["alt"])}" width="{image["width"]}" height="{image["height"]}" loading="lazy" decoding="async"></figure>'
    for index, prompt in enumerate(item.get('prompts', []), 1):
        prompt_id = f'{prefix}-prompt-{index}'
        content += f'''<section class="resource-prompt" id="{prompt_id}" aria-labelledby="{prompt_id}-title">
      <h4 class="visually-hidden" id="{prompt_id}-title">{escape(prompt.get('title', 'Prompt à adapter'))}</h4>
      <button class="button button-copy" type="button" data-copy="{prompt_id}-text" aria-describedby="{prompt_id}-title" hidden>{render_icon('copy', 'action-icon')}Copier le prompt</button>
      <details class="prompt-disclosure"><summary><span class="when-closed">Lire le prompt</span><span class="when-open">Masquer le prompt</span><span class="visually-hidden"> : {escape(prompt.get('title', 'Prompt à adapter'))}</span></summary>
       <pre id="{prompt_id}-text" tabindex="0" aria-labelledby="{prompt_id}-title">{escape(prompt['text'])}</pre>
      </details>
      <p class="prompt-instruction">Collez ce texte dans ChatGPT ou votre assistant IA, puis répondez à ses questions.</p>
      <p class="copy-feedback" role="status" aria-live="polite" aria-atomic="true"></p>
     </section>'''
    if guide := item.get('guide'):
        content += render_start(guide, prefix)
        content += render_guide(guide, prefix)
    if guide := item.get('guide'):
        checks = ''.join(f'<li>{escape(value)}</li>' for value in guide['checks'])
        content += f'<section class="guide-section" aria-labelledby="{prefix}-checks"><h4 id="{prefix}-checks">{render_icon("check-circle", "section-icon")}Les points à vérifier</h4><ul>{checks}</ul></section>'
        if extension := guide.get('extension'):
            title = escape(guide.get('extension_title', 'Pour poursuivre'))
            content += f'<section class="guide-extension" aria-labelledby="{prefix}-extension"><h4 id="{prefix}-extension">{title}</h4><p>{escape(extension)}</p></section>'
    if tips := item.get('tips'):
        if len(tips) == 1:
            content += f'<p class="resource-tip"><strong>Mon conseil :</strong> {escape(tips[0])}</p>'
        else:
            content += '<section class="resource-tips"><h4>Mes conseils</h4><ul>'
            content += ''.join(f'<li>{escape(tip)}</li>' for tip in tips) + '</ul></section>'
    content += render_links(item.get('links'))
    label = 'Ouvrir le guide' if item.get('guide') else 'Voir le prompt' if len(item.get('prompts', [])) == 1 else 'Voir la méthode et les prompts' if item.get('prompts') else 'Lire la ressource'
    close_label = 'Refermer le guide' if item.get('guide') else 'Refermer la ressource'
    content += f'''<div class="guide-navigation">
     <button class="text-link guide-close" type="button" hidden>{close_label}</button>
     <a class="text-link" href="#choisir-usage">Choisir un autre usage</a>
    </div>'''
    return f'''<article class="resource-entry" id="{prefix}" aria-labelledby="{prefix}-title">
   {heading}
   <div class="resource-copy">{summary}</div>
   <details class="resource-details"><summary><span class="when-closed">{label}</span><span class="when-open">{close_label}</span><span class="visually-hidden"> : {escape(item['title'])}</span></summary>
    <div class="resource-body">{content}</div>
   </details>
  </article>'''


def render_collection(published, asset):
    if not published:
        return EMPTY_STATE
    groups = (
        ('usage', 'cas-usage', 'Modes d’emploi', ''),
        ('astuce', 'astuces', 'Astuces', 'Quelques habitudes pour mieux utiliser l’IA. Les fonctions disponibles varient selon le compte et l’appareil.'),
    )
    navigation, sections = [], []
    for kind, anchor, title, intro in groups:
        entries = [item for item in published if item.get('kind', 'usage') == kind]
        if not entries:
            continue
        if kind == 'usage':
            links = ''.join(f'<li><a href="#resource-{item["slug"]}">{escape(item.get("short_title", item["title"]))}</a></li>' for item in entries)
            tips_link = '<a class="text-link" href="#astuces">Astuces</a>' if any(item.get('kind') == 'astuce' for item in published) else ''
            navigation.append(f'<div class="resources-index" id="choisir-usage" tabindex="-1" aria-labelledby="usage-index-title"><div class="resources-index-heading"><h2 id="usage-index-title">Choisir un usage</h2>{tips_link}</div><ul>{links}</ul></div>')
        elif not any(item.get('kind', 'usage') == 'usage' for item in published):
            navigation.append(f'<a class="text-link" href="#{anchor}">{title}</a>')
        body = '\n'.join(render_resource(item, asset) for item in entries)
        heading = f'<header class="resource-group-heading"><h2 id="{anchor}-title">{title}</h2><p>{intro}</p></header>' if intro else f'<h2 class="visually-hidden" id="{anchor}-title">{title}</h2>'
        sections.append(f'''<section class="resource-group" id="{anchor}" aria-labelledby="{anchor}-title">
   {heading}
   {body}
  </section>''')
    return '<nav class="resources-nav" aria-label="Rubriques des ressources">' + ''.join(navigation) + '</nav>\n' + '\n'.join(sections)


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
                'genre': 'Astuce' if item.get('kind') == 'astuce' else 'Cas d’usage',
                'url': RESOURCE_URL + '#resource-' + item['slug'],
                'inLanguage': 'fr-FR', 'author': {'@type': 'Person', **author}}}
            for i, item in enumerate(published)]}
    return {'@context': 'https://schema.org', '@graph': [page, {
        '@type': 'BreadcrumbList', '@id': RESOURCE_URL + '#breadcrumb', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Le Passage IA', 'item': 'https://charlesberthou.fr/'},
            {'@type': 'ListItem', 'position': 2, 'name': 'Ressources', 'item': RESOURCE_URL}]}]}
