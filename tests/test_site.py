"""Contrôles de publication et d’intégrité. python3 -m unittest discover -s tests"""
import copy
from html.parser import HTMLParser
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import build
import resources


class Document(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.ids = []
        self.links = []
        self.references = []
        self.headings = []
        self.tags = []
        self.prompts = []
        self._prompt = None
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags.append((tag, attrs))
        if tag == 'pre':
            self._prompt = ''
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        if tag in ('h1', 'h2', 'h3', 'h4', 'h5'):
            self.headings.append(tag)
        if tag == 'a':
            self.links.append(attrs.get('href', ''))
        for attr in ('aria-labelledby', 'aria-describedby'):
            self.references.extend(attrs.get(attr, '').split())

    def handle_data(self, data):
        if self._prompt is not None:
            self._prompt += data

    def handle_endtag(self, tag):
        if tag == 'pre' and self._prompt is not None:
            self.prompts.append(self._prompt)
            self._prompt = None


class ResourcesTest(unittest.TestCase):
    def setUp(self):
        self.item = {
            'slug': 'exemple', 'published': True, 'title': 'Exemple de recette technique',
            'summary': 'Contenu de test uniquement',
            'paragraphs': ['Une méthode documentée'],
            'prompts': [{'title': 'Prompt de test', 'text': 'Une ligne\nUne autre ligne'}],
        }

    def data(self, *items):
        return {'updated': '2026-10-21', 'resources': list(items)}

    def test_drafts_are_excluded(self):
        draft = {'slug': 'brouillon', 'published': False}
        self.assertEqual(resources.validate(self.data(draft), ROOT)[1], [])
        self.assertEqual(resources.validate(self.data({'slug': 'sans-publication'}), ROOT)[1], [])

    def test_publication_requires_real_content(self):
        item = {k: v for k, v in self.item.items() if k not in ('paragraphs', 'prompts')}
        with self.assertRaises(ValueError):
            resources.validate(self.data(item), ROOT)

    def test_duplicate_anchors_are_rejected(self):
        with self.assertRaises(ValueError):
            resources.validate(self.data(self.item, self.item), ROOT)

    def test_executable_and_missing_links_are_rejected(self):
        for url in ('javascript:alert(1)', '//example.com', 'data:text/html,test',
                    '/assets/resources/%2e%2e/secret', '/assets/resources/absent.pdf'):
            with self.subTest(url=url), self.assertRaises(ValueError):
                resources.resource_url(url, ROOT)
        self.assertEqual(resources.resource_url('https://example.com/doc.pdf', ROOT), 'https://example.com/doc.pdf')

    def test_local_documents_must_exist(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            folder = root / 'assets/resources'
            folder.mkdir(parents=True)
            (folder / 'guide.txt').write_text('Document de test')
            self.assertEqual(resources.resource_url('/assets/resources/guide.txt', root), '/assets/resources/guide.txt')

    def test_text_is_escaped_and_prompt_line_breaks_survive(self):
        item = copy.deepcopy(self.item)
        item['prompts'][0]['text'] = '<script>alert("test")</script>\nDeuxième ligne & suite'
        html = resources.render_resource(item, lambda path: path)
        self.assertNotIn('<script>', html)
        self.assertIn('&lt;script&gt;', html)
        self.assertIn('\nDeuxième ligne &amp; suite', html)
        self.assertIn('<details class="resource-details">', html)
        self.assertIn(' hidden>', html)

    def test_unknown_kinds_and_icons_are_rejected(self):
        for field, value in (('kind', 'autre'), ('icon', 'absent'), ('icon', '<svg onload="alert(1)">')):
            with self.subTest(field=field, value=value), self.assertRaises(ValueError):
                resources.validate(self.data({**self.item, field: value}), ROOT)

    def guide(self):
        return {
            'result': 'Un résultat à vérifier', 'preparation': ['Un document'],
            'tools': [{'name': 'Outil', 'role': 'Lire le document', 'url': 'https://example.com/'}],
            'steps': [{'title': 'Première étape', 'text': 'Contrôler la source'}],
            'checks': ['Le résultat correspond à la source'],
        }

    def test_guides_reject_incomplete_instructions_and_unsafe_links(self):
        base = self.guide()
        invalid = [None, {}, {**base, 'steps': []}, {**base, 'preparation': []},
                   {**base, 'checks': ['']}, {**base, 'tools': [{'name': 'Outil'}]},
                   {**base, 'start': None}, {**base, 'start': {'where': 'Ici'}},
                   {**base, 'extension': ''},
                   {**base, 'steps': [{'title': 'Étape', 'text': 12}]},
                   {**base, 'tools': [{'name': 'Outil', 'role': 'Lire', 'url': 'javascript:alert(1)'}]}]
        for guide in invalid:
            with self.subTest(guide=guide), self.assertRaises(ValueError):
                resources.validate(self.data({**self.item, 'guide': guide}), ROOT)
        with self.assertRaises(ValueError):
            resources.validate(self.data({**self.item, 'guide': base, 'prompts': []}), ROOT)

    def test_guide_text_is_escaped_and_readable_without_javascript(self):
        guide = self.guide()
        guide['steps'][0]['text'] = '<script>alert(1)</script> & source'
        guide['tools'][0]['name'] = '<img src=x onerror=alert(1)>'
        guide['start'] = {'where': '<script>ici</script>', 'access': 'Compte & documents'}
        guide['extension'] = '<img src=x> & suite'
        item = {**self.item, 'guide': guide}
        resources.validate(self.data(item), ROOT)
        html = resources.render_resource(item, lambda path: path)
        self.assertNotIn('<script>', html)
        self.assertNotIn('<img', html)
        self.assertIn('&lt;script&gt;alert(1)&lt;/script&gt; &amp; source', html)
        self.assertIn('Ouvrir le guide', html)
        self.assertIn('<ol class="guide-steps">', html)
        self.assertIn('&lt;script&gt;ici&lt;/script&gt;', html)
        self.assertIn('&lt;img src=x&gt; &amp; suite', html)
        doc = Document(html)
        self.assertTrue(set(doc.references) <= set(doc.ids))
        self.assertTrue(all(href[1:] in doc.ids for href in doc.links if href.startswith('#') and href != '#choisir-usage'))

    def test_astuce_is_visible_and_escaped_without_a_disclosure(self):
        item = {'slug': 'conseil', 'published': True, 'kind': 'astuce', 'icon': 'mic',
                'title': 'Dicter', 'summary': 'Un conseil bref',
                'try_it': 'Explique <script>ce besoin</script> & précise les contraintes',
                'links': [{'label': 'Aide <officielle>', 'url': 'https://example.com/?a=1&b=2'}]}
        resources.validate(self.data(item), ROOT)
        html = resources.render_resource(item, lambda path: path)
        self.assertNotIn('<details', html)
        self.assertNotIn('<script>', html)
        self.assertIn('&lt;script&gt;ce besoin&lt;/script&gt; &amp;', html)
        self.assertIn('aria-hidden="true"', html)
        self.assertIn('Aide &lt;officielle&gt;', html)
        self.assertIn('href="https://example.com/?a=1&amp;b=2"', html)
        for invalid in ({**item, 'try_it': ''}, {**item, 'prompts': self.item['prompts']},
                        {**item, 'guide': self.guide()},
                        {**item, 'links': [{'label': 'Lien', 'url': 'javascript:alert(1)'}]}):
            with self.assertRaises(ValueError):
                resources.validate(self.data(invalid), ROOT)

    def test_editorial_release_is_complete_and_text_only(self):
        data = json.loads((ROOT / 'content/resources.json').read_text())
        _, published = resources.validate(data, ROOT)
        usages = [item for item in published if item['kind'] == 'usage']
        astuces = [item for item in published if item['kind'] == 'astuce']
        self.assertEqual((len(usages), len(astuces)), (10, 7))
        self.assertTrue(all(len(item['prompts']) == 1 and len(item['tips']) == 1 for item in usages))
        self.assertTrue(all(item['guide']['steps'] and item['guide']['checks'] for item in usages))
        self.assertTrue(all(item['short_title'] and item['guide']['start']['where']
                            and item['guide']['start']['access'] for item in usages))
        page = build.build()['ressources/index.html']
        doc = Document(page)
        self.assertEqual(doc.prompts, [item['prompts'][0]['text'] for item in usages])
        self.assertEqual(len([tag for tag, attrs in doc.tags if tag == 'details' and attrs.get('class') == 'resource-details']), 10)
        self.assertEqual(len([tag for tag, attrs in doc.tags if tag == 'details' and attrs.get('class') == 'prompt-disclosure']), 10)
        self.assertEqual(len([tag for tag, attrs in doc.tags if tag == 'ol' and attrs.get('class') == 'guide-steps']), 10)
        self.assertEqual(len([tag for tag, _ in doc.tags if tag == 'article']), 17)
        self.assertEqual(len([tag for tag, attrs in doc.tags if tag == 'svg' and attrs.get('class') == 'resource-icon']), 17)
        self.assertTrue(all(attrs.get('aria-hidden') == 'true' and attrs.get('focusable') == 'false'
                            for tag, attrs in doc.tags if tag == 'svg'))
        self.assertFalse(any(tag in ('img', 'video', 'audio', 'iframe') for tag, _ in doc.tags))
        self.assertTrue(all('open' not in attrs for tag, attrs in doc.tags if tag == 'details'))
        self.assertEqual(len([id for id in doc.ids if id in {'resource-' + item['slug'] for item in published}]), 17)
        self.assertIn('cas-usage', doc.ids)
        self.assertIn('#choisir-usage', doc.links)
        self.assertIn('#astuces', doc.links)
        self.assertIn('tabindex="-1" aria-labelledby="usage-index-title"', page)
        self.assertFalse(any(tag == 'details' and attrs.get('id') == 'choisir-usage' for tag, attrs in doc.tags))
        for internal in ('État interne', 'Résultat final visé', 'Précision interne', 'Mission pour Work'):
            self.assertNotIn(internal, page)

    def test_publication_controls_indexing_and_machine_readable_content(self):
        # Le générateur réel travaille sur une source temporaire, jamais sur le contenu publié.
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for name in ('templates', 'assets'):
                (root / name).symlink_to(ROOT / name, target_is_directory=True)
            (root / 'content').mkdir()
            (root / 'content/editions.json').write_bytes((ROOT / 'content/editions.json').read_bytes())
            source = root / 'content/resources.json'
            with patch.object(build, 'ROOT', root):
                source.write_text(json.dumps(self.data()), encoding='utf-8')
                empty = build.build()
                self.assertIn('content="noindex, follow"', empty['ressources/index.html'])
                self.assertNotIn(resources.RESOURCE_URL, empty['sitemap.xml'])
                self.assertNotIn('resources.js', empty['ressources/index.html'])
                self.assertNotIn('http-equiv="refresh"', empty['ressources/index.html'])
                source.write_text(json.dumps(self.data(self.item)), encoding='utf-8')
                populated = build.build()
                page = populated['ressources/index.html']
                self.assertIn('content="index, follow, max-image-preview:large"', page)
                self.assertIn(resources.RESOURCE_URL, populated['sitemap.xml'])
                self.assertIn('#resource-exemple', populated['llms-full.txt'])
                self.assertIn('resources.js', page)
                self.assertNotIn('Les premières ressources', page)
                self.assertIn('"numberOfItems": 1', page)
                self.assertIn('"@type": "CreativeWork"', page)
                doc = Document(page)
                self.assertEqual(len(doc.ids), len(set(doc.ids)))
                self.assertTrue(set(doc.references) <= set(doc.ids))

    def test_navigation_and_accessibility_references(self):
        outputs = build.build()
        documents = {path: Document(outputs[path]) for path in ('index.html', 'ressources/index.html', '404.html')}
        for path, doc in documents.items():
            with self.subTest(page=path):
                self.assertEqual(doc.headings.count('h1'), 1)
                self.assertEqual(len(doc.ids), len(set(doc.ids)))
                self.assertTrue(set(doc.references) <= set(doc.ids))
                self.assertIn('/ressources/', doc.links)
                for href in doc.links:
                    if href.startswith('/#'):
                        self.assertIn(href[2:], documents['index.html'].ids)
                    elif href.startswith('#'):
                        self.assertIn(href[1:], doc.ids)


if __name__ == '__main__':
    unittest.main()
