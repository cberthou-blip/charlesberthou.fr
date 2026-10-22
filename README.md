# Le Passage IA · charlesberthou.fr

Site statique publié sur GitHub Pages depuis la branche `main`. L’accueil donne accès aux articles complets de Charles Berthou et à ses ressources pratiques. LinkedIn reste le lieu d’abonnement à la newsletter et la publication d’origine des articles.

L’accueil présente le dernier article, une entrée vers les expériences et leurs modes d’emploi, puis les autres articles. Les métadonnées, le pied de page et les fichiers `llms` décrivent ces deux dimensions. Le bloc Ressources disparaît si aucun cas d’usage n’est publié.

## Articles intégrés

Les six textes complets sont intégrés depuis le 21 octobre 2026. `/articles/` réunit toutes les éditions et `/articles/<slug>/` propose leur lecture dans le même onglet. Chaque page conserve le titre, la date d’origine, l’auteur, l’illustration, le texte, ses références et le crédit éditorial. La publication LinkedIn est accessible en fin de lecture. Le lien entre l’article sur le progrès et celui sur l’humanité est interne.

Les textes proviennent des publications publiques de Charles sur LinkedIn : extraction HTML pour cinq articles, extraction textuelle indexée avec restitution des liens pour `humanite`. Les recommandations, commentaires, scripts et paramètres de suivi de LinkedIn sont exclus. Le 22 octobre 2026, des sources et repères ont été ajoutés aux six articles ; une faute, une énumération et la contextualisation des chiffres d’adoption ont été corrigées dans `humanite`. Les corps sont des fragments HTML locaux dans `content/articles/`, validés à la génération. Les pages sont autonomes, sans script de lecture, avec une colonne de 44 rem au maximum, une image non recadrée et une navigation en fin d’article.

Chaque article a une canonique locale, des métadonnées de partage avec sa propre illustration, des données structurées `Article` et un fil d’Ariane. L’archive et les six pages figurent au sitemap. `llms-full.txt` reprend les textes complets, leur auteur et leur date ; ces fichiers ne garantissent aucun classement ni citation. La durée de lecture est indicative, calculée sur 220 mots par minute.

## Modifier un article

Les métadonnées éditoriales sont dans `content/editions.json` et le texte complet dans `content/articles/<slug>.html`.

Le champ facultatif `sources` contient une liste d’objets `title`, `url` (HTTPS) et `note`. Ces références s’affichent en fin d’article dans « Sources et repères », replié par défaut et utilisable au clavier sans JavaScript. Elles sont également reprises avec leurs liens dans `llms-full.txt`. Les titres et notes sont du texte brut, échappé au rendu ; une source incomplète, une adresse non sûre ou dupliquée bloque la génération.

1. Ajouter ou modifier les métadonnées : identifiant, titre, date ISO de publication, thème, adresse LinkedIn d’origine, résumé, alternative textuelle, image, `body` (`articles/<slug>.html`) et `integrated` (date de mise à jour locale)
2. Placer le texte complet dans le fichier `body`, puis l’illustration WebP dans `assets/passage/` avec ses dimensions exactes
3. Actualiser `updated` avec la date de modification
4. Exécuter `python3 scripts/build.py`, puis `python3 scripts/build.py --check`
5. Vérifier l’article principal, les liens et les rendus sur téléphone et ordinateur avant de publier les fichiers modifiés

Le script fonctionne avec Python 3, sans dépendance. Il trie les articles par date, affiche le dernier puis les cinq précédents à l’accueil, toutes les éditions dans l’archive et une page pour chaque texte. Il produit les dates françaises, le HTML, les données structurées, le sitemap et les fichiers `llms`. Un corps absent, un chemin invalide ou une balise active bloque la génération. Les balises admises sont `p`, `h2`, `h3`, `blockquote`, `ul`, `ol`, `li`, `strong`, `em`, `a`, `br` et `hr` ; les liens doivent être HTTPS ou pointer vers un article local existant.

`--check` ne modifie aucun fichier. Il retourne un code d’erreur si une sortie générée est périmée ou si une donnée obligatoire, une image ou une adresse LinkedIn est invalide. Ne pas modifier directement les fichiers générés.

## Modifier la présentation

- `templates/page.html` : enveloppe commune, métadonnées, navigation et pied de page
- `templates/index.html` : contenu de l’accueil
- `templates/articles.html` et `templates/article.html` : archive et lecture d’un article
- `templates/resources.html` : structure de la page Ressources
- `assets/passage/site.css` : mise en page, couleurs, états interactifs et tailles de texte
- `assets/passage/fonts.css` : quatre polices WOFF2 locales, licences incluses
- `scripts/build.py` : composants d’article, métadonnées et pages de repli
- `scripts/articles.py` : validation des textes complets et calcul de la durée de lecture
- `scripts/resources.py` : validation et rendu statique des ressources
- `assets/passage/resources.js` : copie des prompts, sommaire et navigation dans les guides

Après une modification des styles ou du modèle, relancer la génération. Les adresses des styles et des images comportent une empreinte de contenu pour actualiser le cache.

L’accueil fonctionne sans JavaScript, formulaire, traceur ni contenu tiers intégré. Le titre, l’image et le lien de lecture de l’article principal constituent une seule zone cliquable. Les ouvertures LinkedIn sont décrites pour les technologies d’assistance.

## Modifier les ressources

La source est `content/resources.json`. La version du 21 octobre 2026 contient 10 modes d’emploi, chacun avec ses préparatifs, outils, étapes, prompt intégral, vérifications et conseil, ainsi que 7 astuces directement lisibles. Les résumés présentent l’usage et le résultat documenté. Le champ historique facultatif `experience` reste compatible avec le rendu. Les modes d’emploi et prompts sont des adaptations pour le lecteur, sans être présentés comme des copies historiques. Aucun média de réalisation ni commentaire interne n’est publié.

Chaque entrée possède un `slug` unique et stable, un booléen `published`, un `kind` (`usage` ou `astuce`), un `title`, un `summary` et un `icon` choisi dans `scripts/resource_icons.py`. Les SVG décoratifs sont locaux, homogènes et masqués aux technologies d’assistance ; aucune bibliothèque d’icônes n’est chargée. Pour compatibilité, l’absence de `kind` signifie `usage` et `icon` reste facultatif.

- Un cas d’usage peut préciser `experience` (texte brut, échappé au rendu), et possède `prompts` (objets `title` et `text`), `tips` (un conseil dans la sélection actuelle) et un objet `guide`. Celui-ci contient `result` (texte), `preparation` et `checks` (listes de textes), `tools` (objets `name`, `role`, `url` facultative vers une documentation) et `steps` (objets `title`, `text`). Ces listes doivent être non vides et un guide doit avoir au moins un prompt. Les anciens cas sans `guide` restent compatibles
- Les champs historiques optionnels `paragraphs`, `links` et `image` restent compatibles, mais les fiches actuelles sont exclusivement textuelles
- Une astuce possède un texte `try_it` affiché sous « À essayer » et peut fournir des `links` vers sa documentation. Les champs de contenu dépliable et les médias y sont refusés
- Les types et pictogrammes inconnus, les slugs dupliqués, les textes vides et les adresses non sûres bloquent la génération

1. Ajouter le contenu fourni dans `resources` et renseigner `published: true` uniquement lorsqu’il est prêt
2. Conserver les fiches textuelles et les prompts intégraux ; ne pas ajouter de donnée privée
3. Actualiser la date `updated` du fichier de ressources
4. Exécuter `python3 scripts/build.py`, `python3 scripts/build.py --check`, `python3 -m unittest discover -s tests` et `node --test tests/resources.test.cjs`
5. Contrôler le rendu mobile, le dépliage, les liens et la copie avant publication

Tout contenu éditorial est du texte brut, échappé lors de la génération. Les sauts de ligne des prompts sont préservés. Les liens acceptent HTTPS ou un fichier local existant dans `assets/resources/`. Les documents s’ouvrent dans le même onglet. Aucune dépendance, aucun rendu de contenu côté client et aucun service tiers ne sont ajoutés.

Les ressources restent sur une seule page, avec des liens directs stables comme `/ressources/#resource-identifiant`. Les panneaux « Ouvrir le guide » utilisent `details` / `summary` et fonctionnent au clavier et sans JavaScript. Le résultat tient en une phrase et décrit le livrable, tandis que le résumé conserve le retour d’expérience. La copie du prompt vient immédiatement après ce résultat. L’entrée « Pour démarrer » réunit ensuite l’environnement de départ et les éléments à fournir. Le volet natif « Installation et accès » regroupe les prérequis techniques et les outils, avant les étapes et les points à vérifier. Les étapes distinguent les actions déléguées à l’IA, les validations du lecteur et la réutilisation du travail. Le texte intégral du prompt possède son propre panneau « Lire le prompt », fermé au départ et utilisable sans JavaScript. Les anciennes ancres vers les prompts ouvrent les deux panneaux et rejoignent le bloc complet, bouton compris. Le bouton de copie apparaît seulement lorsque l’API du presse-papiers est disponible ; le texte reste sélectionnable, et un échec de copie est annoncé en dépliant le texte pour une sélection manuelle. Le bouton « Refermer le guide » en fin de fiche rend le focus au résumé et revient au titre ; il apparaît seulement avec JavaScript.

Le sommaire « Choisir un usage » (`#choisir-usage`), toujours visible, donne accès aux dix guides ; un lien voisin mène aux astuces. Un lien en fin de guide revient à ce sommaire. L’ancre historique `#cas-usage` est conservée, ainsi que les titres de section pour les technologies d’assistance. Les 17 fiches gardent le préfixe `#resource-` pour leurs liens partageables. Titres, résumés, boutons et guides partagent une seule colonne de lecture, centrée sur ordinateur et adaptée à la largeur disponible sur mobile. Aucun texte n’est tronqué et aucune hauteur n’est imposée.

Les indications produit ont été vérifiées le 21 octobre 2026 dans la documentation officielle : [mémoire](https://learn.chatgpt.com/docs/customization/memories), [modèles et niveaux de réflexion](https://learn.chatgpt.com/docs/models), [dictée](https://learn.chatgpt.com/docs/prompting), [tâches planifiées et connexions](https://learn.chatgpt.com/training/walkthroughs/scheduled-tasks). Les textes conservent les réserves sur la disponibilité selon le compte, la plateforme et les permissions. Les valeurs « Moyen » et « Élevé » sont conditionnelles, sans promesse d’un sélecteur identique partout.

Les modes d’emploi renvoient également aux documentations officielles consultées pour les [fichiers et projets](https://learn.chatgpt.com/docs/use-chatgpt), la [création de documents](https://learn.chatgpt.com/docs/artifacts-viewer), les [plugins](https://learn.chatgpt.com/fr-FR/docs/plugins), les [images](https://learn.chatgpt.com/docs/image-generation) et la [compilation iOS avec EAS](https://docs.expo.dev/tutorial/eas/ios-development-build-for-devices/). Les outils facultatifs sont signalés ; aucune connexion, tâche ou action externe n’est supposée active chez le lecteur. Les parcours ont été enrichis avec les réalisations précisées par Charles et les échanges retrouvés : panier de courses prêt à payer, enquête familiale et collecte de témoignages, comparaison énergétique et changement de fournisseur effectif, confirmé par le message du fournisseur, suivi de mails avec contrats de référence, albums BD et application iPhone. Les étapes de reproduction sont des adaptations, sans promesse de disponibilité identique selon les comptes ou les fournisseurs d’IA. Le parcours de l’application distingue les dépendances gratuites des prérequis de signature Apple.

Le positionnement introductif précise le caractère non publicitaire des retours, le choix personnel de ChatGPT avec abonnement et la transposition des méthodes à Claude, Mistral ou Gemini selon leurs outils. Les guides distinguent les actions réalisées, les propositions à mettre en place et les validations restantes. La préparation proactive du dossier de santé reste présentée comme un prolongement à configurer et à éprouver. Aucun résultat financier réalisé ni contrat signé n’est déduit d’une simulation ou d’une démarche préparée.

Les précisions de Charles du 21 octobre renforcent cinq parcours : le séjour familial complet, le croisement du dossier de santé jusqu’à la préparation d’un contact professionnel, l’application de collection personnalisée, les projections patrimoniales et arbitrages immobiliers ou automobiles, et le Conseil à cinq rôles. Les slugs restent inchangés. Les prompts sont adaptés pour le lecteur et ne publient aucun bilan médical, montant patrimonial, adresse privée ou document personnel. Les sources financières sont datées ; une consultation web n’est pas présentée comme un flux en temps réel.

Le protocole enregistré du Conseil précise cinq perspectives dans une même conversation, sans indépendance technique annoncée : Contradicteur, Penseur fondamental, Explorateur, Regard extérieur et Pragmatique. La fiche reprend la confrontation, l’arbitrage et la première action. Le guide santé distingue l’expérimentation racontée de la méthode recommandée pour l’imagerie, fondée sur le compte rendu du radiologue. Références consultées le 21 octobre 2026 : [limites des images dans ChatGPT](https://help.openai.com/en/articles/8400551-chatgpt-image-inputs-faq), [information sur les essais cliniques](https://clinicaltrials.gov/study-basics/learn-about-studies) et [repères ESMA sur l’IA et l’investissement](https://www.esma.europa.eu/document/warning-use-ai-investing).

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

## Lecture et style des ressources

La révision du 21 octobre reprend le ton des trois derniers articles du Passage IA, dans un format factuel et pédagogique. Les résumés sont courts ; les étapes, les prompts et les résultats documentés restent accessibles dans les guides. Les lieux de séjour, enseignes de courses, noms de projets privés et dates personnelles sans valeur pédagogique sont retirés. Les noms d’outils utiles à la reproduction sont conservés.

Les actions d’ouverture et de navigation sont bordées ; la copie du prompt est pleine. Les contrôles mesurent au moins 44 px de haut, et les actions principales 48 px. Les pictogrammes filaires se limitent aux thèmes, au sommaire, à la copie et aux repères des étapes et vérifications. Ils restent décoratifs et accompagnés de texte. Les tailles de police et les couleurs du site sont conservées.

Le sommaire des dix usages reste visible, avec des intitulés courts. Chaque fiche reste centrée sur une largeur de lecture de 70 caractères environ sur ordinateur, dans les deux états du guide : l’ouverture ne déplace pas le bouton. Sur mobile, il suit la largeur disponible. La liste du sommaire adapte son nombre de colonnes, y compris lorsque le texte est agrandi.

Les résumés présentent les réalisations effectives. Chaque guide précise ensuite le résultat à reproduire. L’environnement de départ (`guide.start.where`) et les deux éléments de `guide.preparation` sont réunis sous « Pour démarrer ». Les accès nécessaires (`guide.start.access`) et `guide.tools` sont accessibles dans le volet « Installation et accès », après le prompt et avant les étapes. Les ancres historiques `-start`, `-prepare` et `-tools` sont conservées. Le champ facultatif `guide.extension` décrit un prolongement à configurer séparément, sans le présenter comme déjà actif. Son titre concret peut être renseigné dans `guide.extension_title` ; un titre sans contenu ou vide est refusé. Les anciennes ancres des expériences renvoient aux résumés qui en reprennent le contenu.

La revue de lecture vérifie que l’on peut identifier les prérequis, la première action et le résultat de chaque étape. Elle complète les tests d’interface, sans constituer un test d’usage auprès d’un lecteur débutant. Le parcours d’installation iOS précise la distribution interne EAS, le compte Apple Developer Program payant et l’enregistrement de l’appareil, conformément à la [documentation Expo](https://docs.expo.dev/build/internal-distribution/).

Les titres de fiches nomment la démarche complète et le résultat ; les libellés du sommaire restent plus courts pour orienter la lecture. Les prompts adaptés précisent les livrables intermédiaires : quatre onglets pour les courses, inventaire sourcé et tableau de collecte pour le livre, découpage par case pour la BD, comparatif tarifaire et suivi pour l’énergie, fiches quotidiennes pour le séjour, chronologie et synthèse pour la santé, classeur de scénarios pour les finances, parcours vérifiables pour l’application, fiche de décision pour le Conseil et comparaison des clauses pour les mails. Ces précisions sont des consignes de reproduction, pas de nouveaux résultats attribués à Charles. Leur exécution complète sur des données de lecteur n’a pas été testée dans cette révision.


## Essai de lecture sur téléphone

Ce scénario reste à faire avec un lecteur débutant sur un iPhone réel. Les vérifications techniques et la relecture par un agent UX ne constituent pas cet essai. Les captures fournies par Charles permettent de contrôler le rendu, mais pas les interactions tactiles ou le presse-papiers iOS.

Donner au lecteur cette seule consigne : « Depuis la page Ressources, trouvez comment préparer les menus et les courses. Récupérez le prompt dans votre assistant, puis expliquez ce que vous devez fournir et ce que vous validerez. Revenez ensuite choisir un autre usage. »

Observer sans guider pendant cinq minutes, en utilisant uniquement des données fictives et sans lancer d’achat :

1. Le lecteur trouve le guide et comprend le résultat attendu
2. Il distingue « Copier le prompt » et « Lire le prompt », puis colle le texte complet dans une conversation ou une note
3. Il retrouve les éléments à fournir et les accès nécessaires pour le panier
4. Il comprend la préparation initiale, le cycle hebdomadaire et la validation du paiement
5. Il revient au sommaire et ouvre un autre usage

Noter les hésitations, les erreurs et les paroles du lecteur. Sur l’iPhone, vérifier en particulier la copie, le retour depuis l’assistant, le dépliage tactile, la fermeture du guide et la position après retour au sommaire. Corriger les obstacles observés avant d’affirmer que le parcours a été validé auprès d’un utilisateur.
