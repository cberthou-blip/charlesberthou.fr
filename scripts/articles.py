"""Lecture et validation des textes éditoriaux, sans contenu tiers embarqué."""
from html import escape
from html.parser import HTMLParser
from math import ceil
from urllib.parse import urlsplit

SITE_URL = 'https://charlesberthou.fr'
ARCHIVE_URL = SITE_URL + '/articles/'


def path(edition):
    return '/articles/' + edition['slug'] + '/'


def sources(edition):
    references = edition.get('sources', [])
    if not isinstance(references, list):
        raise ValueError('Liste de sources attendue : ' + edition['slug'])
    items = []
    text = []
    seen = set()
    for source in references:
        if not isinstance(source, dict) or any(
                not isinstance(source.get(key), str) or not source[key].strip()
                for key in ('title', 'url', 'note')):
            raise ValueError('Source incomplète : ' + edition['slug'])
        href = source['url']
        url = urlsplit(href)
        if (url.scheme != 'https' or not url.hostname or url.username or url.password
                or any(c.isspace() for c in href) or href in seen):
            raise ValueError('Adresse de source invalide ou dupliquée : ' + href)
        seen.add(href)
        items.append(f'<li><a href="{escape(href)}">{escape(source["title"])}</a>'
                     f'<span>{escape(source["note"])}</span></li>')
        text.append(f'- [{source["title"]}]({href}) : {source["note"]}')
    if not items:
        return {'html': '', 'text': ''}
    return {
        'html': '<details class="article-references"><summary>Sources et repères</summary>\n<ul>\n'
                + '\n'.join(items) + '\n</ul>\n</details>',
        'text': '\n\nSources et repères\n\n' + '\n'.join(text),
    }


class ArticleBody(HTMLParser):
    TAGS = {'p', 'h2', 'h3', 'blockquote', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'br', 'hr'}
    BLOCKS = {'p', 'h2', 'h3', 'blockquote', 'ul', 'ol', 'li', 'hr'}

    def __init__(self, internal_paths):
        super().__init__()
        self.internal_paths = internal_paths
        self.stack = []
        self.text = []

    def handle_starttag(self, tag, attrs):
        if tag not in self.TAGS or any(name != 'href' or tag != 'a' for name, _ in attrs):
            raise ValueError('Balise ou attribut interdit dans le texte : ' + tag)
        if tag == 'a':
            if len(attrs) != 1 or not attrs[0][1]:
                raise ValueError('Lien incomplet dans le texte')
            href = attrs[0][1]
            url = urlsplit(href)
            if href not in self.internal_paths and not (
                    url.scheme == 'https' and url.hostname and not url.username
                    and not url.password and not any(c.isspace() for c in href)):
                raise ValueError('Lien invalide dans le texte : ' + href)
        if tag in self.BLOCKS:
            self.text.append('\n\n')
        if tag == 'br':
            self.text.append('\n')
        if tag not in ('br', 'hr'):
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if not self.stack or self.stack.pop() != tag:
            raise ValueError('Balises déséquilibrées dans le texte')
        if tag in self.BLOCKS:
            self.text.append('\n\n')

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in ('br', 'hr'):
            self.handle_endtag(tag)

    def handle_data(self, text):
        self.text.append(text)

    def handle_comment(self, data):
        raise ValueError('Commentaire inattendu dans le texte')

    def handle_decl(self, decl):
        raise ValueError('Déclaration inattendue dans le texte')


def load(edition, root, internal_paths):
    expected = 'articles/' + edition['slug'] + '.html'
    if edition.get('body') != expected:
        raise ValueError('Corps complet attendu dans content/' + expected)
    folder = (root / 'content/articles').resolve()
    source = (root / 'content' / expected).resolve()
    if source.parent != folder:
        raise ValueError('Chemin de texte invalide')
    html = source.read_text(encoding='utf-8')
    parser = ArticleBody(internal_paths)
    parser.feed(html)
    parser.close()
    paragraphs = [' '.join(p.split()) for p in ''.join(parser.text).split('\n\n') if p.strip()]
    text = '\n\n'.join(paragraphs)
    if parser.stack or not text:
        raise ValueError('Texte vide ou incomplet : ' + edition['slug'])
    words = len(text.split())
    return {'html': html, 'text': text, 'words': words, 'minutes': max(1, ceil(words / 220))}
