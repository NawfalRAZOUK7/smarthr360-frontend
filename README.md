# smarthr360-frontend

Frontend léger basé sur Django Templates + Bootstrap pour consommer les backends `auth` et `prediction_skills`.

## Prérequis
- Python 3.12+ (aligné avec les backends)
- Virtualenv activé (`.venv` existant côté monorepo)

## Installation rapide
```bash
cd frontend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8002
```

## Variables d’environnement (.env.example à créer)
- `SECRET_KEY` (obligatoire en prod)
- `DEBUG` (True/False)
- `ALLOWED_HOSTS` (ex: localhost,127.0.0.1)
- `AUTH_API_BASE_URL` (ex: http://localhost:8000)
- `PREDICTION_API_BASE_URL` (ex: http://localhost:8001)
- `API_VERSION` (ex: 2)

## Pages
- `/` : Dashboard des prédictions (utilise le token `?token=...` provisoire)
- `/login` et `/register` : formulaires HTML qui postent vers le backend `auth`
- `/predictions/<id>` : page de détail (à brancher)
- `/profile` : placeholder profil/session

## TODO prochain
- Stocker le token en session et intégrer le login/logout complet (appel API auth)
- Consommer l’API prediction pour le détail / création
- Styliser avec ta palette (couleurs/typo) quand fournie
