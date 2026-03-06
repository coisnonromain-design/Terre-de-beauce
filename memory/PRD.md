# PRD - Terre de Beauce ERP

## Original Problem Statement
Construire un ERP complet pour "Terre de Beauce", une société de transport agricole avec tracteurs (identifiés par lettres), remorques solides (numéros), citernes liquides (numéros), bennes TP (numéros). Gestion complète: chauffeurs, clients (SIREN, SIRET, TVA, adresse), chantiers avec affectations tracteur + remorque + chauffeur, et planning calendrier.

## User Personas
1. **Gestionnaire de flotte** - Gère les tracteurs, remorques, citernes et bennes
2. **Responsable planning** - Crée et affecte les chantiers
3. **Administratif** - Gère les clients et leur facturation

## Core Requirements (Static)
- Gestion de flotte (tracteurs A-Z, équipements numérotés)
- Gestion des chauffeurs (disponibilité, permis)
- Gestion des clients (raison sociale, SIREN, SIRET, TVA intracommunautaire, adresse complète)
- Gestion des chantiers (création, affectation tracteur + équipement + chauffeur)
- Vue planning calendrier

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Design**: Beauce Green (#1A4D2E) + Harvest Gold (#D9A520), Barlow Condensed + Inter fonts

## What's Been Implemented
**Date: Janvier 2026**
- ✅ Dashboard avec statistiques temps réel
- ✅ Gestion Flotte (tracteurs, remorques, citernes, bennes) - CRUD complet
- ✅ Gestion Chauffeurs - CRUD complet avec disponibilité
- ✅ Gestion Clients - CRUD complet avec tous les champs (SIREN, SIRET, TVA, adresse)
- ✅ Gestion Chantiers - CRUD avec affectations multiples (tracteur + équipement + chauffeur)
- ✅ Planning - Vue calendrier mensuelle avec affichage des chantiers
- ✅ Navigation responsive avec sidebar
- ✅ Design professionnel adapté au secteur agricole/BTP

## API Endpoints
- `GET/POST /api/tracteurs` - Gestion tracteurs
- `GET/POST /api/equipements` - Gestion équipements (remorques, citernes, bennes)
- `GET/POST /api/chauffeurs` - Gestion chauffeurs
- `GET/POST /api/clients` - Gestion clients
- `GET/POST /api/chantiers` - Gestion chantiers
- `GET /api/dashboard/stats` - Statistiques tableau de bord

## Prioritized Backlog

### P0 (Critique) - DONE
- [x] Structure de base ERP
- [x] Gestion flotte complète
- [x] Gestion clients
- [x] Gestion chauffeurs
- [x] Gestion chantiers avec affectations
- [x] Planning calendrier

### P1 (Important) - À FAIRE
- [ ] Authentification utilisateurs (JWT ou Google Auth)
- [ ] Export PDF/Excel des données
- [ ] Gestion des documents (carte grise, contrôle technique, permis)
- [ ] Historique des modifications

### P2 (Souhaitable) - À FAIRE
- [ ] Notifications (rappels maintenance, échéances documents)
- [ ] Facturation intégrée
- [ ] Rapports et statistiques avancées
- [ ] Application mobile

## Next Tasks
1. Ajouter l'authentification utilisateurs
2. Implémenter l'export PDF/Excel
3. Gestion documentaire (upload et suivi des documents)
4. Module de facturation
