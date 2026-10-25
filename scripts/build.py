#!/usr/bin/env python3
"""Génère le site statique à partir de content/, sans dépendance."""
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
import resources
import articles

ROOT = Path(__file__).resolve().parents[1]
MONTHS = ('janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
          'août', 'septembre', 'octobre', 'novembre', 'décembre')
ARROW = '<span class="arrow" aria-hidden="true">↗</span>'
INTERNAL_ARROW = '<span class="arrow" aria-hidden="true">→</span>'
LEGACY = ('outils-ia', 'outils-ia/maturite-ia', 'outils-ia/cas-usage',
          'outils-ia/roi-ia', 'outils-ia/registre-ia', 'contact')
REDIRECTS = {**{path: '/' for path in LEGACY}, 'outils-ia': '/ressources/',
             'outils-ia/cas-usage': '/ressources/', 'blog': '/articles/'}
AUTHOR_ID = articles.SITE_URL + '/#author'
WEBSITE_ID = articles.SITE_URL + '/#website'


def linkedin_url(value):
    parsed = urlsplit(value)
    if parsed.scheme != 'https' or parsed.hostname not in ('www.linkedin.com', 'fr.linkedin.com', 'linkedin.com'):
        raise ValueError(f'Adresse LinkedIn HTTPS attendue : {value}')
    return value


def asset(path):
    if not path.startswith(('/assets/passage/', '/assets/resources/')) or '..' in Path(path).parts:
        raise ValueError(f'Chemin d’image invalide : {path}')
    file = ROOT / path.lstrip('/')
    if not file.is_file():
        raise ValueError(f'Ressource absente : {path}')
    return path + '?v=' + sha256(file.read_bytes()).hexdigest()[:10]


def date_label(value):
    d = date.fromisoformat(value)
    return f'{d.day} {MONTHS[d.month - 1]} {d.year}'


def image_tag(edition, featured=False, article=False):
    image = edition['image']
    for key in ('width', 'height'):
        if not isinstance(image[key], int) or image[key] <= 0:
            raise ValueError(f'Dimension invalide : {edition["slug"]}')
    attrs = f'src="{escape(asset(image["src"]))}" width="{image["width"]}" height="{image["height"]}" alt="{escape(edition["alt"])}" decoding="async"'
    if image.get('srcset'):
        sources = []
        for source in image['srcset'].split(','):
            path, width = source.strip().split()
            if not re.fullmatch(r'\d+w', width):
                raise ValueError('Descripteur srcset invalide')
            sources.append(asset(path) + ' ' + width)
        if article:
            sizes = '(max-width: 480px) calc(100vw - 36px), (max-width: 760px) min(44rem, calc(100vw - 40px)), 44rem'
        elif featured:
            sizes = '(max-width: 480px) calc(100vw - 36px), (max-width: 760px) calc(100vw - 40px), (max-width: 900px) calc(100vw - 64px), (max-width: 1100px) calc((100vw - 64px) * 5 / 9), min(768px, calc((100vw - 112px) * .6))'
        else:
            sizes = '(max-width: 480px) calc(100vw - 36px), (max-width: 640px) calc(100vw - 40px), (max-width: 760px) calc((100vw - 60px) / 2), (max-width: 1100px) calc((100vw - 88px) / 2), min(407px, calc((100vw - 172px) / 3))'
        attrs += f' srcset="{escape(", ".join(sources))}" sizes="{sizes}"'
    if featured:
        attrs += ' fetchpriority="high"'
    else:
        attrs += ' loading="lazy"'
    return f'<img {attrs}>'


def link(url, text, classes='text-link'):
    return f'<a class="{classes}" href="{escape(url)}" target="_blank" rel="noopener noreferrer" aria-describedby="external-note">{escape(text)} {ARROW}</a>'


def render_feature(e):
    return f'''<article class="feature">
   <a class="feature-link" href="{articles.path(e)}" aria-labelledby="latest-title latest-read">
    <div class="feature-image">{image_tag(e, True)}</div>
    <div class="feature-copy"><p class="eyebrow">{escape(e['theme'])}</p><h2 id="latest-title">{escape(e['title'])}</h2><p>{escape(e['summary'])}</p><span class="text-link" id="latest-read">Lire l’article {INTERNAL_ARROW}</span></div>
   </a>
  </article>'''


def render_card(e, heading='h3'):
    prefix = 'edition-' + e['slug']
    return f'''<article class="edition">
  <a class="edition-link" href="{articles.path(e)}" aria-labelledby="{prefix}-title {prefix}-read">
   <div class="edition-image">{image_tag(e)}</div>
   <div class="edition-meta"><span>{escape(e['theme'])}</span><time datetime="{e['date']}">{date_label(e['date'])}</time></div>
   <{heading} id="{prefix}-title">{escape(e['title'])}</{heading}>
   <p>{escape(e['summary'])}</p>
   <span class="read-link" id="{prefix}-read">Lire l’article {INTERNAL_ARROW}</span>
  </a>
 </article>'''


def render_resources_feature(published):
    if not any(item.get('kind', 'usage') == 'usage' for item in published):
        return ''
    return '''<section class="home-resources shell" aria-labelledby="home-resources-title">
  <div class="home-resources-copy"><h2 id="home-resources-title">Des projets menés avec l’IA</h2>
   <p>Préparer un panier de courses, mener une enquête familiale, créer une application : mes expériences, avec les étapes, les outils et les prompts pour les adapter.</p></div>
  <a class="button" href="/ressources/">Explorer les ressources <span class="arrow" aria-hidden="true">→</span></a>
 </section>'''


def render_page(content, *, head, title, description, canonical, robots,
                author, newsletter, year, schema=None, scripts='', resource_page=False,
                article_section=None, edition=None):
    if schema is not None:
        graph = schema.get('@graph', [{key: value for key, value in schema.items() if key != '@context'}])
        for node in graph:
            if node.get('@type') in ('CollectionPage', 'WebPage'):
                node.setdefault('@id', canonical + '#page')
                node.setdefault('isPartOf', {'@id': WEBSITE_ID})
        graph += [
            {'@type': 'WebSite', '@id': WEBSITE_ID, 'url': articles.SITE_URL + '/',
             'name': 'Le Passage IA', 'inLanguage': 'fr-FR', 'publisher': {'@id': AUTHOR_ID}},
            {'@type': 'Person', '@id': AUTHOR_ID, **author, 'sameAs': [author['url']]},
        ]
        schema = {'@context': 'https://schema.org', '@graph': graph}
    structured = '' if schema is None else '<script type="application/ld+json">' + json.dumps(schema, ensure_ascii=False).replace('<', '\\u003c') + '</script>'
    return Template((ROOT / 'templates/page.html').read_text(encoding='utf-8')).substitute(
        head=head, title=escape(title), description=escape(description),
        canonical=escape(canonical), robots=robots, structured_data=structured,
        scripts=scripts, content=content, author_name=escape(author['name']), year=year,
        resources_current=' aria-current="page"' if resource_page else '',
        articles_current=' aria-current="' + article_section + '"' if article_section else '',
        og_type='article' if edition else 'website',
        share_image=escape(articles.SITE_URL + (edition['image']['src'] if edition else '/assets/passage/partage.jpg')),
        share_image_alt=escape(edition['alt'] if edition else 'Un passage entre l’histoire du travail et le monde numérique'),
        extra_meta=f'<meta property="article:published_time" content="{edition["date"]}">\n<meta property="article:modified_time" content="{edition["integrated"]}">\n<meta property="article:author" content="{escape(author["url"])}">' if edition else '',
        footer_subscribe=link(newsletter, 'S’abonner'))


def build():
    data = json.loads((ROOT / 'content/editions.json').read_text(encoding='utf-8'))
    updated = date.fromisoformat(data['updated'])
    resource_data = json.loads((ROOT / 'content/resources.json').read_text(encoding='utf-8'))
    resources_updated, published = resources.validate(resource_data, ROOT)
    site_updated = max(updated, resources_updated)
    newsletter = linkedin_url(data['newsletter_url'])
    author = {'@id': AUTHOR_ID, **data['author']}
    linkedin_url(author['url'])
    editions = data['editions']
    if not editions:
        raise ValueError('Au moins un article est nécessaire')
    slugs = set()
    urls = set()
    for e in editions:
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', e['slug']) or e['slug'] in slugs:
            raise ValueError('Identifiant d’article invalide ou dupliqué')
        slugs.add(e['slug'])
        linkedin_url(e['url'])
        if e['url'] in urls:
            raise ValueError('Adresse d’article dupliquée')
        urls.add(e['url'])
        if date.fromisoformat(e['date']) > updated:
            raise ValueError('La date updated doit inclure le dernier article')
        for field in ('title', 'theme', 'summary', 'alt'):
            if not isinstance(e[field], str) or not e[field].strip():
                raise ValueError(f'Champ {field} manquant dans {e["slug"]}')
        image_tag(e)
        if not date.fromisoformat(e['date']) <= date.fromisoformat(e['integrated']) <= updated:
            raise ValueError('Date d’intégration invalide : ' + e['slug'])
    editions = sorted(editions, key=lambda e: e['date'], reverse=True)
    internal_paths = {articles.path(e) for e in editions}
    bodies = {e['slug']: articles.load(e, ROOT, internal_paths) for e in editions}
    references = {e['slug']: articles.sources(e) for e in editions}
    visible = editions
    latest = visible[0]
    site_description = 'Des réflexions sur l’intelligence artificielle, le travail et la société, et des usages expliqués pas à pas. Articles et ressources de ' + author['name'] + '.'
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
        'description': site_description,
        'inLanguage': 'fr-FR', 'author': {'@type': 'Person', **author},
        'mainEntity': {'@type': 'ItemList', 'itemListElement': [
            {'@type': 'ListItem', 'position': i + 1, 'item': {
                '@type': 'Article', 'headline': e['title'], 'url': articles.SITE_URL + articles.path(e),
                'datePublished': e['date'], 'author': {'@type': 'Person', **author}}}
            for i, e in enumerate(visible)]}}
    if published:
        schema['hasPart'] = {'@type': 'CollectionPage', 'name': 'Ressources', 'url': resources.RESOURCE_URL}
    content = Template((ROOT / 'templates/index.html').read_text(encoding='utf-8')).substitute(
        latest_date=latest['date'], latest_date_label=date_label(latest['date']),
        feature=render_feature(latest), cards='\n'.join(map(render_card, visible[1:])),
        all_editions=f'<a class="text-link" href="/articles/">Tous les articles {INTERNAL_ARROW}</a>',
        resources_feature=render_resources_feature(published))
    common = dict(head=head, author=author, newsletter=newsletter, year=site_updated.year)
    resource_common = {**common, 'head': head + f'\n<link rel="stylesheet" href="{asset("/assets/passage/resources-layout.css")}">'}
    page = render_page(content, **common,
        title='Le Passage IA | ' + author['name'],
        description=site_description,
        canonical='https://charlesberthou.fr/', robots='index, follow, max-image-preview:large', schema=schema)
    resource_content = Template((ROOT / 'templates/resources.html').read_text(encoding='utf-8')).substitute(
        resources_content=resources.render_collection(published, asset))
    resource_page = render_page(resource_content, **resource_common,
        title='Ressources IA : modes d’emploi et prompts | Le Passage IA',
        description=resources.RESOURCE_DESCRIPTION if published else 'Les ressources du Passage IA sont en préparation : usages personnels de l’IA, prompts et conseils de Charles Berthou.',
        canonical=resources.RESOURCE_URL,
        robots='index, follow, max-image-preview:large' if published else 'noindex, follow',
        schema=resources.structured_data(published, author), resource_page=True,
        scripts=f'<script src="{asset("/assets/passage/resources-catalog.js")}" defer></script>' if published else '')
    guide_pages = {}
    usages = resources.ordered_usages(published)
    guide_template = Template((ROOT / 'templates/resource-guide.html').read_text(encoding='utf-8'))
    for i, item in enumerate(usages):
        following = usages[(i + 1) % len(usages)]
        url = resources.public_url(item)
        guide_content = guide_template.substitute(
            slug=item['slug'], guide_content=resources.render_resource(
                item, asset, standalone=True,
                byline=f'<p class="article-byline"><span>{escape(author["name"])}</span><span>Mis à jour le <time datetime="{resources_updated.isoformat()}">{date_label(resources_updated.isoformat())}</time></span></p>'),
            next_url=resources.path(following), next_title=escape(following.get('short_title', following['title'])))
        guide_schema = {'@context': 'https://schema.org', '@graph': [
            {'@type': 'CreativeWork', '@id': url + '#guide', 'url': url,
             'name': item['title'], 'description': item['summary'],
             'inLanguage': 'fr-FR', 'author': {'@type': 'Person', **author},
             'dateModified': resources_updated.isoformat(), 'mainEntityOfPage': url,
             'isPartOf': {'@type': 'CollectionPage', 'url': resources.RESOURCE_URL, 'name': 'Ressources'}},
            {'@type': 'BreadcrumbList', 'itemListElement': [
                {'@type': 'ListItem', 'position': 1, 'name': 'Accueil', 'item': articles.SITE_URL + '/'},
                {'@type': 'ListItem', 'position': 2, 'name': 'Ressources', 'item': resources.RESOURCE_URL},
                {'@type': 'ListItem', 'position': 3, 'name': item['title'], 'item': url}]}]}
        guide_pages[resources.path(item).lstrip('/') + 'index.html'] = render_page(
            guide_content, **resource_common, title=item['title'] + ' | Le Passage IA',
            description=item.get('meta_description', item['summary']), canonical=url,
            robots='index, follow, max-image-preview:large', schema=guide_schema, resource_page=True,
            scripts=f'<script src="{asset("/assets/passage/resources.js")}" defer></script>')
    archive_description = 'Tous les articles du Passage IA, par Charles Berthou : intelligence artificielle, travail, société, progrès et responsabilité.'
    archive_schema = {
        '@context': 'https://schema.org', '@type': 'CollectionPage',
        'name': 'Articles | Le Passage IA', 'url': articles.ARCHIVE_URL,
        'description': archive_description, 'inLanguage': 'fr-FR',
        'author': {'@type': 'Person', **author},
        'mainEntity': {'@type': 'ItemList', 'numberOfItems': len(editions), 'itemListElement': [
            {'@type': 'ListItem', 'position': i + 1, 'name': e['title'],
             'url': articles.SITE_URL + articles.path(e)} for i, e in enumerate(editions)]}}
    archive_content = Template((ROOT / 'templates/articles.html').read_text(encoding='utf-8')).substitute(
        cards='\n'.join(render_card(e, 'h2') for e in editions))
    archive_page = render_page(archive_content, **common, title='Articles | Le Passage IA',
        description=archive_description, canonical=articles.ARCHIVE_URL,
        robots='index, follow, max-image-preview:large', schema=archive_schema, article_section='page')
    article_pages = {}
    article_template = Template((ROOT / 'templates/article.html').read_text(encoding='utf-8'))
    for i, e in enumerate(editions):
        body = bodies[e['slug']]
        url = articles.SITE_URL + articles.path(e)
        next_edition = editions[(i + 1) % len(editions)]
        article_content = article_template.substitute(
            theme=escape(e['theme']), article_title=escape(e['title']), author_name=escape(author['name']),
            date=e['date'], date_label=date_label(e['date']), minutes=body['minutes'],
            modified=e['integrated'], modified_label=date_label(e['integrated']),
            summary=escape(e['summary']), image=image_tag(e, True, article=True), body=body['html'],
            references=references[e['slug']]['html'],
            source_link=link(e['url'], 'Publication d’origine sur LinkedIn'),
            next_url=articles.path(next_edition), next_title=escape(next_edition['title']))
        article_schema = {'@context': 'https://schema.org', '@graph': [
            {'@type': 'Article', '@id': url + '#article', 'url': url, 'mainEntityOfPage': url,
             'headline': e['title'], 'description': e['summary'], 'datePublished': e['date'],
             'dateModified': e['integrated'],
             'author': {'@type': 'Person', **author}, 'inLanguage': 'fr-FR',
             'image': articles.SITE_URL + e['image']['src'], 'wordCount': body['words'],
             'sameAs': e['url'], 'isPartOf': {'@type': 'CollectionPage', 'url': articles.ARCHIVE_URL, 'name': 'Le Passage IA'}},
            {'@type': 'BreadcrumbList', 'itemListElement': [
                {'@type': 'ListItem', 'position': 1, 'name': 'Accueil', 'item': articles.SITE_URL + '/'},
                {'@type': 'ListItem', 'position': 2, 'name': 'Articles', 'item': articles.ARCHIVE_URL},
                {'@type': 'ListItem', 'position': 3, 'name': e['title'], 'item': url}]}]}
        article_pages[articles.path(e).lstrip('/') + 'index.html'] = render_page(article_content, **common,
            title=e['title'] + ' | Le Passage IA', description=e['summary'], canonical=url,
            robots='index, follow, max-image-preview:large', schema=article_schema,
            article_section='location', edition=e)
    sitemap_entries = [('https://charlesberthou.fr/', site_updated), (articles.ARCHIVE_URL, updated)]
    sitemap_entries += [(articles.SITE_URL + articles.path(e), date.fromisoformat(e['integrated'])) for e in editions]
    if published:
        sitemap_entries.append((resources.RESOURCE_URL, resources_updated))
        sitemap_entries += [(resources.public_url(item), resources_updated) for item in usages]
    llms = f'''# Le Passage IA

> Les articles et les usages de l’IA de {author['name']}, sur le travail, les organisations, la société et le quotidien.

Les articles complets du Passage IA sont lisibles sur ce site. Ils sont également publiés sur LinkedIn, où l’abonnement à la newsletter est proposé.

- [Tous les articles]({articles.ARCHIVE_URL})
- [Newsletter Le Passage IA]({newsletter})
- [{author['name']}]({author['url']})
'''
    if published:
        llms += f'\n## Ressources\n\nDes modes d’emploi, outils, étapes et prompts issus de mes usages personnels de l’IA : [Ressources]({resources.RESOURCE_URL})\n'
    if published:
        llms += '\n' + '\n'.join(f'- [{item["title"]}]({resources.public_url(item)})' for item in usages) + '\n'
    llms += '\n## Texte intégral\n\n- [Articles, guides et prompts](' + articles.SITE_URL + '/llms-full.txt)\n'
    resources_full = ('\n## Ressources\n\nAuteur : ' + author['name'] + '\nMise à jour : '
                      + resources_updated.isoformat() + '\n\n' + '\n\n'.join(resources.render_text(item) for item in published) + '\n') if published else ''
    outputs = {
        'index.html': page,
        'articles/index.html': archive_page,
        **article_pages,
        'ressources/index.html': resource_page,
        **guide_pages,
        'llms.txt': llms,
        'llms-full.txt': llms + '\n## Articles\n\n' + '\n\n'.join(
            f'### {e["title"]}\n\nAuteur : {author["name"]}\nDate de publication : {e["date"]}\nMise à jour : {e["integrated"]}\nArticle : {articles.SITE_URL + articles.path(e)}\nPublication LinkedIn : {e["url"]}\n\n{bodies[e["slug"]]["text"]}{references[e["slug"]]["text"]}'
            for e in editions) + '\n' + resources_full,
        'sitemap.xml': '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + '\n'.join(f'  <url><loc>{url}</loc><lastmod>{modified.isoformat()}</lastmod></url>' for url, modified in sitemap_entries) + '\n</urlset>\n',
        '404.html': render_page('<main id="contenu" class="return-page shell" tabindex="-1"><p class="eyebrow">Le Passage IA · 404</p><h1>Le chemin a changé.</h1><p>Cette page n’est plus disponible. Retrouvez les articles et les ressources du Passage IA.</p><a class="button" href="/">Revenir à l’accueil <span aria-hidden="true">→</span></a></main>', **common,
            title='Page introuvable | Le Passage IA', description='Retrouvez les articles et les ressources du Passage IA.',
            canonical='https://charlesberthou.fr/404.html', robots='noindex, follow'),
    }
    for path, target in REDIRECTS.items():
        label = 'Retrouver les ressources' if target == '/ressources/' else 'Retrouver les articles' if target == '/articles/' else 'Revenir à l’accueil'
        redirect = f'<!doctype html><html lang="fr"><head>{head}<title>Page déplacée | Le Passage IA</title><meta name="robots" content="noindex, follow"><link rel="canonical" href="{articles.SITE_URL}{target}"><meta http-equiv="refresh" content="0; url={target}"></head><body><main class="return-page shell"><p class="eyebrow">Le Passage IA</p><h1>Le chemin a changé.</h1><p><a class="text-link" href="{target}">{label} <span aria-hidden="true">→</span></a></p></main></body></html>\n'
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
