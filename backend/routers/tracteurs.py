"""
Tracteurs routes
"""
from fastapi import APIRouter, HTTPException
from typing import List
import uuid
from datetime import datetime, timezone

from ..core.database import db
from ..models.schemas import Tracteur, TracteurCreate

router = APIRouter(prefix="/tracteurs", tags=["Tracteurs"])


@router.get("", response_model=List[Tracteur])
async def get_tracteurs():
    tracteurs = await db.tracteurs.find({}, {"_id": 0}).to_list(100)
    return tracteurs


@router.get("/{tracteur_id}", response_model=Tracteur)
async def get_tracteur(tracteur_id: str):
    tracteur = await db.tracteurs.find_one({"id": tracteur_id}, {"_id": 0})
    if not tracteur:
        raise HTTPException(status_code=404, detail="Tracteur non trouvé")
    return tracteur


@router.post("", response_model=Tracteur)
async def create_tracteur(tracteur: TracteurCreate):
    tracteur_dict = tracteur.model_dump()
    tracteur_dict["id"] = str(uuid.uuid4())[:8].upper()
    tracteur_dict["date_creation"] = datetime.now(timezone.utc).isoformat()
    await db.tracteurs.insert_one(tracteur_dict)
    return tracteur_dict


@router.put("/{tracteur_id}", response_model=Tracteur)
async def update_tracteur(tracteur_id: str, tracteur: TracteurCreate):
    existing = await db.tracteurs.find_one({"id": tracteur_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Tracteur non trouvé")
    tracteur_dict = tracteur.model_dump()
    await db.tracteurs.update_one({"id": tracteur_id}, {"$set": tracteur_dict})
    updated = await db.tracteurs.find_one({"id": tracteur_id}, {"_id": 0})
    return updated


@router.delete("/{tracteur_id}")
async def delete_tracteur(tracteur_id: str):
    result = await db.tracteurs.delete_one({"id": tracteur_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tracteur non trouvé")
    return {"message": "Tracteur supprimé"}
