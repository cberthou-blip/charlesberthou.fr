# charlesberthou.fr

Site statique publié avec Firebase Hosting.

## Structure

- `/` : accueil vitrine autour de l'IA appliquée.
- `/outils-ia/` : hub L'Atelier IA.
- `/outils-ia/mon-profil-ia/` : test de maturité IA pour particulier.
- `/outils-ia/diagnostic-ia-entreprise/` : diagnostic de maturité IA pour organisation.
- `/outils-ia/les-bases-de-l-ia/` : page de présentation vers IA Learning.
- `/outils-ia/ia-pour-les-enfants/` : page de présentation vers Kleo.
- `/outils-ia/trouver-un-usage-ia/` : outil de recherche de cas d'usage IA.
- `/outils-ia/suivre-mes-usages-ia/` : registre local des usages IA.
- `/blog/` : index des articles, visible sous le nom Articles.
- `/services/` : page Accompagnements.
- `/a-propos/` : profil court et positionnement.
- `/confidentialite/` : politique de confidentialité.
- `/ialearning/` : application IA Learning, conservée à sa route d'origine.
- `/llms.txt` : contexte synthétique pour moteurs IA et LLM.

## Hébergement

Le domaine `charlesberthou.fr` est servi par Firebase Hosting. Le dépôt ne contient pas de build : les fichiers HTML, CSS et JavaScript sont déployés tels quels.

Le fichier `CNAME` conserve le domaine public attendu.

## Redirections et archives

Les anciennes routes publiques sont conservées sous forme de pages statiques `noindex` avec canonical et redirection HTML/JavaScript lorsque nécessaire.

## IA Learning

La route `/ialearning/` reste indépendante. Elle utilise Firebase pour l'authentification, la progression, les classements et les équipes.

## Déploiement

Déploiement complet :

```bash
firebase deploy
```

Déploiement de l'hébergement uniquement :

```bash
firebase deploy --only hosting
```

Pousser sur `main` ne déclenche pas nécessairement la publication. Un déploiement Firebase reste requis si aucune chaîne d'intégration continue n'est configurée.
