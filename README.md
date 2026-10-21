# Le Passage IA · charlesberthou.fr

Site statique publié sur GitHub Pages depuis la branche `main`. L’accueil relaie la newsletter de Charles Berthou et donne accès à ses ressources pratiques. Les articles et l’abonnement sont hébergés sur LinkedIn.

## Modifier un article

La source éditoriale unique est `content/editions.json`.

1. Ajouter ou modifier l’article dans ce fichier : identifiant, titre, date ISO, thème, adresse LinkedIn, résumé, alternative textuelle et caractéristiques de l’image
2. Placer l’illustration WebP dans `assets/passage/` et renseigner ses dimensions exactes
3. Actualiser `updated` avec la date de modification
4. Exécuter `python3 scripts/build.py`, puis `python3 scripts/build.py --check`
5. Vérifier l’article principal, les liens et les rendus sur téléphone et ordinateur avant de publier les fichiers modifiés

Le script fonctionne avec Python 3, sans dépendance. Il trie les articles par date, affiche le dernier puis les cinq précédents, et produit les dates françaises, le HTML, les données structurées, le sitemap et les fichiers `llms`. La liste complète reste conservée dans la source et dans `llms-full.txt`.

`--check` ne modifie aucun fichier. Il retourne un code d’erreur si une sortie générée est périmée ou si une donnée obligatoire, une image ou une adresse LinkedIn est invalide. Ne pas modifier directement les fichiers générés.

## Modifier la présentation

- `templates/page.html` : enveloppe commune, métadonnées, navigation et pied de page
- `templates/index.html` : contenu de l’accueil
- `templates/resources.html` : structure de la page Ressources
- `assets/passage/site.css` : mise en page, couleurs, états interactifs et tailles de texte
- `assets/passage/fonts.css` : quatre polices WOFF2 locales, licences incluses
- `scripts/build.py` : composants d’article, métadonnées et pages de repli
- `scripts/resources.py` : validation et rendu statique des ressources
- `assets/passage/resources.js` : copie des prompts et ouverture des liens directs

Après une modification des styles ou du modèle, relancer la génération. Les adresses des styles et des images comportent une empreinte de contenu pour actualiser le cache.

L’accueil fonctionne sans JavaScript, formulaire, traceur ni contenu tiers intégré. Le titre, l’image et le lien de lecture de l’article principal constituent une seule zone cliquable. Les ouvertures LinkedIn sont décrites pour les technologies d’assistance. L’abonnement nécessite un compte LinkedIn.

## Ajouter une ressource, en deuxième phase

La source est `content/resources.json`. La première version contient une liste vide : aucun cas d’usage ni prompt n’est inventé pour remplir la page. L’état d’attente disparaît dès qu’une ressource est publiée.

Chaque entrée possède un `slug` unique et stable, un booléen `published`, un `title` et un `summary`. Les champs optionnels sont `paragraphs` (liste de textes), `prompts` (objets `title` et `text`), `tips` (liste de conseils), `links` (objets `label` et `url`) et `image` (`src`, `alt`, `width`, `height`). Le corps doit contenir au moins un paragraphe, prompt, conseil ou lien pour être publié.

1. Ajouter le contenu fourni dans `resources` et renseigner `published: true` uniquement lorsqu’il est prêt
2. Placer les images et documents dans `assets/resources/`, avec des noms simples sans espaces
3. Actualiser la date `updated` du fichier de ressources
4. Exécuter `python3 scripts/build.py`, `python3 scripts/build.py --check` et `python3 -m unittest discover -s tests`
5. Contrôler le rendu mobile, le dépliage, les liens et la copie avant publication

Tout contenu éditorial est du texte brut, échappé lors de la génération. Les sauts de ligne des prompts sont préservés. Les liens acceptent HTTPS ou un fichier local existant dans `assets/resources/`. Les documents s’ouvrent dans le même onglet. Aucune dépendance, aucun rendu de contenu côté client et aucun service tiers ne sont ajoutés.

Les ressources restent sur une seule page, avec des liens directs stables comme `/ressources/#resource-identifiant`. Les panneaux utilisent `details` / `summary` et fonctionnent au clavier et sans JavaScript. Le bouton de copie apparaît seulement lorsque l’API du presse-papiers est disponible ; le texte reste sélectionnable, et un échec de copie est annoncé sans effacer le prompt.

`published: false` ou l’absence de ce champ exclut l’entrée de toutes les sorties générées. Attention : le dépôt et ses sources sont publics ; n’y placer que des éléments destinés à être publics, même en brouillon.

## Référencement des ressources

La page possède son titre, sa description, sa canonique, ses métadonnées de partage, son auteur et son fil d’Ariane structuré. Tant qu’aucune ressource n’est publiée, elle reste en `noindex, follow`, hors du sitemap et des fichiers `llms`. La publication de la première ressource active automatiquement l’indexation, l’entrée dans le sitemap, la liste structurée et les liens dans les fichiers `llms` existants.

Le texte et les prompts sont livrés directement dans le HTML, y compris dans les panneaux fermés. Les données structurées décrivent seulement le contenu effectivement publié. Ces choix suivent les [recommandations de Google pour ses fonctionnalités d’IA](https://developers.google.com/search/docs/appearance/ai-features) : accessibilité du contenu, liens internes et métadonnées cohérentes. Ils ne constituent pas une garantie de classement ou de citation.

## Anciennes rubriques

Les six anciennes routes restantes sont conservées pour rediriger vers l’accueil. `/ressources/` est désormais une vraie page. Les scripts et données des anciens outils sont absents de la version publiée. Leur historique reste récupérable dans Git.

## Illustrations

Les illustrations éditoriales proviennent des références fournies pour Le Passage IA. `assets/passage/compteur-sans-titre.webp` remplace la vignette qui portait un titre différent de celui de l’article. La retouche a été réalisée avec le module imagegen intégré : suppression du titre du panneau supérieur gauche et de ses deux filets, reconstitution du papier, conservation du cercle doré, du visage, des pièces, du cadrage et de la palette. Le fichier est ensuite encodé en WebP pour le site.

## Recette ciblée

- Lancer `python3 scripts/build.py --check`
- Lancer `python3 -m unittest discover -s tests` pour vérifier l’indexation conditionnelle, les brouillons, l’échappement, les liens et les références d’accessibilité
- Lancer `node --test tests/resources.test.cjs` pour vérifier la copie, son repli et les liens directs (Node sert uniquement à ces tests)
- Vérifier les contrastes des petits textes sur fond clair et foncé, y compris au survol
- Contrôler le lien d’évitement, les noms accessibles, la tabulation et le focus
- Inspecter la grille à 320, 390, 640, 768, 900 et 1363 pixels, puis le zoom et les appareils réels lorsque disponibles
- Ouvrir le dernier article, une carte, la newsletter, le profil auteur et une ancienne route
- Vérifier la page 404 et les ressources publiées après le déploiement
