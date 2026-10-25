# Le Passage IA · charlesberthou.fr

Site éditorial statique de Charles Berthou, publié sur GitHub Pages depuis `main`. Il réunit sept articles complets, dix guides d’usage de l’IA et sept astuces. La newsletter reste disponible sur LinkedIn.

## Structure

| Emplacement | Rôle |
| --- | --- |
| `content/editions.json` | Métadonnées, images, dates et références des articles |
| `content/articles/` | Textes complets des articles |
| `content/resources.json` | Guides, prompts intégraux et astuces |
| `templates/` | Modèles des pages et enveloppe commune |
| `scripts/build.py` | Génération du HTML, du sitemap et des versions texte |
| `scripts/articles.py` | Validation des articles et références |
| `scripts/resources.py` | Validation, classement et rendu des ressources |
| `scripts/resource_icons.py` | Pictogrammes SVG locaux |
| `assets/passage/site.css` | Styles communs, accueil et articles |
| `assets/passage/resources-layout.css` | Styles chargés uniquement sur les ressources |
| `assets/passage/resources.js` | Copie des prompts et navigation vers leurs sections |
| `assets/passage/resources-catalog.js` | Compatibilité des anciennes ancres du catalogue |
| `tests/` | Contrôles éditoriaux, liens, référencement et interactions |

Les pages HTML à la racine, dans `articles/`, `ressources/` et les anciennes rubriques sont générées. Ne pas les modifier directement.

## Construire et vérifier

Python 3 et Node.js suffisent, sans installation de dépendance.

```sh
python3 scripts/build.py
python3 scripts/build.py --check
python3 -m unittest discover -s tests
node --test tests/resources.test.cjs tests/resources-catalog.test.cjs
```

`--check` ne modifie aucun fichier et échoue si une sortie manque ou diffère de sa source. Les tests vérifient notamment les liens et ancres, les références d’accessibilité, le sitemap, les métadonnées, les prompts complets et les comportements de copie.

Avant publication, contrôler également l’accueil, l’archive, un article, le catalogue et un guide sur mobile et ordinateur. Les styles et images portent une empreinte de contenu pour actualiser leur cache.

## Modifier un article

1. Modifier le fragment `content/articles/<slug>.html` et ses métadonnées dans `content/editions.json`
2. Conserver la date de publication d’origine dans `date`
3. Actualiser `integrated`, la date de dernière modification locale significative, ainsi que `updated` au niveau du fichier
4. Régénérer et vérifier les sorties

Les champs obligatoires sont `slug`, `title`, `date`, `theme`, `url`, `summary`, `alt`, `image`, `body` et `integrated`. L’image locale indique ses dimensions exactes et peut préciser un `srcset`. Les références facultatives `sources` contiennent `title`, `url` HTTPS et `note`.

Les fragments admettent `p`, `h2`, `h3`, `blockquote`, `ul`, `ol`, `li`, `strong`, `em`, `a`, `br` et `hr`. Les liens pointent vers une URL HTTPS ou un article local existant. Les scripts, événements, iframes et balises déséquilibrées bloquent la génération.

Les textes proviennent des publications publiques de Charles sur LinkedIn, intégrées en octobre 2026. Les sources et repères ajoutés le 22 octobre précisent leur contexte. Les métadonnées conservent le lien vers la publication d’origine. La durée de lecture est indicative, à raison de 220 mots par minute.

## Modifier une ressource

Chaque entrée de `content/resources.json` possède un `slug` stable, `published`, `kind` (`usage` ou `astuce`), `title`, `summary` et un pictogramme local `icon`.

- Un usage contient un `guide`, ses `prompts` complets et ses `tips`
- Le guide décrit `result`, `preparation`, `tools`, `steps` et `checks`, avec des indications `start` et un éventuel `extension`
- `short_title` fournit le libellé du sommaire et du guide suivant
- `meta_description` fournit un résumé propre aux résultats de recherche, sans modifier le contenu visible
- `topic` classe les usages dans `quotidien`, `creation` ou `decisions`
- `summary_highlight` désigne une portion exacte, présente une seule fois dans le résumé, à mettre en évidence sur la fiche
- Une astuce contient `try_it` et peut proposer des liens documentaires

Actualiser `updated` après une modification significative. `published: false` exclut l’entrée des pages, du sitemap et des exports texte. Le dépôt reste public : aucun brouillon ne doit contenir de donnée privée.

Les dix guides sont autonomes. Le catalogue présente les usages par thème, puis les astuces. Chaque guide conserve tous ses préparatifs, étapes, vérifications, conseils et prompts. Le second bouton de copie cible le même texte original. En cas d’échec, le texte est rendu accessible pour une sélection manuelle.

Les anciennes ancres de catalogue rejoignent les sections correspondantes des guides. Sans JavaScript, elles conduisent à la fiche et à son lien de lecture. Les anciens champs optionnels `experience`, `paragraphs`, `links` et `image` restent compatibles avec le générateur.

Les récits distinguent les réalisations de Charles, les adaptations destinées au lecteur et les prolongements encore à configurer. Ils ne publient aucun bilan médical, montant patrimonial, adresse ou document privé. Les choix médicaux restent discutés avec les soignants ; les hypothèses financières sont à vérifier. La disponibilité des outils dépend du compte, de la plateforme et des permissions.

## Présentation et accessibilité

La palette et les polices locales Libre Caslon Display et DM Sans constituent la direction artistique du site. Leurs licences sont conservées dans `assets/passage/`. Les ressources actuelles restent textuelles, avec des pictogrammes décoratifs locaux.

Le site fonctionne sans bibliothèque d’interface, traceur, formulaire ni contenu tiers intégré. Les articles et les guides sont lisibles sans JavaScript. Les interactions possèdent des états de focus, les retours de copie sont annoncés et les animations respectent la préférence de mouvement réduit.

Les contrôles responsive ne remplacent pas un essai avec un lecteur sur iPhone réel. Vérifier sur cet appareil la copie et le collage du prompt, les panneaux tactiles et le retour depuis l’assistant.

## Référencement et anciennes adresses

Les 20 pages éditoriales ont une canonique HTTPS unique, une description, des métadonnées de partage et des données structurées. L’auteur et le site utilisent des identifiants cohérents. Les dates de modification sont visibles dans les articles et guides et correspondent aux dates déclarées.

`sitemap.xml` ne contient que les pages indexables. `lastmod` reflète une modification significative et ne doit pas être avancé à chaque génération. `robots.txt` autorise les pages et leurs assets, et écarte les répertoires de sources techniques.

`llms.txt` donne les liens d’accès. `llms-full.txt` reprend les articles, les sources, les guides, les astuces et les prompts intégraux. Ce sont des formats de consultation complémentaires : ils ne garantissent ni classement ni citation par un moteur ou une IA.

Les migrations explicites sont définies dans `REDIRECTS` : `/blog/` rejoint `/articles/`, `/outils-ia/` et `/outils-ia/cas-usage/` rejoignent `/ressources/`. Les autres anciennes pages déjà redirigées restent compatibles. GitHub Pages sert des redirections HTML immédiates, sans statut HTTP 301 configurable par fichier.

Une adresse inconnue conserve une vraie réponse HTTP 404. Aucun script ne renvoie arbitrairement les anciens chemins d’articles vers l’accueil. Les pages retirées sans équivalent ne doivent pas être déclarées « corrigées » dans Search Console uniquement pour effacer un signalement.

Après une publication importante, vérifier le sitemap dans la propriété Search Console `sc-domain:charlesberthou.fr`, puis inspecter les nouvelles pages prioritaires. Les rapports et l’indexation se mettent à jour avec un délai propre à Google.
