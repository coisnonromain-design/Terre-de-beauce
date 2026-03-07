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
- `GET/POST/PUT/DELETE /api/contrats-ccpa` - Gestion contrats CCPA
- `GET /api/chantiers/{id}/contrat-ccpa` - Contrat CCPA d'un chantier

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
- [ ] **Génération PDF pour les Pointages** - Fiche de pointage téléchargeable
- [ ] Historique des modifications
- [ ] Application mobile chauffeur
- [ ] **Géolocalisation des tracteurs** - Suivi GPS et historique des trajets
- [ ] Intégration comptable (export pour logiciels comptables)

## Next Tasks
1. **Génération PDF pour les Pointages** - Permettre aux chauffeurs de télécharger leurs fiches de pointage en PDF
2. **Géolocalisation des tracteurs** - Intégrer un système de suivi GPS pour optimiser les rotations

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
