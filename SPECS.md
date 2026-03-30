# Poker Range Trainer - Cahier des charges

## Objectif

PWA Android envoyant des notifications aléatoires à des moments définis de la journée pour s'entraîner à mémoriser des ranges de poker. Usage personnel uniquement.

## Fonctionnalités

### MVP

1. **Notifications push programmées**
   - Créneau par défaut : 9h - 22h
   - Entre 4 et 8 notifications par jour (configurable)
   - Maximum 1 notification par heure
   - Heures tirées aléatoirement dans le créneau au début de chaque journée
   - Chaque notif affiche le nom d'un fichier de range (ex : *"Range 20bb BTN vs CO"*)

2. **Base de données des ranges**
   - 300 à 500 fichiers PNG, nommés de façon descriptive
   - Le nom du fichier (sans extension) = l'intitulé du quiz
   - Les images sont hébergées sur GitHub Pages

3. **Quiz au clic sur la notification**
   - L'app s'ouvre sur une page affichant le nom de la range
   - L'image est masquée par défaut
   - Un bouton "Révéler" affiche l'image de la range
   - Boutons "Je savais" / "Je ne savais pas" (stocké en localStorage pour futur usage)

### V2 (plus tard)

- Tracking des scores (% de bonnes réponses par range)
- Répétition espacée (les ranges mal connues reviennent plus souvent)
- Mode quiz actif (sans attendre la notif)
- Filtres (ne réviser que certaines profondeurs / positions)
- Paramétrage du créneau horaire et du nombre de notifs dans l'app

## Architecture technique

| Contrainte | Décision |
|---|---|
| Plateforme cible | Android uniquement |
| Type d'app | **PWA** (Progressive Web App) — pas de store |
| Frontend | HTML/CSS/JS vanilla (fichier statique unique) |
| Notifications | **ntfy.sh** (service gratuit de push notifications) |
| Scheduler | **GitHub Actions** (cron toutes les heures, 9h-22h) |
| Hébergement PWA + images | **GitHub Pages** (gratuit) |
| Stockage scores | localStorage (côté client) |

### Pourquoi cette stack ?

- **100% gratuit** : aucun serveur, aucun VPS, aucun compte payant
- **Zéro maintenance** : GitHub Actions tourne tout seul, GitHub Pages sert les fichiers
- **ntfy.sh** : service open-source de notifications push, app Android native disponible sur le Play Store, pas besoin de gérer les Web Push API / VAPID keys / service workers pour les notifs
- **Très simple** : ~3 fichiers à maintenir

## Architecture

```
┌─────────────────────────────────────────────────┐
│              GITHUB (gratuit)                    │
│                                                  │
│  ┌──────────────────────┐                        │
│  │  GitHub Actions       │  Cron toutes les      │
│  │  (scheduler)          │  heures 9h-22h        │
│  │                       │                       │
│  │  1. Décide si on      │                       │
│  │     envoie une notif  │                       │
│  │     (probabiliste)    │                       │
│  │  2. Tire une range    │                       │
│  │     au hasard         │                       │
│  │  3. curl ntfy.sh      │──────┐                │
│  └──────────────────────┘      │                │
│                                 │                │
│  ┌──────────────────────┐      │                │
│  │  GitHub Pages         │      │                │
│  │  (hébergement)        │      │                │
│  │                       │      │                │
│  │  - index.html (PWA)   │      │                │
│  │  - /ranges/*.png      │      │                │
│  │  - ranges.json        │      │                │
│  └──────────────────────┘      │                │
└─────────────────────────────────│────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────┐
│              ntfy.sh (gratuit)                   │
│                                                  │
│  Reçoit le message + URL de click               │
│  Envoie la notification push                     │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│         TELEPHONE Android                        │
│                                                  │
│  ┌─────────────────────────────────────────┐     │
│  │  App ntfy (Play Store)                  │     │
│  │  - Reçoit la notification               │     │
│  │  - Affiche "Range: 20bb BTN vs CO"      │     │
│  │  - Clic → ouvre le navigateur           │     │
│  └─────────────────┬───────────────────────┘     │
│                    │                              │
│                    ▼                              │
│  ┌─────────────────────────────────────────┐     │
│  │  PWA (GitHub Pages)                     │     │
│  │  - Affiche le nom de la range           │     │
│  │  - Bouton "Révéler" → montre l'image    │     │
│  │  - "Je savais" / "Je ne savais pas"     │     │
│  │  - Scores en localStorage               │     │
│  └─────────────────────────────────────────┘     │
└─────────────────────────────────────────────────┘
```

## Flux utilisateur

### Setup (une seule fois)

1. Installer l'app **ntfy** depuis le Play Store
2. S'abonner au topic `poker-ranges-achille` (nom privé/unique)
3. Ajouter la PWA en raccourci sur l'écran d'accueil (optionnel)

### Quotidien

1. GitHub Actions tourne toutes les heures entre 9h et 22h (14 slots)
2. Chaque exécution tire un nombre aléatoire : si < seuil (~40%), on envoie une notif (donne ~5-6/jour en moyenne)
3. Le script tire une range au hasard dans `ranges.json`
4. Il envoie via `curl` à ntfy.sh : le nom de la range + une URL cliquable
5. Le téléphone reçoit la notification : *"Range: 20bb BTN vs CO"*
6. L'utilisateur se récite sa range mentalement
7. Il clique → le navigateur ouvre `https://<user>.github.io/learn-ranges/quiz?range=20bb_BTN_vs_CO`
8. La page affiche le nom, l'image est cachée
9. Clic sur "Révéler" → l'image apparaît
10. Clic "Je savais" / "Je ne savais pas" → stocké en localStorage

## Structure du repo

```
learn-ranges/
├── .github/
│   └── workflows/
│       └── notify.yml          # GitHub Actions cron
├── ranges/                     # 300-500 fichiers PNG
│   ├── 20bb_BTN_vs_CO.png
│   ├── 25bb_SB_vs_BTN.png
│   └── ...
├── ranges.json                 # Liste des noms de fichiers (auto-généré)
├── index.html                  # PWA : page quiz
├── style.css                   # Styles
├── app.js                      # Logique quiz + localStorage
├── generate-ranges-json.sh     # Script pour régénérer ranges.json
└── SPECS.md                    # Ce fichier
```

## Sécurité / vie privée

- Le topic ntfy est un nom unique/aléatoire → personne d'autre ne le connaît
- Pas de données personnelles exposées
- Les images de ranges ne sont pas confidentielles (stratégie standard)
- Le repo GitHub peut être privé (GitHub Pages fonctionne sur les repos privés avec un compte gratuit)

## Limites connues

- **GitHub Actions cron** : la précision est de ±5-15 minutes (GitHub ne garantit pas l'exécution exacte). Acceptable pour notre usage.
- **Probabiliste** : le nombre de notifs par jour varie (entre 3 et 9 environ). Un mécanisme de state serait plus précis mais complexifie. Acceptable pour le MVP.
- **GitHub Actions free tier** : 2000 minutes/mois pour les repos privés. Chaque exécution prend ~10 secondes → ~70 secondes/jour → ~35 minutes/mois. Largement dans les limites.
