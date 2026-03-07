"""
Dashboard and Statistics routes
"""
from fastapi import APIRouter
from datetime import datetime, timedelta

from ..core.database import db
from ..models.schemas import DashboardStats

router = APIRouter(tags=["Dashboard"])


@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    """Statistiques basiques pour le dashboard"""
    tracteurs = await db.tracteurs.find({}, {"_id": 0}).to_list(100)
    equipements = await db.equipements.find({}, {"_id": 0}).to_list(100)
    chauffeurs = await db.chauffeurs.find({}, {"_id": 0}).to_list(100)
    clients = await db.clients.find({}, {"_id": 0}).to_list(100)
    chantiers = await db.chantiers.find({}, {"_id": 0}).to_list(1000)
    
    return DashboardStats(
        total_tracteurs=len(tracteurs),
        tracteurs_disponibles=len([t for t in tracteurs if t.get('statut') == 'disponible']),
        total_equipements=len(equipements),
        equipements_disponibles=len([e for e in equipements if e.get('statut') == 'disponible']),
        total_chauffeurs=len(chauffeurs),
        chauffeurs_disponibles=len([c for c in chauffeurs if c.get('disponibilite', True)]),
        total_clients=len(clients),
        chantiers_planifies=len([c for c in chantiers if c.get('statut') == 'planifie']),
        chantiers_en_cours=len([c for c in chantiers if c.get('statut') == 'en_cours']),
        chantiers_termines=len([c for c in chantiers if c.get('statut') == 'termine'])
    )


@router.get("/stats/dashboard")
async def get_advanced_dashboard_stats():
    """Statistiques avancées pour le nouveau dashboard"""
    now = datetime.now()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    start_of_year = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Factures stats
    factures = await db.factures.find({}, {"_id": 0}).to_list(1000)
    factures_mois = [f for f in factures if f.get('date_emission', '') >= start_of_month.strftime('%Y-%m-%d')]
    factures_annee = [f for f in factures if f.get('date_emission', '') >= start_of_year.strftime('%Y-%m-%d')]
    
    ca_mois = sum(f.get('montant_ttc', 0) for f in factures_mois)
    ca_annee = sum(f.get('montant_ttc', 0) for f in factures_annee)
    factures_en_attente = len([f for f in factures if f.get('statut') in ['brouillon', 'emise', 'envoyee']])
    factures_payees = len([f for f in factures if f.get('statut') == 'payee'])
    
    # Chantiers stats
    chantiers = await db.chantiers.find({}, {"_id": 0}).to_list(1000)
    chantiers_actifs = len([c for c in chantiers if c.get('statut') == 'en_cours'])
    chantiers_termines = len([c for c in chantiers if c.get('statut') == 'termine'])
    
    # Pointages stats
    pointages = await db.pointages.find({}, {"_id": 0}).to_list(1000)
    pointages_mois = [p for p in pointages if p.get('date', '') >= start_of_month.strftime('%Y-%m-%d')]
    
    heures_mois = sum(p.get('heures_travaillees', 0) for p in pointages_mois)
    tours_mois = sum(p.get('nombre_tours', 0) for p in pointages_mois)
    volume_mois = sum(p.get('total_volume', 0) for p in pointages_mois)
    
    # Flotte stats
    tracteurs = await db.tracteurs.find({}, {"_id": 0}).to_list(100)
    equipements = await db.equipements.find({}, {"_id": 0}).to_list(100)
    tracteurs_dispo = len([t for t in tracteurs if t.get('statut') == 'disponible'])
    equipements_dispo = len([e for e in equipements if e.get('statut') == 'disponible'])
    
    # Chauffeurs stats
    chauffeurs = await db.chauffeurs.find({}, {"_id": 0}).to_list(100)
    chauffeurs_actifs = len([c for c in chauffeurs if c.get('disponibilite', True)])
    
    # Contrats stats
    contrats = await db.contrats_ccpa.find({}, {"_id": 0}).to_list(1000)
    contrats_signes = len([c for c in contrats if c.get('statut') == 'signe'])
    contrats_en_attente = len([c for c in contrats if c.get('statut') in ['brouillon', 'envoye']])
    
    # Evolution CA par mois (12 derniers mois)
    evolution_ca = []
    mois_names = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
    
    for i in range(11, -1, -1):
        month_date = now - timedelta(days=i*30)
        month_start = month_date.replace(day=1).strftime('%Y-%m-%d')
        if month_date.month == 12:
            month_end = month_date.replace(year=month_date.year+1, month=1, day=1).strftime('%Y-%m-%d')
        else:
            month_end = month_date.replace(month=month_date.month+1, day=1).strftime('%Y-%m-%d')
        
        month_factures = [f for f in factures if month_start <= f.get('date_emission', '') < month_end]
        month_ca = sum(f.get('montant_ttc', 0) for f in month_factures)
        
        evolution_ca.append({
            'mois': mois_names[month_date.month - 1],
            'montant': month_ca
        })
    
    # Top clients par CA
    client_ca = {}
    for f in factures_annee:
        client_nom = f.get('client_raison_sociale', 'Inconnu')
        client_ca[client_nom] = client_ca.get(client_nom, 0) + f.get('montant_ttc', 0)
    
    top_clients = sorted([{'nom': k, 'ca': v} for k, v in client_ca.items()], key=lambda x: x['ca'], reverse=True)[:5]
    
    return {
        'facturation': {
            'ca_mois': ca_mois,
            'ca_annee': ca_annee,
            'factures_en_attente': factures_en_attente,
            'factures_payees': factures_payees
        },
        'chantiers': {
            'actifs': chantiers_actifs,
            'termines': chantiers_termines
        },
        'activite_mois': {
            'heures': heures_mois,
            'tours': tours_mois,
            'volume': volume_mois
        },
        'flotte': {
            'tracteurs_total': len(tracteurs),
            'tracteurs_disponibles': tracteurs_dispo,
            'equipements_total': len(equipements),
            'equipements_disponibles': equipements_dispo
        },
        'chauffeurs': {
            'total': len(chauffeurs),
            'actifs': chauffeurs_actifs
        },
        'contrats': {
            'signes': contrats_signes,
            'en_attente': contrats_en_attente
        },
        'evolution_ca': evolution_ca,
        'top_clients': top_clients
    }


@router.get("/notifications")
async def get_notifications():
    """Récupère les notifications et alertes"""
    notifications = []
    now = datetime.now()
    today = now.strftime('%Y-%m-%d')
    
    # Factures en retard de paiement
    factures = await db.factures.find({"statut": {"$in": ["emise", "envoyee", "signee"]}}, {"_id": 0}).to_list(1000)
    for f in factures:
        echeance = f.get('date_echeance', '')
        if echeance and echeance < today:
            jours_retard = (now - datetime.strptime(echeance, '%Y-%m-%d')).days
            notifications.append({
                'type': 'facture_retard',
                'priority': 'high' if jours_retard > 30 else 'medium',
                'title': f"Facture {f.get('numero')} en retard",
                'message': f"Échéance dépassée de {jours_retard} jours - Client: {f.get('client_raison_sociale')}",
                'montant': f.get('montant_ttc'),
                'date': echeance,
                'link': f"/factures"
            })
    
    # Factures arrivant à échéance (7 jours)
    for f in factures:
        echeance = f.get('date_echeance', '')
        if echeance:
            try:
                jours_avant = (datetime.strptime(echeance, '%Y-%m-%d') - now).days
                if 0 <= jours_avant <= 7:
                    notifications.append({
                        'type': 'facture_echeance',
                        'priority': 'low',
                        'title': f"Facture {f.get('numero')} bientôt à échéance",
                        'message': f"Échéance dans {jours_avant} jours - Client: {f.get('client_raison_sociale')}",
                        'montant': f.get('montant_ttc'),
                        'date': echeance,
                        'link': f"/factures"
                    })
            except:
                pass
    
    # Contrats en attente de signature
    contrats = await db.contrats_ccpa.find({"statut": "envoye"}, {"_id": 0}).to_list(100)
    for c in contrats:
        sent_at = c.get('docusign_sent_at', c.get('date_creation', ''))
        if sent_at:
            try:
                sent_date = datetime.fromisoformat(sent_at.replace('Z', '+00:00')) if 'T' in sent_at else datetime.strptime(sent_at, '%Y-%m-%d')
                jours_attente = (now - sent_date.replace(tzinfo=None)).days
                if jours_attente > 3:
                    notifications.append({
                        'type': 'contrat_attente',
                        'priority': 'medium',
                        'title': f"Contrat {c.get('numero_contrat')} en attente",
                        'message': f"En attente de signature depuis {jours_attente} jours - Client: {c.get('client_nom')}",
                        'date': sent_at[:10] if sent_at else '',
                        'link': f"/contrats"
                    })
            except:
                pass
    
    # Chantiers sans pointage récent (actifs)
    chantiers = await db.chantiers.find({"statut": "en_cours"}, {"_id": 0}).to_list(100)
    for ch in chantiers:
        last_pointage = await db.pointages.find_one(
            {"chantier_id": ch.get('id')},
            {"_id": 0},
            sort=[("date", -1)]
        )
        if last_pointage:
            try:
                last_date = datetime.strptime(last_pointage.get('date', today), '%Y-%m-%d')
                jours_sans_pointage = (now - last_date).days
                if jours_sans_pointage > 7:
                    notifications.append({
                        'type': 'chantier_inactif',
                        'priority': 'low',
                        'title': f"Chantier {ch.get('reference')} sans activité",
                        'message': f"Aucun pointage depuis {jours_sans_pointage} jours",
                        'date': last_pointage.get('date'),
                        'link': f"/chantiers"
                    })
            except:
                pass
    
    # Trier par priorité
    priority_order = {'high': 0, 'medium': 1, 'low': 2}
    notifications.sort(key=lambda x: priority_order.get(x.get('priority', 'low'), 2))
    
    return {
        'total': len(notifications),
        'high': len([n for n in notifications if n.get('priority') == 'high']),
        'medium': len([n for n in notifications if n.get('priority') == 'medium']),
        'low': len([n for n in notifications if n.get('priority') == 'low']),
        'notifications': notifications
    }
