# Quadrille

Zip, Queens, Tango et Patches : entraînement solo illimité et défis multijoueurs par code.

## Structure
- `gen.js` : générateurs de grilles (graine → grille à solution unique)
- `ui.html` : interface et logique de jeu (partagées par la page Claude et l'app)
- `build.py` : produit `quadrille.html` (page Claude) et `app/www/index.html` (app)
- `app/` : projet Capacitor (Android + iOS)
  - `src/backend.js` : classement multijoueur via Supabase
  - `src/config.js` : URL + clé anon Supabase
  - `supabase/schema.sql` : tables et règles d'accès à exécuter une fois

## Mettre à jour l'app après une modification
```sh
cd app
npm run sync      # rebuild + copie vers Android et iOS
npm run apk       # APK : app/android/app/build/outputs/apk/debug/app-debug.apk
```

## Configurer le classement en ligne
Le script ne crée que des tables et fonctions `quadrille_*` et ne touche pas aux réglages
d'authentification : il peut être ajouté à un projet Supabase existant.
1. SQL Editor du projet choisi : exécuter `app/supabase/schema.sql`.
2. Project Settings > API : copier l'URL et la clé `anon` dans `app/src/config.js`, puis `npm run sync`.

## Installer
- **Android** : copier l'APK sur le téléphone et l'ouvrir (autoriser les sources inconnues),
  ou `adb install -r app/android/app/build/outputs/apk/debug/app-debug.apk`.
- **iPhone** : `cd app && npx cap open ios`, dans Xcode choisir la cible App > Signing & Capabilities >
  Team = ton Apple ID, brancher l'iPhone, le sélectionner et lancer (▶). Sur l'iPhone :
  Réglages > Général > VPN et gestion de l'appareil > faire confiance au développeur.
  Avec un Apple ID gratuit, l'app doit être réinstallée tous les 7 jours.
