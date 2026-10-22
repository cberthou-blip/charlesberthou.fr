"""Contrôles de publication : indexabilité, liens, métadonnées et versions texte."""
from datetime import date
from html import escape
import json
from pathlib import Path
import re
import sys
import unittest
from urllib.parse import unquote, urljoin, urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import build
import resources
from test_site import Document


class SEOTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.outputs = build.build()
        cls.documents = {path: Document(html) for path, html in cls.outputs.items() if path.endswith('.html')}

    def test_sitemap_exactly_matches_unique_indexable_canonicals(self):
        indexable, titles, descriptions = set(), [], []
        for path, doc in self.documents.items():
            metadata = {a['name']: a.get('content', '') for tag, a in doc.tags if tag == 'meta' and 'name' in a}
            canonical = [a['href'] for tag, a in doc.tags if tag == 'link' and a.get('rel') == 'canonical']
            self.assertEqual(len(canonical), 1, path)
            if 'noindex' in metadata['robots']:
                continue
            url = 'https://charlesberthou.fr/' + path.removesuffix('index.html')
            self.assertEqual(canonical, [url])
            indexable.add(url)
            titles.append(re.search(r'<title>(.*?)</title>', self.outputs[path]).group(1))
            descriptions.append(metadata['description'])
            self.assertTrue(metadata['description'].strip(), path)
        sitemap = ET.fromstring(self.outputs['sitemap.xml'])
        entries = {entry.find('{*}loc').text:entry.find('{*}lastmod').text for entry in sitemap}
        self.assertEqual(set(entries), indexable)
        self.assertEqual(len(titles), len(set(titles)))
        self.assertEqual(len(descriptions), len(set(descriptions)))
        for modified in entries.values():
            self.assertLessEqual(date.fromisoformat(modified), date.today())

    def test_local_links_assets_and_fragments_resolve(self):
        for path, doc in self.documents.items():
            origin = 'https://charlesberthou.fr/' + path
            for tag, attrs in doc.tags:
                value = attrs.get('href') if tag in ('a','link') else attrs.get('src') if tag in ('img','script') else None
                if not value:
                    continue
                url = urlsplit(urljoin(origin, value))
                if url.hostname != 'charlesberthou.fr':
                    continue
                target = unquote(url.path).lstrip('/')
                if not target or target.endswith('/'):
                    target += 'index.html'
                self.assertTrue(target in self.outputs or (ROOT / target).is_file(), (path, value))
                if url.fragment and target in self.documents:
                    self.assertIn(unquote(url.fragment), self.documents[target].ids, (path, value))

    def test_structured_author_website_and_visible_modified_dates(self):
        for path, page in self.outputs.items():
            match = re.search(r'<script type="application/ld\+json">(.*?)</script>', page)
            if not match:
                continue
            graph = json.loads(match.group(1))['@graph']
            website = next(node for node in graph if node['@type'] == 'WebSite')
            person = next(node for node in graph if node['@type'] == 'Person')
            self.assertEqual(website['@id'], build.WEBSITE_ID)
            self.assertEqual(website['publisher']['@id'], person['@id'])
            self.assertEqual(person['@id'], build.AUTHOR_ID)
            self.assertEqual(person['name'], 'Charles Berthou')
            for node in graph:
                if node.get('@type') in ('Article', 'CreativeWork'):
                    self.assertIn('datetime="' + node['dateModified'] + '"', page, path)
                    self.assertEqual(node['author']['@id'], person['@id'])

    def test_text_export_preserves_every_prompt_and_guide_step(self):
        source = json.loads((ROOT / 'content/resources.json').read_text(encoding='utf-8'))
        _, published = resources.validate(source, ROOT)
        full = self.outputs['llms-full.txt']
        for item in published:
            self.assertIn(item['summary'], full)
            self.assertIn(resources.public_url(item), full)
            for prompt in item.get('prompts', []):
                self.assertIn(prompt['text'], full)
            for field in ('preparation','checks'):
                for value in item.get('guide', {}).get(field, []):
                    self.assertIn(value, full)
            for step in item.get('guide', {}).get('steps', []):
                self.assertIn(step['title'], full)
                self.assertIn(step['text'], full)
            if item.get('kind') != 'astuce':
                page = self.outputs[resources.path(item).lstrip('/') + 'index.html']
                self.assertIn(escape(item['summary']), page)
                self.assertIn('name="description" content="' + escape(item['meta_description']) + '"', page)

    def test_retired_paths_do_not_mask_unknown_pages(self):
        self.assertNotIn('<script', self.outputs['404.html'])
        self.assertNotIn('http-equiv="refresh"', self.outputs['404.html'])
        for path, target in build.REDIRECTS.items():
            page = self.outputs[path + '/index.html']
            self.assertIn('content="0; url=' + target + '"', page)
            self.assertIn('rel="canonical" href="https://charlesberthou.fr' + target + '"', page)

    def test_resource_styles_are_not_loaded_on_editorial_pages(self):
        for path, page in self.outputs.items():
            if path == 'index.html' or path.startswith('articles/'):
                self.assertNotIn('resources-layout.css', page)
        css = (ROOT / 'assets/passage/site.css').read_text(encoding='utf-8')
        self.assertNotIn('.resource-entry', css)
        self.assertNotIn('.header-subscribe', css)


if __name__ == '__main__':
    unittest.main()
