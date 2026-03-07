"""
Pointages routes
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
import uuid
from datetime import datetime, timezone

from ..core.database import db
from ..models.schemas import Pointage, PointageCreate, Tour

router = APIRouter(prefix="/pointages", tags=["Pointages"])


@router.get("", response_model=List[Pointage])
async def get_pointages(chantier_id: Optional[str] = None, chauffeur_id: Optional[str] = None, date: Optional[str] = None):
    query = {}
    if chantier_id:
        query["chantier_id"] = chantier_id
    if chauffeur_id:
        query["chauffeur_id"] = chauffeur_id
    if date:
        query["date"] = date
    pointages = await db.pointages.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    return pointages


@router.get("/{pointage_id}", response_model=Pointage)
async def get_pointage(pointage_id: str):
    pointage = await db.pointages.find_one({"id": pointage_id}, {"_id": 0})
    if not pointage:
        raise HTTPException(status_code=404, detail="Pointage non trouvé")
    return pointage


@router.post("", response_model=Pointage)
async def create_pointage(input: PointageCreate):
    chantier = await db.chantiers.find_one({"id": input.chantier_id}, {"_id": 0})
    if not chantier:
        raise HTTPException(status_code=404, detail="Chantier non trouvé")
    
    chauffeur = await db.chauffeurs.find_one({"id": input.chauffeur_id}, {"_id": 0})
    if not chauffeur:
        raise HTTPException(status_code=404, detail="Chauffeur non trouvé")
    
    # Calculer les totaux depuis les tours
    tours = input.tours or []
    total_volume = sum(t.volume for t in tours)
    total_distance = sum(t.distance for t in tours)
    nombre_tours = len(tours)
    
    # Vérifier si un pointage existe déjà pour ce jour
    existing = await db.pointages.find_one({
        "chantier_id": input.chantier_id,
        "chauffeur_id": input.chauffeur_id,
        "date": input.date
    }, {"_id": 0})
    
    if existing:
        # Mettre à jour le pointage existant
        update_data = input.model_dump()
        update_data['tours'] = [t.model_dump() if hasattr(t, 'model_dump') else t for t in tours]
        update_data['total_volume'] = total_volume
        update_data['total_distance'] = total_distance
        update_data['nombre_tours'] = nombre_tours
        await db.pointages.update_one({"id": existing['id']}, {"$set": update_data})
        updated = await db.pointages.find_one({"id": existing['id']}, {"_id": 0})
        return updated
    
    # Créer un nouveau pointage
    pointage_dict = input.model_dump()
    pointage_dict['id'] = str(uuid.uuid4())[:8].upper()
    pointage_dict['tours'] = [t.model_dump() if hasattr(t, 'model_dump') else t for t in tours]
    pointage_dict['chantier_reference'] = chantier.get('reference')
    pointage_dict['chauffeur_nom'] = f"{chauffeur.get('prenom', '')} {chauffeur.get('nom', '')}".strip()
    pointage_dict['client_nom'] = chantier.get('client_nom')
    pointage_dict['total_volume'] = total_volume
    pointage_dict['total_distance'] = total_distance
    pointage_dict['nombre_tours'] = nombre_tours
    pointage_dict['tonnage_transporte'] = total_volume
    pointage_dict['nombre_rotations'] = nombre_tours
    pointage_dict['date_creation'] = datetime.now(timezone.utc).isoformat()
    
    await db.pointages.insert_one(pointage_dict)
    return pointage_dict


@router.put("/{pointage_id}", response_model=Pointage)
async def update_pointage(pointage_id: str, input: PointageCreate):
    existing = await db.pointages.find_one({"id": pointage_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Pointage non trouvé")
    
    tours = input.tours or []
    update_data = input.model_dump()
    update_data['tours'] = [t.model_dump() if hasattr(t, 'model_dump') else t for t in tours]
    update_data['total_volume'] = sum(t.volume for t in tours)
    update_data['total_distance'] = sum(t.distance for t in tours)
    update_data['nombre_tours'] = len(tours)
    
    await db.pointages.update_one({"id": pointage_id}, {"$set": update_data})
    updated = await db.pointages.find_one({"id": pointage_id}, {"_id": 0})
    return updated


@router.delete("/{pointage_id}")
async def delete_pointage(pointage_id: str):
    result = await db.pointages.delete_one({"id": pointage_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pointage non trouvé")
    return {"message": "Pointage supprimé"}


@router.post("/{pointage_id}/tours")
async def add_tour_to_pointage(pointage_id: str, tour: Tour):
    """Ajouter un tour à un pointage existant"""
    existing = await db.pointages.find_one({"id": pointage_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Pointage non trouvé")
    
    tours = existing.get('tours', [])
    tour_data = tour.model_dump()
    tour_data['id'] = str(uuid.uuid4())[:8].upper()
    tours.append(tour_data)
    
    total_volume = sum(t.get('volume', 0) for t in tours)
    total_distance = sum(t.get('distance', 0) for t in tours)
    
    await db.pointages.update_one(
        {"id": pointage_id},
        {"$set": {
            "tours": tours,
            "total_volume": total_volume,
            "total_distance": total_distance,
            "nombre_tours": len(tours)
        }}
    )
    
    return await db.pointages.find_one({"id": pointage_id}, {"_id": 0})


@router.delete("/{pointage_id}/tours/{tour_id}")
async def delete_tour_from_pointage(pointage_id: str, tour_id: str):
    """Supprimer un tour d'un pointage"""
    existing = await db.pointages.find_one({"id": pointage_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Pointage non trouvé")
    
    tours = [t for t in existing.get('tours', []) if t.get('id') != tour_id]
    
    total_volume = sum(t.get('volume', 0) for t in tours)
    total_distance = sum(t.get('distance', 0) for t in tours)
    
    await db.pointages.update_one(
        {"id": pointage_id},
        {"$set": {
            "tours": tours,
            "total_volume": total_volume,
            "total_distance": total_distance,
            "nombre_tours": len(tours)
        }}
    )
    
    return {"message": "Tour supprimé"}
