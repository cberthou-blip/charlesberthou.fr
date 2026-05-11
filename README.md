# charlesberthou.fr

Site personnel statique publie avec GitHub Pages.

## Structure

- `/` : accueil éditorial, blog, outils IA et contact.
- `/blog/` : index des articles.
- `/blog/*/` : articles publics.
- `/resume-llm/` et `/llms.txt` : contexte synthetique pour moteurs IA et LLM.
- `/a-propos/` : positionnement éditorial.
- `/confidentialite/` : politique de confidentialité.
- `/wero/` : module e-learning statique.
- `/ialearning/` : application IA Learning. Cette page utilise Firebase pour l'authentification, les données de progression, les classements et les équipes.

## Hebergement

Le domaine `charlesberthou.fr` est servi par GitHub Pages via `CNAME`.

Firebase n'est pas utilise pour l'hébergement du site principal. Le fichier `firebase.json` ne conserve donc que la configuration Firestore nécessaire a `/ialearning/`.

## Redirections

GitHub Pages ne fournit pas de redirections serveur configurables dans ce depot. Les anciennes routes publiques sont conservees sous forme de pages statiques `noindex` avec canonical et redirection HTML/JavaScript:

- `/articles/` vers `/blog/`
- `/articles/actumars2026/` vers `/blog/actumars2026/`
- `/articles/ia-entreprise/` vers `/blog/ia-entreprise/`
- `/articles/humanite-lumiere/` vers `/blog/humanite-lumiere/`
- `/articles/le-token-prochaine-monnaie-ia/` vers `/blog/le-token-prochaine-monnaie-ia/`
- `/gpts/`, `/contact/`, `/e-learning/`, `/elearning/` vers les ancres utiles de l'accueil.
