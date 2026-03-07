"""
Equipements routes
"""
from fastapi import APIRouter, HTTPException
from typing import List
import uuid
from datetime import datetime, timezone

from ..core.database import db
from ..models.schemas import Equipement, EquipementCreate, EquipmentType

router = APIRouter(prefix="/equipements", tags=["Equipements"])


@router.get("", response_model=List[Equipement])
async def get_equipements(type: str = None):
    query = {}
    if type:
        query["type"] = type
    equipements = await db.equipements.find(query, {"_id": 0}).to_list(100)
    return equipements


@router.get("/{equipement_id}", response_model=Equipement)
async def get_equipement(equipement_id: str):
    equipement = await db.equipements.find_one({"id": equipement_id}, {"_id": 0})
    if not equipement:
        raise HTTPException(status_code=404, detail="Équipement non trouvé")
    return equipement


@router.post("", response_model=Equipement)
async def create_equipement(equipement: EquipementCreate):
    equipement_dict = equipement.model_dump()
    equipement_dict["id"] = str(uuid.uuid4())[:8].upper()
    equipement_dict["date_creation"] = datetime.now(timezone.utc).isoformat()
    await db.equipements.insert_one(equipement_dict)
    return equipement_dict


@router.put("/{equipement_id}", response_model=Equipement)
async def update_equipement(equipement_id: str, equipement: EquipementCreate):
    existing = await db.equipements.find_one({"id": equipement_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Équipement non trouvé")
    equipement_dict = equipement.model_dump()
    await db.equipements.update_one({"id": equipement_id}, {"$set": equipement_dict})
    updated = await db.equipements.find_one({"id": equipement_id}, {"_id": 0})
    return updated


@router.delete("/{equipement_id}")
async def delete_equipement(equipement_id: str):
    result = await db.equipements.delete_one({"id": equipement_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Équipement non trouvé")
    return {"message": "Équipement supprimé"}
