# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Deployment

```bash
firebase deploy          # deploy hosting + Firestore rules
firebase deploy --only hosting
firebase deploy --only firestore:rules
```

No build step — the repo is deployed as-is. Changes pushed to `main` on GitHub do **not** auto-deploy; `firebase deploy` must be run manually, or `git push origin main` if a CI pipeline is configured.

## Architecture

Static site hosted on **Firebase Hosting** (`charlesberthou.fr`). No framework, no build tool, no package.json — pure HTML/CSS/JS.

### Key sections
| Path | Description |
|------|-------------|
| `ialearning/index.html` | Main project — gamified AI learning SPA (single file, ~4000 lines) |
| `articles/` | Static editorial articles |
| `wero/` | Separate micro-site |
| `index.html` | Homepage |

### ialearning — SPA structure

Everything lives in one file (`ialearning/index.html`):
- **CSS** — CSS variables-based design system at the top (`--navy`, `--indigo`, `--cyan`, `--violet`)
- **HTML views** — sections with class `view`, toggled via `showView(name)`
- **`const MODULES`** — array of 10 module objects, each with `content[]`, `quiz[]`, `duelQuiz[]`
- **`const BADGES_DEF`** — badge definitions
- **Firebase SDK v8** loaded via CDN (compat mode)

### Firebase / Firestore

Collections and their key fields:

**`users/{uid}`**
- `xp`, `level`, `streak`, `lastLogin` (date string `new Date().toDateString()`)
- `modules` — map of `{[moduleId]: {completed, progress, startedAt, completedAt, quizAnswers[]}}`
- `badges[]`, `perfectQuizzes`, `approved`, `isAdmin`
- `approved: false` = pending registration; `isAdmin: true` = admin access

**`challenges/{docId}`** — peer duels  
**`teams/{teamId}`** — `members[]`, `captainUid`, `createdBy`, `xp`  
**`settings/{docId}`** — platform-wide config (admin write only)

### Admin panel

`renderAdmin()` is the entry point. It fetches `users`, `challenges`, and `teams` in parallel. Admin status is checked via `isAdmin` field on the user doc (enforced by Firestore rules). Only accessible when `currentUser.isAdmin === true`.

### Module content format

Each module in `MODULES` has a `content` array of blocks:
```js
{ type: "text", heading: "...", text: "...html..." }
{ type: "grid", heading: "...", items: [{label, value, cls}] }
```
`cls` values for grid items: `""` (indigo), `"cyan"`, `"violet"`.

### Responsive breakpoints
- `@media (max-width:768px)` — tablet adjustments
- `@media (max-width:640px)` — mobile (main breakpoint for admin, nav, forms)
- `@media (max-width:480px)` — small phones
