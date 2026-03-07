"""
Chantiers routes
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
import uuid
from datetime import datetime, timezone

from ..core.database import db
from ..models.schemas import Chantier, ChantierCreate, ChantierStatus, TarifChantier

router = APIRouter(prefix="/chantiers", tags=["Chantiers"])


def generate_numero_contrat():
    """Génère un numéro de contrat unique"""
    now = datetime.now()
    unique_id = str(uuid.uuid4())[:6].upper()
    return f"CCPA-{now.year}-{now.month:02d}-{unique_id}"


@router.get("", response_model=List[Chantier])
async def get_chantiers(statut: Optional[ChantierStatus] = None):
    query = {}
    if statut:
        query["statut"] = statut
    chantiers = await db.chantiers.find(query, {"_id": 0}).to_list(1000)
    return chantiers


@router.get("/{chantier_id}", response_model=Chantier)
async def get_chantier(chantier_id: str):
    chantier = await db.chantiers.find_one({"id": chantier_id}, {"_id": 0})
    if not chantier:
        raise HTTPException(status_code=404, detail="Chantier non trouvé")
    return chantier


@router.post("", response_model=Chantier)
async def create_chantier(input: ChantierCreate):
    # Enrich affectations with names
    enriched_affectations = []
    for aff in input.affectations:
        aff_dict = aff.model_dump()
        tracteur = await db.tracteurs.find_one({"id": aff.tracteur_id}, {"_id": 0})
        if tracteur:
            aff_dict['tracteur_immat'] = tracteur.get('immatriculation')
        equipement = await db.equipements.find_one({"id": aff.equipement_id}, {"_id": 0})
        if equipement:
            aff_dict['equipement_numero'] = equipement.get('numero')
        chauffeur = await db.chauffeurs.find_one({"id": aff.chauffeur_id}, {"_id": 0})
        if chauffeur:
            aff_dict['chauffeur_nom'] = f"{chauffeur.get('prenom', '')} {chauffeur.get('nom', '')}".strip()
        enriched_affectations.append(aff_dict)
    
    # Get client name
    client = await db.clients.find_one({"id": input.client_id}, {"_id": 0})
    client_nom = client.get('raison_sociale') if client else None
    
    chantier_dict = input.model_dump()
    chantier_dict['id'] = str(uuid.uuid4())[:8].upper()
    chantier_dict['affectations'] = enriched_affectations
    chantier_dict['client_nom'] = client_nom
    chantier_dict['date_creation'] = datetime.now(timezone.utc).isoformat()
    
    # Générer automatiquement un numéro de contrat
    chantier_dict['numero_contrat'] = generate_numero_contrat()
    
    await db.chantiers.insert_one(chantier_dict)
    return chantier_dict


@router.put("/{chantier_id}", response_model=Chantier)
async def update_chantier(chantier_id: str, input: ChantierCreate):
    existing = await db.chantiers.find_one({"id": chantier_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Chantier non trouvé")
    
    enriched_affectations = []
    for aff in input.affectations:
        aff_dict = aff.model_dump()
        tracteur = await db.tracteurs.find_one({"id": aff.tracteur_id}, {"_id": 0})
        if tracteur:
            aff_dict['tracteur_immat'] = tracteur.get('immatriculation')
        equipement = await db.equipements.find_one({"id": aff.equipement_id}, {"_id": 0})
        if equipement:
            aff_dict['equipement_numero'] = equipement.get('numero')
        chauffeur = await db.chauffeurs.find_one({"id": aff.chauffeur_id}, {"_id": 0})
        if chauffeur:
            aff_dict['chauffeur_nom'] = f"{chauffeur.get('prenom', '')} {chauffeur.get('nom', '')}".strip()
        enriched_affectations.append(aff_dict)
    
    client = await db.clients.find_one({"id": input.client_id}, {"_id": 0})
    client_nom = client.get('raison_sociale') if client else None
    
    update_data = input.model_dump()
    update_data['affectations'] = enriched_affectations
    update_data['client_nom'] = client_nom
    
    await db.chantiers.update_one({"id": chantier_id}, {"$set": update_data})
    updated = await db.chantiers.find_one({"id": chantier_id}, {"_id": 0})
    return updated


@router.delete("/{chantier_id}")
async def delete_chantier(chantier_id: str):
    result = await db.chantiers.delete_one({"id": chantier_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Chantier non trouvé")
    return {"message": "Chantier supprimé"}


@router.get("/{chantier_id}/recap")
async def get_chantier_recap(chantier_id: str):
    """Récapitulatif des pointages pour un chantier"""
    chantier = await db.chantiers.find_one({"id": chantier_id}, {"_id": 0})
    if not chantier:
        raise HTTPException(status_code=404, detail="Chantier non trouvé")
    
    pointages = await db.pointages.find({"chantier_id": chantier_id}, {"_id": 0}).to_list(1000)
    
    total_heures = sum(p.get('heures_travaillees', 0) for p in pointages)
    total_volume = sum(p.get('total_volume', 0) for p in pointages)
    total_distance = sum(p.get('total_distance', 0) for p in pointages)
    nombre_tours = sum(p.get('nombre_tours', 0) for p in pointages)
    nombre_jours = len(set(p.get('date') for p in pointages))
    
    return {
        "chantier": chantier,
        "total_heures": total_heures,
        "total_volume": total_volume,
        "total_distance": total_distance,
        "nombre_tours": nombre_tours,
        "nombre_jours": nombre_jours,
        "pointages": pointages
    }


@router.get("/{chantier_id}/contrat-ccpa")
async def get_chantier_contrat(chantier_id: str):
    """Récupère le contrat CCPA associé au chantier"""
    contrat = await db.contrats_ccpa.find_one({"chantier_id": chantier_id}, {"_id": 0})
    if not contrat:
        raise HTTPException(status_code=404, detail="Contrat CCPA non trouvé pour ce chantier")
    return contrat
