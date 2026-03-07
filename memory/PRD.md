# PRD - Terre de Beauce ERP

## Original Problem Statement
Construire un ERP complet pour "Terre de Beauce", une société de transport agricole avec tracteurs (identifiés par lettres), remorques solides (numéros), citernes liquides (numéros), bennes TP (numéros). 

### Fonctionnalités demandées:
- Gestion complète: chauffeurs, clients (SIREN, SIRET, TVA, adresse), chantiers avec affectations tracteur + remorque + chauffeur
- Tarification client combinée (€/h, €/tonne, €/jour)
- Interface chauffeur pour saisie des heures et volumes
- Génération automatique de factures
- Signature électronique (DocuSign) ✅
- Facturation complexe avec barèmes kilométriques ⏳

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
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI
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
  - 20 tranches de 2.5 km jusqu'à 50 km
  - Interface de configuration modifiable
  - Taux horaire minimum configurable
- ✅ **Option "gasoil fourni"** sur les chantiers
  - Checkbox dans le formulaire de création/modification
  - Affichage dans la liste et les détails (vert/orange)
  - Détermine le barème à utiliser pour la facturation
- ✅ **Contrats CCPA** (Contrat Cadre de Prestations Agricoles)
  - Page dédiée avec onglet "Contrats" dans la navigation
  - Création de contrat lié à un chantier
  - Pré-remplissage automatique des infos client
  - Champs modifiables : nom, interlocuteur, adresse, email, téléphone, prix, unité
  - Workflow de statut : Brouillon → Envoyé → Signé
  - Visualisation du contrat formaté
  - **Génération et téléchargement PDF** du contrat
- ✅ **Signature électronique DocuSign pour Contrats et Factures**
  - Envoi des contrats CCPA pour signature via DocuSign
  - Envoi des factures pour signature via DocuSign
  - Suivi du statut DocuSign (Envoyé, Reçu, Signé, Refusé, Annulé)
  - Synchronisation automatique des statuts
  - Bouton "Sync DocuSign" pour actualiser tous les documents
- ✅ **Logique de facturation complexe avec barèmes kilométriques**
  - Sélection automatique du barème selon type de transport et option gasoil
  - Calcul du montant par tour (volume × prix selon distance)
  - Règle du minima horaire : si montant volume < montant horaire → facturation à l'heure
  - Comparaison journalière pour optimisation
- ✅ **Lien Contrat-Facture**
  - Le numéro de contrat CCPA est automatiquement lié à la facture
  - Affichage du numéro de contrat dans le détail de la facture
  - Inclus dans le PDF de la facture
- ✅ **Refonte du portail chauffeur**
  - Saisie des heures travaillées par jour
  - Section "Tours / Trajets" pour saisir plusieurs tours par pointage
  - Chaque tour : volume (tonnes ou m³) + distance (km)
  - Calcul et affichage des totaux (volume, distance, nombre de tours)
  - Historique des derniers pointages

## API Endpoints
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
- **DocuSign:**
  - `GET /api/docusign/status` - État de connexion DocuSign
  - `GET /api/docusign/auth-url` - URL d'authentification OAuth
  - `POST /api/docusign/send-facture/{id}` - Envoyer facture pour signature
  - `POST /api/docusign/send-contrat/{id}` - Envoyer contrat pour signature
  - `POST /api/docusign/sync-status/{type}/{id}` - Synchroniser statut d'un document
  - `POST /api/docusign/sync-all` - Synchroniser tous les documents

## Prioritized Backlog

### P0 (Critique) - DONE
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

### P1 (Important) - TERMINÉ
- [x] Configuration DocuSign (clés API fournies)
- [x] Intégration signature électronique factures
- [x] Ajouter option "gasoil fourni" sur les chantiers
- [x] Contrats CCPA liés aux chantiers
- [x] Implémenter logique de facturation complexe (barèmes + minima horaire)
- [x] Lien entre numéro de contrat et numéro de facture
- [x] Refonte portail chauffeur avec saisie des tours

### P2 (Souhaitable) - À FAIRE
- [ ] Export PDF des factures
- [ ] Notifications (rappels maintenance, échéances)
- [ ] Historique des modifications
- [ ] Rapports et statistiques avancées
- [ ] Application mobile chauffeur
- [ ] Géolocalisation des tracteurs

## Next Tasks
1. **Export des données** - Permettre l'export CSV/Excel des factures, pointages, etc.
2. **Rapports et statistiques** - Dashboard avancé avec graphiques de performance
3. **Notifications** - Rappels maintenance, échéances factures, etc.
