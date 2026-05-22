# charlesberthou.fr

Site personnel statique publie avec GitHub Pages.

## Structure

- `/` : accueil éditorial, blog, outils IA et contact.
- `/blog/` : index des articles.
- `/blog/*/` : articles publics.
- `/outils-ia/` : parcours d'outils IA pour diagnostiquer, former, prioriser, mesurer et gouverner.
- `/llms.txt` : contexte synthetique technique pour moteurs IA et LLM, non mis en avant dans l'interface.
- `/a-propos/` : positionnement éditorial.
- `/confidentialite/` : politique de confidentialité.
- `/ialearning/` : application IA Learning. Cette page utilise Firebase pour l'authentification, les données de progression, les classements et les équipes.

## Hebergement

Le domaine `charlesberthou.fr` est servi par GitHub Pages via `CNAME`.

Firebase n'est pas utilise pour l'hébergement du site principal. Le fichier `firebase.json` ne conserve donc que la configuration Firestore nécessaire a `/ialearning/`.

## Formulaire de contact

Le formulaire de contact est servi depuis les pages statiques et transmet les messages via Web3Forms. La cle publique Web3Forms est declaree dans `/assets/js/site.js`; elle est concue pour etre exposee cote client.

## Redirections

GitHub Pages ne fournit pas de redirections serveur configurables dans ce depot. Les anciennes routes publiques sont conservees sous forme de pages statiques `noindex` avec canonical et redirection HTML/JavaScript:

- `/articles/` vers `/blog/`
- `/articles/actumars2026/` vers `/blog/`
- `/articles/ia-entreprise/` vers `/blog/ia-entreprise/`
- `/articles/humanite-lumiere/` vers `/blog/humanite-lumiere/`
- `/articles/le-token-prochaine-monnaie-ia/` vers `/blog/le-token-prochaine-monnaie-ia/`
- `/resume-llm/` vers `/`
- `/gpts/`, `/contact/`, `/e-learning/`, `/elearning/` vers les pages utiles du site.
