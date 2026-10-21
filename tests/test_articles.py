"""Intégrité des textes complets, navigation locale et métadonnées de lecture."""
from html import escape
import json
from pathlib import Path
import sys
import tempfile
import unittest
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import articles
import build
from test_site import Document


class ArticleTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.editions = json.loads((ROOT / 'content/editions.json').read_text())['editions']
        cls.outputs = build.build()

    def test_complete_body_sources_and_metadata_are_published(self):
        paths = {articles.path(e) for e in self.editions}
        for edition in self.editions:
            with self.subTest(article=edition['slug']):
                path = articles.path(edition)
                body = articles.load(edition, ROOT, paths)
                page = self.outputs[path.lstrip('/') + 'index.html']
                doc = Document(page)
                self.assertIn(body['html'], page)
                self.assertGreater(body['words'], 400)
                self.assertIn(body['text'], self.outputs['llms-full.txt'])
                self.assertIn(escape(edition['url']), page)
                self.assertNotIn('Recommandé par LinkedIn', page)
                self.assertFalse(any(tag == 'iframe' for tag, _ in doc.tags))
                self.assertIn(('link', {'rel': 'canonical', 'href': articles.SITE_URL + path}), doc.tags)
                self.assertIn(('meta', {'property': 'og:type', 'content': 'article'}), doc.tags)
                self.assertIn(('meta', {'property': 'og:image', 'content': articles.SITE_URL + edition['image']['src']}), doc.tags)
                data = json.loads(page.split('<script type="application/ld+json">', 1)[1].split('</script>', 1)[0])
                item = data['@graph'][0]
                self.assertEqual(item['headline'], edition['title'])
                self.assertEqual(item['datePublished'], edition['date'])
                self.assertEqual(item['sameAs'], edition['url'])
                self.assertEqual(item['mainEntityOfPage'], articles.SITE_URL + path)
                self.assertEqual(item['wordCount'], body['words'])

    def test_reading_stays_on_site_and_every_article_is_discoverable(self):
        archive = Document(self.outputs['articles/index.html'])
        home = Document(self.outputs['index.html'])
        sitemap = ET.fromstring(self.outputs['sitemap.xml'])
        urls = {element.text for element in sitemap.iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')}
        self.assertIn(articles.ARCHIVE_URL, urls)
        for e in self.editions:
            self.assertIn(articles.path(e), archive.links)
            self.assertIn(articles.path(e), home.links)
            self.assertIn(articles.SITE_URL + articles.path(e), urls)
        for path, page in self.outputs.items():
            if path == 'index.html' or path.startswith('articles/'):
                for tag, attrs in Document(page).tags:
                    if tag == 'a' and attrs.get('href', '').startswith('/articles/'):
                        self.assertNotIn('target', attrs)
        self.assertIn('href="/articles/humanite/"', self.outputs['articles/progres/index.html'])

    def test_article_loader_refuses_missing_text_and_active_content(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            folder = root / 'content/articles'
            folder.mkdir(parents=True)
            file = folder / 'test.html'
            edition = {'slug': 'test', 'body': 'articles/test.html'}
            for text in ('', '<script>alert(1)</script>', '<p onclick="x()">Texte</p>',
                         '<iframe src="https://example.com/"></iframe>', '<p><em>Texte</p>',
                         '<p><a href="javascript:alert(1)">Source</a></p>',
                         '<p><a href="//example.com/">Source</a></p>',
                         '<p><a href="/articles/inconnu/">Source</a></p>'):
                file.write_text(text)
                with self.subTest(text=text), self.assertRaises(ValueError):
                    articles.load(edition, root, {'/articles/test/'})
            file.write_text('<p>Un <em>texte</em> &amp; sa <a href="https://example.com/">source</a>.</p>')
            self.assertEqual(articles.load(edition, root, set())['text'], 'Un texte & sa source.')
            for body in ('../../secret.html', 'articles/absent.html', None):
                with self.subTest(body=body), self.assertRaises(ValueError):
                    articles.load({**edition, 'body': body}, root, set())


if __name__ == '__main__':
    unittest.main()
