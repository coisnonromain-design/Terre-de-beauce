"""
Chauffeurs routes
"""
from fastapi import APIRouter, HTTPException
from typing import List
import uuid
import random
import string
from datetime import datetime, timezone

from ..core.database import db
from ..models.schemas import Chauffeur, ChauffeurCreate, ChauffeurLogin, ChauffeurSession

router = APIRouter(prefix="/chauffeurs", tags=["Chauffeurs"])


def generate_code_acces():
    """Génère un code d'accès unique à 6 caractères"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))


@router.get("", response_model=List[Chauffeur])
async def get_chauffeurs():
    chauffeurs = await db.chauffeurs.find({}, {"_id": 0}).to_list(100)
    return chauffeurs


@router.get("/{chauffeur_id}", response_model=Chauffeur)
async def get_chauffeur(chauffeur_id: str):
    chauffeur = await db.chauffeurs.find_one({"id": chauffeur_id}, {"_id": 0})
    if not chauffeur:
        raise HTTPException(status_code=404, detail="Chauffeur non trouvé")
    return chauffeur


@router.post("", response_model=Chauffeur)
async def create_chauffeur(chauffeur: ChauffeurCreate):
    chauffeur_dict = chauffeur.model_dump()
    chauffeur_dict["id"] = str(uuid.uuid4())[:8].upper()
    chauffeur_dict["code_acces"] = generate_code_acces()
    chauffeur_dict["date_creation"] = datetime.now(timezone.utc).isoformat()
    await db.chauffeurs.insert_one(chauffeur_dict)
    return chauffeur_dict


@router.put("/{chauffeur_id}", response_model=Chauffeur)
async def update_chauffeur(chauffeur_id: str, chauffeur: ChauffeurCreate):
    existing = await db.chauffeurs.find_one({"id": chauffeur_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Chauffeur non trouvé")
    chauffeur_dict = chauffeur.model_dump()
    await db.chauffeurs.update_one({"id": chauffeur_id}, {"$set": chauffeur_dict})
    updated = await db.chauffeurs.find_one({"id": chauffeur_id}, {"_id": 0})
    return updated


@router.delete("/{chauffeur_id}")
async def delete_chauffeur(chauffeur_id: str):
    result = await db.chauffeurs.delete_one({"id": chauffeur_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Chauffeur non trouvé")
    return {"message": "Chauffeur supprimé"}


@router.post("/login", response_model=ChauffeurSession)
async def chauffeur_login(login: ChauffeurLogin):
    chauffeur = await db.chauffeurs.find_one({"code_acces": login.code_acces}, {"_id": 0})
    if not chauffeur:
        raise HTTPException(status_code=401, detail="Code d'accès invalide")
    return ChauffeurSession(
        chauffeur_id=chauffeur["id"],
        nom=chauffeur["nom"],
        prenom=chauffeur["prenom"]
    )
