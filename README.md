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
- `assets/passage/resources.js` : copie des prompts, sommaire et navigation dans les guides

Après une modification des styles ou du modèle, relancer la génération. Les adresses des styles et des images comportent une empreinte de contenu pour actualiser le cache.

L’accueil fonctionne sans JavaScript, formulaire, traceur ni contenu tiers intégré. Le titre, l’image et le lien de lecture de l’article principal constituent une seule zone cliquable. Les ouvertures LinkedIn sont décrites pour les technologies d’assistance.

## Modifier les ressources

La source est `content/resources.json`. La version du 21 octobre 2026 contient 10 modes d’emploi, chacun avec ses préparatifs, outils, étapes, prompt intégral, vérifications et conseil, ainsi que 7 astuces directement lisibles. Les résumés racontent les expériences documentées de Charles ; les modes d’emploi et prompts sont des adaptations pour le lecteur, sans être présentés comme des copies historiques. Aucun média de réalisation ni commentaire interne n’est publié.

Chaque entrée possède un `slug` unique et stable, un booléen `published`, un `kind` (`usage` ou `astuce`), un `title`, un `summary` et un `icon` choisi dans `scripts/resource_icons.py`. Les SVG décoratifs sont locaux, homogènes et masqués aux technologies d’assistance ; aucune bibliothèque d’icônes n’est chargée. Pour compatibilité, l’absence de `kind` signifie `usage` et `icon` reste facultatif.

- Un cas d’usage possède `prompts` (objets `title` et `text`), `tips` (un conseil dans la sélection actuelle) et un objet `guide`. Celui-ci contient `result` (texte), `preparation` et `checks` (listes de textes), `tools` (objets `name`, `role`, `url` facultative vers une documentation) et `steps` (objets `title`, `text`). Ces listes doivent être non vides et un guide doit avoir au moins un prompt. Les anciens cas sans `guide` restent compatibles
- Les champs historiques optionnels `paragraphs`, `links` et `image` restent compatibles, mais les fiches actuelles sont exclusivement textuelles
- Une astuce possède un texte `try_it` affiché sous « À essayer » et peut fournir des `links` vers sa documentation. Les champs de contenu dépliable et les médias y sont refusés
- Les types et pictogrammes inconnus, les slugs dupliqués, les textes vides et les adresses non sûres bloquent la génération

1. Ajouter le contenu fourni dans `resources` et renseigner `published: true` uniquement lorsqu’il est prêt
2. Conserver les fiches textuelles et les prompts intégraux ; ne pas ajouter de donnée privée
3. Actualiser la date `updated` du fichier de ressources
4. Exécuter `python3 scripts/build.py`, `python3 scripts/build.py --check`, `python3 -m unittest discover -s tests` et `node --test tests/resources.test.cjs`
5. Contrôler le rendu mobile, le dépliage, les liens et la copie avant publication

Tout contenu éditorial est du texte brut, échappé lors de la génération. Les sauts de ligne des prompts sont préservés. Les liens acceptent HTTPS ou un fichier local existant dans `assets/resources/`. Les documents s’ouvrent dans le même onglet. Aucune dépendance, aucun rendu de contenu côté client et aucun service tiers ne sont ajoutés.

Les ressources restent sur une seule page, avec des liens directs stables comme `/ressources/#resource-identifiant`. Les panneaux « Voir le mode d’emploi » utilisent `details` / `summary` et fonctionnent au clavier et sans JavaScript. Le résultat, les outils et la copie du prompt sont accessibles au début du guide. Le texte intégral du prompt possède son propre panneau « Lire le prompt », fermé au départ et utilisable sans JavaScript. Les anciennes ancres vers les prompts ouvrent les deux panneaux et rejoignent le bloc complet, bouton compris. Le bouton de copie apparaît seulement lorsque l’API du presse-papiers est disponible ; le texte reste sélectionnable, et un échec de copie est annoncé en dépliant le texte pour une sélection manuelle. Le bouton « Replier ce guide » en fin de fiche rend le focus au résumé et revient au titre ; il apparaît seulement avec JavaScript.

Le sommaire « Choisir un usage » (`#choisir-usage`), replié au départ, donne accès aux dix guides ; un lien voisin mène aux astuces. Un lien en fin de guide ouvre ce sommaire. L’ancre historique `#cas-usage` est conservée, ainsi que les titres de section pour les technologies d’assistance. Les 17 fiches gardent le préfixe `#resource-` pour leurs liens partageables. Sur ordinateur, les titres et les textes occupent deux colonnes dans chaque ligne ; à 900 px et en dessous, ils se superposent. Aucun texte n’est tronqué et aucune hauteur n’est imposée.

Les indications produit ont été vérifiées le 21 octobre 2026 dans la documentation officielle : [mémoire](https://learn.chatgpt.com/docs/customization/memories), [modèles et niveaux de réflexion](https://learn.chatgpt.com/docs/models), [dictée](https://learn.chatgpt.com/docs/prompting), [tâches planifiées et connexions](https://learn.chatgpt.com/training/walkthroughs/scheduled-tasks). Les textes conservent les réserves sur la disponibilité selon le compte, la plateforme et les permissions. Les valeurs « Moyen » et « Élevé » sont conditionnelles, sans promesse d’un sélecteur identique partout.

Les modes d’emploi renvoient également aux documentations officielles consultées pour les [fichiers et projets](https://learn.chatgpt.com/docs/use-chatgpt), la [création de documents](https://learn.chatgpt.com/docs/artifacts-viewer), les [plugins](https://learn.chatgpt.com/fr-FR/docs/plugins), les [images](https://learn.chatgpt.com/docs/image-generation) et la [compilation iOS avec EAS](https://docs.expo.dev/tutorial/eas/ios-development-build-for-devices/). Les outils facultatifs sont signalés ; aucune connexion, tâche ou action externe n’est supposée active chez le lecteur. Les parcours ont été enrichis avec les réalisations précisées par Charles et les échanges retrouvés : panier Drive U prêt à payer, enquête familiale et collecte de témoignages, comparaison énergétique et changement de fournisseur effectif au 1er septembre 2026, confirmé par le message du fournisseur, suivi de mails avec contrats de référence, albums BD et application iPhone. Les étapes de reproduction sont des adaptations, sans promesse de disponibilité identique selon les comptes ou les fournisseurs d’IA. Le parcours de l’application distingue les dépendances gratuites des prérequis de signature Apple.

Le positionnement introductif précise le caractère non publicitaire des retours, le choix personnel de ChatGPT avec abonnement et la transposition des méthodes à Claude, Mistral ou Gemini selon leurs outils. Les guides distinguent les actions réalisées, les propositions à mettre en place et les validations restantes. La préparation proactive du dossier de santé reste présentée comme un prolongement à configurer et à éprouver. Aucun résultat financier réalisé ni contrat signé n’est déduit d’une simulation ou d’une démarche préparée.

Les étapes d’action s’appuient aussi sur les documentations officielles de [l’extension ChatGPT dans Chrome](https://learn.chatgpt.com/docs/chrome-extension), de [l’utilisation de l’ordinateur et du navigateur](https://learn.chatgpt.com/training/walkthroughs/using-your-computer-and-browser), du [navigateur](https://learn.chatgpt.com/docs/browser), des [tâches à horaire fixe ou sur événement](https://learn.chatgpt.com/docs/automations) et de la [recherche proactive des dots](https://learn.chatgpt.com/docs/dots/tasks-and-memory), consultées le 21 octobre 2026. Recherche proactive, tâche enregistrée et action externe sont décrites séparément.

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
