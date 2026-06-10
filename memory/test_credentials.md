# Identifiants de test — Terre de Beauce ERP (environnement PREVIEW)

## Admin
- Email: `r.coisnon@terredebeauce.com`
- Mot de passe: `Mennessard03`
- Login API: `POST /api/admin/login` → renvoie `token` (stocké en localStorage `admin_token` + `admin_info`)
- Page de connexion: `/admin/login`

## Chauffeur (portail PWA)
- Code d'accès: `43FC7D` (Jean Dupont, email jean.dupont@test.com, id `de440edd-342d-424e-afb5-e90a85af416b`)
- Code d'accès alternatif: `EE81FC` (Lorenzo GOHIER, email gohierlorenzo@gmail.com)
- Login API: `POST /api/chauffeur/login` body `{"code_acces":"43FC7D"}` → renvoie `chauffeur_id`, `chauffeur_nom`, `token` (stocké en localStorage `chauffeur_session`)
- Page de connexion: `/chauffeur/login` → portail: `/chauffeur/portal`

## DocuSign (sandbox/démo)
- Configuré (clés en .env), mais NON authentifié en preview (le flux OAuth doit être fait depuis l'app).
- La signature intégrée (`/api/documents/{id}/sign`) renvoie 401 tant que DocuSign n'est pas connecté — comportement normal.
