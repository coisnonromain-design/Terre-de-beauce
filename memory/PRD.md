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
- ⏳ Logique de facturation avec minima horaire
- ⏳ Refonte du portail chauffeur (saisie tours)

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

## Prioritized Backlog

### P0 (Critique) - DONE
- [x] Structure de base ERP
- [x] Gestion flotte complète
- [x] Gestion clients avec tarification
- [x] Gestion chauffeurs avec code accès
- [x] Gestion chantiers avec tarifs
- [x] Portail chauffeur (saisie heures/volumes)
- [x] Génération factures automatique
- [x] Configuration barèmes kilométriques

### P1 (Important) - EN COURS
- [x] Configuration DocuSign (clés API fournies)
- [x] Intégration signature électronique factures
- [x] Ajouter option "gasoil fourni" sur les chantiers
- [x] Contrats CCPA liés aux chantiers
- [ ] Implémenter logique de facturation complexe (barèmes + minima horaire)
- [ ] Lien entre numéro de contrat et numéro de facture

### P2 (Souhaitable) - À FAIRE
- [ ] Export PDF des factures
- [ ] Notifications (rappels maintenance, échéances)
- [ ] Historique des modifications
- [ ] Rapports et statistiques avancées
- [ ] Application mobile chauffeur
- [ ] Géolocalisation des tracteurs

## Next Tasks
1. **Logique de facturation complexe** - Implémenter le calcul avec barèmes kilométriques et règle du minima horaire
2. **Refonte portail chauffeur** - Permettre la saisie des tours (volume + distance) par jour
3. **Modèle de contrat** - Attendre le modèle de contrat de transport du client
