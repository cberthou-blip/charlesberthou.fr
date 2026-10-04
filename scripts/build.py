#!/usr/bin/env python3
"""Génère les pages statiques à partir de content/editions.json, sans dépendance."""
import argparse
from datetime import date
from hashlib import sha256
from html import escape
import json
from pathlib import Path
import re
from string import Template
import sys
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
MONTHS = ('janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
          'août', 'septembre', 'octobre', 'novembre', 'décembre')
ARROW = '<span class="arrow" aria-hidden="true">↗</span>'
LEGACY = ('outils-ia', 'outils-ia/maturite-ia', 'outils-ia/cas-usage',
          'outils-ia/roi-ia', 'outils-ia/registre-ia', 'ressources', 'contact')


def linkedin_url(value):
    parsed = urlsplit(value)
    if parsed.scheme != 'https' or parsed.hostname not in ('www.linkedin.com', 'fr.linkedin.com', 'linkedin.com'):
        raise ValueError(f'Adresse LinkedIn HTTPS attendue : {value}')
    return value


def asset(path):
    if not path.startswith('/assets/passage/') or '..' in Path(path).parts:
        raise ValueError(f'Chemin d’image invalide : {path}')
    file = ROOT / path.lstrip('/')
    if not file.is_file():
        raise ValueError(f'Ressource absente : {path}')
    return path + '?v=' + sha256(file.read_bytes()).hexdigest()[:10]


def date_label(value):
    d = date.fromisoformat(value)
    return f'{d.day} {MONTHS[d.month - 1]} {d.year}'


def image_tag(edition, featured=False):
    image = edition['image']
    for key in ('width', 'height'):
        if not isinstance(image[key], int) or image[key] <= 0:
            raise ValueError(f'Dimension invalide : {edition["slug"]}')
    attrs = f'src="{escape(asset(image["src"]))}" width="{image["width"]}" height="{image["height"]}" alt="{escape(edition["alt"])}" decoding="async"'
    if featured:
        if image.get('srcset'):
            sources = []
            for source in image['srcset'].split(','):
                path, width = source.strip().split()
                if not re.fullmatch(r'\d+w', width):
                    raise ValueError('Descripteur srcset invalide')
                sources.append(asset(path) + ' ' + width)
            attrs += f' srcset="{escape(", ".join(sources))}" sizes="(max-width: 900px) 96vw, (max-width: 1100px) 54vw, 60vw"'
        attrs += ' fetchpriority="high"'
    else:
        attrs += ' loading="lazy"'
    return f'<img {attrs}>'


def link(url, text, classes='text-link', subscribe=False):
    description = 'external-note subscription-note' if subscribe else 'external-note'
    return f'<a class="{classes}" href="{escape(url)}" target="_blank" rel="noopener noreferrer" aria-describedby="{description}">{escape(text)} {ARROW}</a>'


def render_feature(e):
    return f'''<article class="feature">
   <a class="feature-link" href="{escape(e['url'])}" target="_blank" rel="noopener noreferrer" aria-labelledby="latest-title latest-read" aria-describedby="external-note">
    <div class="feature-image">{image_tag(e, True)}</div>
    <div class="feature-copy"><p class="eyebrow">{escape(e['theme'])}</p><h2 id="latest-title">{escape(e['title'])}</h2><p>{escape(e['summary'])}</p><span class="text-link" id="latest-read">Lire l’édition sur LinkedIn {ARROW}</span></div>
   </a>
  </article>'''


def render_card(e):
    prefix = 'edition-' + e['slug']
    return f'''<article class="edition">
  <a class="edition-link" href="{escape(e['url'])}" target="_blank" rel="noopener noreferrer" aria-labelledby="{prefix}-title {prefix}-read" aria-describedby="external-note">
   <div class="edition-image">{image_tag(e)}</div>
   <div class="edition-meta"><span>{escape(e['theme'])}</span><time datetime="{e['date']}">{date_label(e['date'])}</time></div>
   <h3 id="{prefix}-title">{escape(e['title'])}</h3>
   <p>{escape(e['summary'])}</p>
   <span class="read-link" id="{prefix}-read">Lire sur LinkedIn {ARROW}</span>
  </a>
 </article>'''


def build():
    data = json.loads((ROOT / 'content/editions.json').read_text(encoding='utf-8'))
    updated = date.fromisoformat(data['updated'])
    newsletter = linkedin_url(data['newsletter_url'])
    author = data['author']
    linkedin_url(author['url'])
    editions = data['editions']
    if not editions:
        raise ValueError('Au moins une édition est nécessaire')
    slugs = set()
    urls = set()
    for e in editions:
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', e['slug']) or e['slug'] in slugs:
            raise ValueError('Identifiant d’édition invalide ou dupliqué')
        slugs.add(e['slug'])
        linkedin_url(e['url'])
        if e['url'] in urls:
            raise ValueError('Adresse d’édition dupliquée')
        urls.add(e['url'])
        if date.fromisoformat(e['date']) > updated:
            raise ValueError('La date updated doit inclure la dernière édition')
        for field in ('title', 'theme', 'summary', 'alt'):
            if not isinstance(e[field], str) or not e[field].strip():
                raise ValueError(f'Champ {field} manquant dans {e["slug"]}')
        image_tag(e)
    editions = sorted(editions, key=lambda e: e['date'], reverse=True)
    visible = editions[:6]
    latest = visible[0]
    head = f'''<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#102f38">
<link rel="icon" type="image/svg+xml" href="/favicon.svg?v=passage-20261004">
<link rel="icon" type="image/png" href="/favicon.png?v=passage-20261004">
<link rel="preload" href="/assets/passage/libre-caslon-display.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{asset('/assets/passage/fonts.css')}">
<link rel="stylesheet" href="{asset('/assets/passage/site.css')}">'''
    schema = {
        '@context': 'https://schema.org', '@type': 'CollectionPage',
        'name': 'Le Passage IA | ' + author['name'], 'url': 'https://charlesberthou.fr/',
        'description': 'La newsletter de Charles Berthou sur l’intelligence artificielle, le travail et la société. Retrouvez les éditions du Passage IA sur LinkedIn.',
        'inLanguage': 'fr-FR', 'author': {'@type': 'Person', **author},
        'mainEntity': {'@type': 'ItemList', 'itemListElement': [
            {'@type': 'ListItem', 'position': i + 1, 'item': {
                '@type': 'Article', 'headline': e['title'], 'url': e['url'],
                'datePublished': e['date'], 'author': {'@type': 'Person', 'name': author['name']}}}
            for i, e in enumerate(visible)]}}
    page = Template((ROOT / 'templates/index.html').read_text(encoding='utf-8')).substitute(
        head=head, author_name=escape(author['name']), year=updated.year,
        schema=json.dumps(schema, ensure_ascii=False).replace('<', '\\u003c'),
        header_subscribe=link(newsletter, 'S’abonner sur LinkedIn', 'button button-small', True),
        latest_date=latest['date'], latest_date_label=date_label(latest['date']),
        feature=render_feature(latest), cards='\n'.join(map(render_card, visible[1:])),
        all_editions=link(newsletter, 'Toutes les éditions'),
        card_subscribe=link(newsletter, 'S’abonner sur LinkedIn', 'button button-light', True),
        author_link=link(author['url'], 'Retrouver l’auteur'),
        footer_subscribe=link(newsletter, 'S’abonner sur LinkedIn', subscribe=True),
        footer_author=link(author['url'], 'LinkedIn'))
    llms = f'''# Le Passage IA

> La newsletter de {author['name']} sur l’intelligence artificielle, le travail, les organisations et la société.

Ce site est le relais de la newsletter. Les articles et l’abonnement sont accessibles sur LinkedIn.

- [Newsletter Le Passage IA]({newsletter})
- [{author['name']}]({author['url']})
'''
    outputs = {
        'index.html': page,
        'llms.txt': llms,
        'llms-full.txt': llms + '\n## Éditions\n\n' + '\n'.join(f'- [{e["title"]}]({e["url"]}) ({e["date"]})' for e in editions) + '\n',
        'sitemap.xml': f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://charlesberthou.fr/</loc><lastmod>{updated.isoformat()}</lastmod></url></urlset>\n',
        '404.html': f'<!doctype html><html lang="fr"><head>{head}<title>Page introuvable | Le Passage IA</title><meta name="robots" content="noindex, follow"><script src="/assets/passage/redirect.js" defer></script></head><body><main class="return-page shell"><p class="eyebrow">Le Passage IA · 404</p><h1>Le chemin a changé.</h1><p>Cette page n’est plus disponible. Retrouvez les éditions du Passage IA sur la page d’accueil.</p><a class="button" href="/">Revenir à l’accueil <span aria-hidden="true">→</span></a></main></body></html>\n',
    }
    redirect = f'<!doctype html><html lang="fr"><head>{head}<title>Le Passage IA | {escape(author["name"])}</title><meta name="robots" content="noindex, follow"><link rel="canonical" href="https://charlesberthou.fr/"><meta http-equiv="refresh" content="0; url=/"></head><body><main class="return-page shell"><p class="eyebrow">Le Passage IA</p><h1>Retrouvez la newsletter.</h1><p><a class="text-link" href="/">Revenir à l’accueil <span aria-hidden="true">→</span></a></p></main></body></html>\n'
    for path in LEGACY:
        outputs[path + '/index.html'] = redirect
    return outputs


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Vérifie les pages sans les modifier')
    args = parser.parse_args()
    try:
        outputs = build()
        outdated = []
        for name, content in outputs.items():
            path = ROOT / name
            if args.check:
                if not path.is_file() or path.read_text(encoding='utf-8') != content:
                    outdated.append(name)
            else:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(content, encoding='utf-8')
        if outdated:
            print('À régénérer avec python3 scripts/build.py : ' + ', '.join(outdated), file=sys.stderr)
            return 1
        print(f'{len(outputs)} fichiers vérifiés' if args.check else f'{len(outputs)} fichiers générés')
        return 0
    except (ValueError, KeyError, OSError) as exc:
        print(f'Génération impossible : {exc}', file=sys.stderr)
        return 2


if __name__ == '__main__':
    raise SystemExit(main())
