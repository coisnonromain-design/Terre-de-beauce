# PRD - Terre de Beauce ERP

## Original Problem Statement
Construire un ERP complet pour "Terre de Beauce", une société de transport agricole avec tracteurs (identifiés par lettres), remorques solides (numéros), citernes liquides (numéros), bennes TP (numéros). 

### Fonctionnalités demandées:
- Gestion complète: chauffeurs, clients (SIREN, SIRET, TVA, adresse), chantiers avec affectations tracteur + remorque + chauffeur
- Tarification client combinée (€/h, €/tonne, €/jour)
- Interface chauffeur pour saisie des heures et volumes
- Génération automatique de factures
- Signature électronique (DocuSign) ✅
- Facturation complexe avec barèmes kilométriques ✅
- Export de données et tableau de bord avancé ✅

### Informations Entreprise
- Raison sociale: Terre de Beauce
- Adresse: Ferme de Mennessard, 91660 Le Mérévillois
- SIREN: 953286333
- SIRET: 95328633300018
- TVA: FR57953286333
- Email: r.coisnon@terredebeauce.com

## User Personas
1. **Gestionnaire de flotte** - Gère les tracteurs, remorques, citernes et bennes
2. **Responsable planning** - Crée et affecte les chantiers, définit les tarifs
3. **Administratif** - Gère les clients, factures et contrats
4. **Chauffeur** - Saisit ses heures et volumes via le portail chauffeur

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI + Recharts
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Design**: Beauce Green (#1A4D2E) + Harvest Gold (#D9A520)

## What's Been Implemented

### Phase 1 (MVP) - Janvier 2026
- ✅ Dashboard avec statistiques temps réel
- ✅ Gestion Flotte (tracteurs, remorques, citernes, bennes)
- ✅ Gestion Chauffeurs avec code d'accès
- ✅ Gestion Clients (SIREN, SIRET, TVA, adresse)
- ✅ Gestion Chantiers avec affectations
- ✅ Planning - Vue calendrier mensuelle

### Phase 2 (Facturation) - Janvier 2026
- ✅ Portail chauffeur (saisie heures/volumes/tours)
- ✅ Génération factures automatique
- ✅ **Génération et téléchargement PDF** des factures
- ✅ Configuration DocuSign avec clés API
- ✅ Signature électronique des factures

### Phase 3 (Facturation Complexe) - Mars 2026
- ✅ **Barèmes kilométriques** - Configuration des 4 barèmes (solide/liquide × avec/sans gasoil)
- ✅ **Option "gasoil fourni"** sur les chantiers
- ✅ **Contrats CCPA** (Contrat Cadre de Prestations Agricoles)
- ✅ **Signature électronique DocuSign pour Contrats et Factures**
- ✅ **Logique de facturation complexe avec barèmes kilométriques**
- ✅ **Lien Contrat-Facture**
- ✅ **Refonte du portail chauffeur** avec saisie des tours

### Phase 4 (Export & Dashboard) - Mars 2026 ✅ TERMINÉ
- ✅ **Export de données CSV/Excel**
- ✅ **Nouveau tableau de bord avancé** avec graphiques Recharts

### Phase 5 (Authentification) - Mars 2026 ✅ TERMINÉ
- ✅ **Séparation Admin/Chauffeur** - Page d'accueil avec choix
- ✅ **Authentification Administrateur** (email/mot de passe, JWT 24h)
- ✅ **Gestion multi-administrateurs** (création, activation, suppression)
- ✅ **Authentification Chauffeur** (page séparée, code d'accès)
- ✅ **Déconnexion** pour admin et chauffeur

### Phase 6 (PDF Pointages & PWA Mobile) - Mars 2026 ✅ TERMINÉ
- ✅ **Génération PDF des pointages**
  - PDF journalier par pointage
  - PDF récapitulatif par chantier
  - Bouton "Justificatifs (Pointages)" sur les factures
- ✅ **Application PWA Mobile Chauffeur**
  - Interface mobile-first responsive
  - Installable sur écran d'accueil (manifest.json)
  - Service worker pour cache
  - Mode hors-ligne avec IndexedDB
  - Synchronisation automatique au retour en ligne
  - Indicateur online/offline
- ✅ **Gestion des notes de frais**
  - Types : Carburant, Péage, Repas, Hébergement, Autre
  - Photo de tickets via appareil photo
  - Validation/refus par admin
- ✅ **Appareil photo intégré**
  - Photos jointes aux pointages
  - Photos des tickets de frais

### Phase 7 (Multi-Banques) - Mars 2026 ✅ TERMINÉ
- ✅ **Gestion Multi-Comptes Bancaires**
  - CRUD complet pour les comptes bancaires (`/api/comptes-bancaires`)
  - Champs : Nom de la banque, IBAN, BIC, compte par défaut
  - Section dédiée dans la page Configuration
- ✅ **Sélection de la banque sur les factures**
  - Sélecteur de compte bancaire lors de la création de facture
  - Compte par défaut présélectionné automatiquement
  - Coordonnées bancaires affichées sur le PDF de la facture
- ✅ **Classement des factures par banque**
  - Filtre déroulant par banque sur la page Factures
  - Colonne "Banque" dans le tableau des factures
  - Affichage des coordonnées bancaires dans le détail de facture

### Phase 8 (Numérotation unifiée, DocuSign persistant & Espace Documentaire) - Décembre 2025 ✅ TERMINÉ
- ✅ **Numérotation unifiée par chantier**
  - Chantier auto-numéroté `CH-XXXX-2026` (compteur MongoDB `db.counters`, démarrage à 0003 pour 2026)
  - Le numéro se propage : Contrat `CT-XXXX-2026`, Relevé des heures `RH-XXXX-2026` (PDF récap pointages), Facture `FC-XXXX-2026`
  - Repli automatique pour les anciens chantiers (référence hors format) + unicité du numéro de facture
  - Champ Référence en lecture seule côté UI (généré automatiquement)
- ✅ **DocuSign — tokens persistants + rafraîchissement auto**
  - Tokens stockés dans MongoDB (`db.docusign_tokens`) au lieu de la mémoire → survivent aux redéploiements
  - Rafraîchissement automatique via refresh_token, scope `extended` ajouté
- ✅ **Espace Documentaire (Admin + Chauffeur)**
  - Admin : page `/admin/documents` — dépôt de PDF, assignation à un ou plusieurs chauffeurs, 2 catégories (à signer / à consulter), tableau, téléchargement, suppression
  - Chauffeur (PWA) : section "Mes documents" — consultation, téléchargement, **signature intégrée DocuSign (embedded signing)**, récupération du PDF signé
  - Stockage des fichiers via **Object Storage Emergent** (clé `EMERGENT_LLM_KEY`)
  - Validation PDF à l'upload, clés de stockage masquées dans les réponses API

### Phase 9 (Espace Client & Réorganisation Documentaire) - Décembre 2025 ✅ TERMINÉ
- ✅ **Espace Client** (`/client/login` → `/client/portal`)
  - Authentification par **email + mot de passe** (JWT type "client", bcrypt) — même pattern que l'admin
  - L'admin **génère/régénère** le mot de passe depuis la fiche client (bouton clé, modale affichant le mot de passe une fois) — endpoints **protégés par auth admin**
  - 3ème carte « Espace Client » sur la page d'accueil
- ✅ **Documents généralisés chauffeur OU client**
  - Champ `destinataire_type` ("chauffeur"|"client") + `destinataire_id` (rétro-compatible avec `chauffeur_ids`)
  - Admin : sélecteur de type de destinataire dans le dépôt de document
  - Endpoints `GET /api/documents/client/{id}` et `/chauffeur/{id}`
- ✅ **Réorganisation en 2 sections** (chauffeur ET client)
  - 🟠 « En attente de signature » (documents à signer non signés)
  - 🟢 « Documents signés & disponibles » (documents signés + documents à consulter, téléchargeables/extractibles)
- ✅ **Factures dans l'espace client**
  - Section « Mes factures » dans le portail client (consultation + téléchargement PDF)
  - Endpoint `GET /api/client/{client_id}/factures` (exclut les brouillons)

### Phase 10 (Espace Client à 4 onglets) - Décembre 2025 ✅ TERMINÉ
- ✅ **Portail client réorganisé en 4 onglets** : 🏗️ Mes chantiers · 📄 Mes contrats · 📋 Mes relevés · 🧾 Mes factures (l'espace documentaire générique est retiré côté client)
- ✅ **Mes chantiers** : chantiers du client groupés par statut (Programmés / En cours / Terminés), lecture seule
- ✅ **Mes contrats** : contrats CCPA en 3 sections (En attente de signature / Signés / À visualiser), **signature intégrée DocuSign**
- ✅ **Mes relevés** : relevés de pointages (RH-) par chantier, consultation/téléchargement (section À visualiser)
- ✅ **Mes factures** : factures en 3 sections, **signature intégrée DocuSign** (emise/envoyee → à signer, signee → signés, payee → à visualiser)
- ✅ Helpers de **signature intégrée réutilisables** (`docusign_embedded_view`, `docusign_fetch_signed_pdf`) + stockage des PDF signés (object storage) + téléchargement `?signed=true`
- ✅ Endpoints `GET /api/client/{id}/{chantiers|contrats|releves|factures}` et signature `POST /api/{contrats-ccpa|factures}/{id}/sign-embedded` + `/sign-sync`

## API Endpoints

### Gestion des entités
- `GET/POST /api/tracteurs` - Gestion tracteurs
- `GET/POST /api/equipements` - Gestion équipements
- `GET/POST /api/chauffeurs` - Gestion chauffeurs
- `GET/POST /api/clients` - Gestion clients avec tarifs
- `GET/POST /api/chantiers` - Gestion chantiers avec tarifs
- `GET /api/chantiers/{id}/recap` - Récapitulatif pointages
- `GET/POST /api/pointages` - Pointages chauffeurs
- `POST /api/chauffeur/login` - Authentification chauffeur
- `GET/POST /api/factures` - Gestion factures
- `POST /api/factures/generer` - Génération automatique
- `GET/PUT /api/config/entreprise` - Configuration entreprise
- `GET/PUT /api/config/baremes` - Configuration barèmes kilométriques
- `GET/POST/PUT/DELETE /api/comptes-bancaires` - Gestion comptes bancaires
- `GET/POST/PUT/DELETE /api/contrats-ccpa` - Gestion contrats CCPA
- `GET /api/chantiers/{id}/contrat-ccpa` - Contrat CCPA d'un chantier

### Espace Documentaire (Phase 8)
- `POST /api/documents` - Upload PDF (multipart) + assignation multi-chauffeurs (object storage)
- `GET /api/documents` - Liste admin (filtres chauffeur_id/categorie/statut/type_document)
- `GET /api/documents/chauffeur/{chauffeur_id}` - Documents d'un chauffeur
- `GET /api/documents/{id}/download?signed=true|false` - Téléchargement PDF source ou signé
- `DELETE /api/documents/{id}` - Suppression
- `POST /api/documents/{id}/sign?return_url=...` - URL de signature intégrée DocuSign (embedded, chauffeur ou client)
- `POST /api/documents/{id}/sync` - Vérifie la signature et stocke le PDF signé

### Espace Client (Phase 9)
- `POST /api/client/login` - Connexion client (email + mot de passe) → JWT type "client"
- `POST /api/clients/{id}/generate-credentials` - **[admin]** Génère/régénère le mot de passe d'accès (renvoyé une fois)
- `POST /api/clients/{id}/revoke-credentials` - **[admin]** Désactive l'accès client
- `GET /api/documents/client/{client_id}` - Documents d'un client
- `GET /api/documents/chauffeur/{chauffeur_id}` - Documents d'un chauffeur

### DocuSign
- `GET /api/docusign/status` - État de connexion DocuSign
- `GET /api/docusign/auth-url` - URL d'authentification OAuth
- `POST /api/docusign/send-facture/{id}` - Envoyer facture pour signature
- `POST /api/docusign/send-contrat/{id}` - Envoyer contrat pour signature
- `POST /api/docusign/sync-status/{type}/{id}` - Synchroniser statut d'un document
- `POST /api/docusign/sync-all` - Synchroniser tous les documents

### Export et Statistiques (Phase 4)
- `GET /api/export/factures?format=csv|excel&statut=X` - Export factures
- `GET /api/export/pointages?format=csv|excel&chauffeur_id=X&chantier_id=X` - Export pointages
- `GET /api/export/chantiers?format=csv|excel&statut=X` - Export chantiers
- `GET /api/stats/dashboard` - Statistiques avancées du dashboard
- `GET /api/notifications` - Notifications et alertes

## Prioritized Backlog

### P0 (Critique) - ✅ TERMINÉ
- [x] Structure de base ERP
- [x] Gestion flotte complète
- [x] Gestion clients avec tarification
- [x] Gestion chauffeurs avec code accès
- [x] Gestion chantiers avec tarifs
- [x] Portail chauffeur (saisie heures/volumes/tours)
- [x] Génération factures automatique
- [x] Configuration barèmes kilométriques
- [x] Logique de facturation complexe (barèmes + minima horaire)
- [x] Lien contrat-facture

### P1 (Important) - ✅ TERMINÉ
- [x] Configuration DocuSign (clés API fournies)
- [x] Intégration signature électronique factures
- [x] Ajouter option "gasoil fourni" sur les chantiers
- [x] Contrats CCPA liés aux chantiers
- [x] Implémenter logique de facturation complexe (barèmes + minima horaire)
- [x] Lien entre numéro de contrat et numéro de facture
- [x] Refonte portail chauffeur avec saisie des tours
- [x] Export de données CSV/Excel (factures, pointages)
- [x] Tableau de bord avancé avec graphiques et KPIs

### P2 (Souhaitable) - À FAIRE
- [ ] Historique des modifications
- [ ] **Géolocalisation des tracteurs** - Suivi GPS et historique des trajets
- [ ] Intégration comptable (export pour logiciels comptables)
- [ ] **Modification mot de passe chauffeur** - Permettre aux chauffeurs de changer leur code d'accès
- [ ] **Authentification des endpoints `/api/documents/*`** - Actuellement ouverts (comme le reste de l'app) ; sécuriser l'accès aux documents RH sensibles (JWT chauffeur/client/admin). Note: `generate-credentials`/`revoke-credentials` SONT protégés (admin).
- [ ] **Protection JWT sur `/api/documents/client/{id}` et `/chauffeur/{id}`** - Vérifier que le token correspond à l'id demandé
- [ ] **Brute-force lockout** sur `/api/client/login` (et `/admin/login`)
- [ ] **Refactorisation `server.py`** (>4400 lignes) vers routers modulaires
- [ ] **Soft-delete object storage** - Les fichiers PDF restent orphelins en stockage après suppression d'un document

## Notes — Espace Documentaire & DocuSign (Déc 2025)
- La **signature intégrée DocuSign** nécessite que DocuSign soit authentifié (OAuth) depuis l'app de production. En preview, `/api/documents/{id}/sign` renvoie 401 (attendu).
- Le PDF "à signer" reçoit un onglet de signature à position fixe (page 1, bas). Amélioration possible : placement par ancre (`anchor_string`).
- Chaque chauffeur d'un envoi multi-chauffeurs reçoit son propre enregistrement et sa propre enveloppe DocuSign.

## Next Tasks
1. **Configurer DocuSign pour la production** - Remplacer les clés sandbox par les clés de production
2. **Géolocalisation des tracteurs** - Intégrer un système de suivi GPS pour optimiser les rotations
3. **Refactorisation backend** - Migrer le fichier monolithique `server.py` vers l'architecture modulaire préparée

## Technical Notes

### Architecture Refactoring (Mars 2026)
Une nouvelle architecture modulaire a été mise en place pour améliorer la maintenabilité :

```
/app/backend/
├── server.py              # Production (monolithique ~3000 lignes)
├── main.py               # Point d'entrée modulaire (nouveau)
├── core/
│   └── database.py       # Connexion MongoDB et config
├── models/
│   └── schemas.py        # Modèles Pydantic et enums
└── routers/
    ├── tracteurs.py      # Gestion flotte - Tracteurs
    ├── equipements.py    # Gestion flotte - Équipements
    ├── chauffeurs.py     # Gestion chauffeurs
    ├── clients.py        # Gestion clients
    ├── chantiers.py      # Gestion chantiers
    ├── pointages.py      # Pointages
    ├── config.py         # Configuration (entreprise + barèmes)
    ├── export.py         # Export CSV/Excel
    └── dashboard.py      # Dashboard & Statistiques
```

**Note** : Le fichier `server.py` reste en production pour la stabilité. Les routers modulaires sont prêts pour une migration progressive. Les modules complexes (factures, contrats, docusign) nécessitent des tests supplémentaires avant migration.

### Autres Notes Techniques
- Les exports utilisent `openpyxl` pour Excel et génèrent des CSV avec séparateur point-virgule (`;`) pour compatibilité Excel français.
- Le dashboard utilise `recharts` pour les graphiques d'évolution du CA.
