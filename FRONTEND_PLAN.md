# Plan frontend (Django Templates + Bootstrap)

Ce fichier est temporaire pour suivre l’avancement. Coche chaque étape au fur et à mesure.

## Phase 0 — Structure / setup
- [x] Vérifier l’install locale : `pip install -r requirements.txt`
- [x] Config `.env` (copie de `.env.example`) avec `AUTH_API_BASE_URL`, `PREDICTION_API_BASE_URL`, `API_VERSION`, `SECRET_KEY`.
- [x] `python manage.py migrate`
- [x] Run local : `python manage.py runserver 0.0.0.0:8002`
- [x] Décider du schéma de couleurs/typo (à intégrer dans `base.html`).

## Phase 1 — Auth côté frontend
- [x] Stocker le token en session (flow login/register → auth service → sauvegarde access/refresh).
- [x] Ajouter logout (invalidation locale + appel /logout si exposé).
- [x] Gérer refresh token (background ou bouton).
- [x] État connecté/déconnecté dans la navbar (profil, rôle, email).
- [x] Gestion des erreurs auth (bad creds, email non vérifié, verrouillage basique).

## Phase 2 — Consommation API prediction
- [x] Dashboard : lister `/api/v{version}/predictions/` avec pagination/filtre si dispo.
- [x] Détail : appeler l’endpoint de détail (id) et afficher les champs clés.
- [x] Créer une prédiction (si endpoint POST) avec validation et messages (form JSON générique).
- [x] Gérer les codes 403/401 (redirection login + message rôle requis).
- [x] Brancher les rôles (HR/Manager/Auditor/etc.) dans l’UI (affichage conditionnel actions).

## Phase 3 — UX / thème
- [x] Intégrer la palette (couleurs, typo) fournie.
- [x] Nettoyer les formulaires (labels, aide, états de chargement/erreur).
- [x] Layout responsive (mobile first) et navigation claire.
- [x] Ajout de composants utiles : badges rôles, statuts.

## Phase 4 — QA / validation
- [ ] Vérifier le flux complet : register → login → dashboard → détail → logout.
- [ ] Tests manuels avec rôles (HR, Manager, Auditor, Support) sur les pages protégées.
- [ ] Vérifier l’affichage des erreurs API (403/401/422/500).
- [ ] Lint basique : `python -m compileall .` (ou check templates).

## Phase 5 — Livraison
- [ ] Mettre à jour `frontend/README.md` (env, commandes, URLs).
- [ ] Vérifier `.env.example` couvre les variables nécessaires.
- [ ] `git subtree push --prefix=frontend frontrepo main`
- [ ] (Option) Ajouter CI simple pour runserver check / compileall.
