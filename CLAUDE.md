# CLAUDE.md — charlesberthou.fr

## Comportement git
Toujours commiter et pusher les changements automatiquement après une modification de code, sans demander confirmation.
Enchaîner directement `git add + commit + push` sans poser de question.

---

## Projet : IA Learning (`/ialearning/`)

SPA (Single Page App) en HTML/CSS/JS pur — un seul fichier `ialearning/index.html` (~3912 lignes).
Stack : Firebase Auth + Firestore (compat SDK v10.14.1), pas de bundler.

### Versions stables
| Version | Tag git | Date | Notes |
|---------|---------|------|-------|
| V1.2 | `v1.2` | 2026-04-08 | Branding IA Learning, fix parcours connexion, fix showConfirm/timer |

---

## Chemins critiques (NE PAS CONFONDRE)

| Contexte | Chemin bash | Chemin Node.js / Write tool |
|----------|-------------|------------------------------|
| Temp système | `/tmp` | `C:\Users\cbert\AppData\Local\Temp` |
| Temp Node/Write | `/c/tmp` | `C:\tmp` ou `/tmp` dans Node |

**Règle** : toujours copier le fichier vers `/c/tmp/` avant d'y appliquer un script Node.js, puis recopier vers le repo.

### Accès au repo depuis bash
Le répertoire contient un espace insécable (U+00A0) entre "Google" et "Drive" :
```bash
BASEDIR=$'/c/Users/cbert/Acc\xc3\xa8s Google\xc2\xa0Drive/Autres ordinateurs/CARLOS2K25/Documents/charlesberthou.fr'
```

### Accès depuis Node.js
Utiliser la copie dans `/c/tmp/` (Node ne peut pas ouvrir le chemin avec caractères spéciaux).

---

## Règles d'édition

- **Jamais** modifier le JS de `index.html` via l'outil Edit → il convertit les apostrophes droites `'` en guillemets courbes U+2018/U+2019, cassant la syntaxe JS.
- Toujours écrire les modifications JS via un script Node.js (`Write` → `/c/tmp/script.js` → `node "C:/tmp/script.js"`).
- Valider la syntaxe JS après chaque modification :
  ```bash
  SCRIPT_START=$(grep -n "<script>" /c/tmp/index_fixed.html | tail -1 | cut -d: -f1)
  SCRIPT_END=$(grep -n "</script>" /c/tmp/index_fixed.html | tail -1 | cut -d: -f1)
  awk "NR>$SCRIPT_START && NR<$SCRIPT_END" /c/tmp/index_fixed.html > /c/tmp/check_js.js
  node --check /c/tmp/check_js.js
  ```

---

## Architecture JS clé

- `openModule(id)` — ouvre un module ; `id` est un **nombre** (pas une string). Guard ajouté : `if(!currentUser.modules) currentUser.modules={};`
- `startDuel(challenge)` — démarre le duel côté challengé (`isChallenger:false`)
- `startDuelAsChallenger(challenge)` — démarre le duel côté challenger (`isChallenger:true`)
- `renderDuelQuestion()` — affiche la question courante ; appelle `endDuel()` quand terminé
- `endDuel()` — deux branches : `isChallenger` (score sauvé, attente adversaire) et `!isChallenger` (calcul victoire/défaite)

---

## Bugs résolus (historique)

| Commit | Bug | Fix |
|--------|-----|-----|
| `397d3e0` | Apostrophe `l'évaluation` cassait le JS (U+2019) | HTML entity `&#39;` |
| `a472f06` | `openModule` crash admin (pas de champ `modules` en Firestore) | Guard `if(!currentUser.modules)` |
| `fa38e4c` | `endDuel()` : variables `total/icon/label/xpMsg` non déclarées | Déclarations ajoutées |
| `fa38e4c` | iOS Safari : interface coupée (`100vh`) | Remplacé par `100dvh` |
| `fa38e4c` | Focus ring bleu natif sur quiz options | `:focus` et `:focus-visible` → `outline:none` |
| `fa38e4c` | Landing page collée aux bords mobile | `padding-left/right:20px` dans `@media(max-width:640px)` |
| `c56b62c` | Bordure bleue sur option quiz avant réponse (hover tactile collant) | `.quiz-opt:hover` → `@media(hover:hover)` + règle `:active` |
| `c56b62c` | Score adversaire incohérent entre header et panneau résultat | Sync `duel-opp-score` avec `challengerScore` réel avant affichage |
