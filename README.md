# Le Passage IA · charlesberthou.fr

Site statique publié sur GitHub Pages depuis la branche `main`. L’accueil relaie exclusivement la newsletter de Charles Berthou. Les articles et l’abonnement sont hébergés sur LinkedIn.

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

- `templates/index.html` : structure et textes de présentation
- `assets/passage/site.css` : mise en page, couleurs, états interactifs et tailles de texte
- `assets/passage/fonts.css` : quatre polices WOFF2 locales, licences incluses
- `scripts/build.py` : composants d’article, métadonnées et pages de repli

Après une modification des styles ou du modèle, relancer la génération. Les adresses des styles et des images comportent une empreinte de contenu pour actualiser le cache.

L’accueil fonctionne sans JavaScript, formulaire, traceur ni contenu tiers intégré. Le titre, l’image et le lien de lecture de l’article principal constituent une seule zone cliquable. Les ouvertures LinkedIn sont décrites pour les technologies d’assistance. L’abonnement nécessite un compte LinkedIn.

## Anciennes rubriques

Les sept anciennes routes de rubrique sont conservées uniquement pour rediriger vers l’accueil. Les scripts et données des outils sont absents de la version publiée. Leur historique reste récupérable dans Git.

## Illustrations

Les illustrations éditoriales proviennent des références fournies pour Le Passage IA. `assets/passage/compteur-sans-titre.webp` remplace la vignette qui portait un titre différent de celui de l’article. La retouche a été réalisée avec le module imagegen intégré : suppression du titre du panneau supérieur gauche et de ses deux filets, reconstitution du papier, conservation du cercle doré, du visage, des pièces, du cadrage et de la palette. Le fichier est ensuite encodé en WebP pour le site.

## Recette ciblée

- Lancer `python3 scripts/build.py --check`
- Vérifier les contrastes des petits textes sur fond clair et foncé, y compris au survol
- Contrôler le lien d’évitement, les noms accessibles, la tabulation et le focus
- Inspecter la grille à 320, 390, 640, 768, 900 et 1363 pixels, puis le zoom et les appareils réels lorsque disponibles
- Ouvrir le dernier article, une carte, la newsletter, le profil auteur et une ancienne route
- Vérifier la page 404 et les ressources publiées après le déploiement
