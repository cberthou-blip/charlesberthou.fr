# Ajouter un article au blog

Le site est statique : il n'y a pas de build, ni de CMS.

Pour publier un nouvel article :

1. Créer un dossier `blog/mon-slug/`.
2. Ajouter un fichier `blog/mon-slug/index.html` en reprenant la structure d'un article existant.
3. Ajouter l'article dans `data/blog.json`.
4. Ajouter l'URL dans `sitemap.xml`.

La page d'accueil et la page `/blog/` lisent `data/blog.json` : il n'est plus nécessaire de modifier leurs cartes à la main.

Champs attendus dans `data/blog.json` :

```json
{
  "title": "Titre de l'article",
  "description": "Résumé court orienté SEO.",
  "date": "2026-04-27",
  "readingTime": "5 min",
  "url": "/blog/mon-slug/",
  "tags": ["IA", "Banque"]
}
```
