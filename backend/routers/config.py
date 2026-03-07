"""
Configuration routes (entreprise + barèmes)
"""
from fastapi import APIRouter, HTTPException
from typing import Optional

from ..core.database import db
from ..models.schemas import (
    EntrepriseConfig, EntrepriseConfigUpdate,
    BaremesConfig, BaremesConfigUpdate, TrancheBareme
)

router = APIRouter(prefix="/config", tags=["Configuration"])


# ============= ENTREPRISE CONFIG =============
@router.get("/entreprise", response_model=EntrepriseConfig)
async def get_entreprise_config():
    config = await db.config.find_one({"id": "config_entreprise"}, {"_id": 0})
    if not config:
        default_config = EntrepriseConfig()
        await db.config.insert_one(default_config.model_dump())
        return default_config
    return config


@router.put("/entreprise", response_model=EntrepriseConfig)
async def update_entreprise_config(config: EntrepriseConfigUpdate):
    existing = await db.config.find_one({"id": "config_entreprise"})
    if not existing:
        default = EntrepriseConfig()
        await db.config.insert_one(default.model_dump())
    
    update_data = {k: v for k, v in config.model_dump().items() if v is not None}
    await db.config.update_one({"id": "config_entreprise"}, {"$set": update_data})
    return await db.config.find_one({"id": "config_entreprise"}, {"_id": 0})


# ============= BAREMES KILOMÉTRIQUES =============
def get_default_baremes():
    """Génère les barèmes par défaut avec 20 tranches de 2.5km"""
    tranches = []
    for i in range(20):
        distance = (i + 1) * 2.5
        prix = 3.5 + (i * 0.1)  # Prix de base augmentant avec la distance
        tranches.append(TrancheBareme(distance_max=distance, prix=round(prix, 2)))
    return tranches


@router.get("/baremes")
async def get_baremes_config():
    config = await db.config.find_one({"id": "config_baremes"}, {"_id": 0})
    if not config:
        default_tranches = get_default_baremes()
        default_config = BaremesConfig(
            solide_avec_gasoil=[t.model_dump() for t in default_tranches],
            solide_sans_gasoil=[TrancheBareme(distance_max=t.distance_max, prix=round(t.prix * 0.85, 2)).model_dump() for t in default_tranches],
            liquide_avec_gasoil=[TrancheBareme(distance_max=t.distance_max, prix=round(t.prix * 1.1, 2)).model_dump() for t in default_tranches],
            liquide_sans_gasoil=[TrancheBareme(distance_max=t.distance_max, prix=round(t.prix * 0.95, 2)).model_dump() for t in default_tranches],
        )
        await db.config.insert_one(default_config.model_dump())
        return default_config.model_dump()
    return config


@router.put("/baremes")
async def update_baremes_config(config: BaremesConfigUpdate):
    existing = await db.config.find_one({"id": "config_baremes"})
    if not existing:
        # Créer la config par défaut d'abord
        await get_baremes_config()
    
    update_data = {k: v for k, v in config.model_dump().items() if v is not None}
    if update_data:
        # Convertir les TrancheBareme en dict si nécessaire
        for key in ['solide_avec_gasoil', 'solide_sans_gasoil', 'liquide_avec_gasoil', 'liquide_sans_gasoil']:
            if key in update_data and update_data[key]:
                update_data[key] = [t.model_dump() if hasattr(t, 'model_dump') else t for t in update_data[key]]
        
        await db.config.update_one({"id": "config_baremes"}, {"$set": update_data})
    
    return await db.config.find_one({"id": "config_baremes"}, {"_id": 0})


@router.put("/baremes/{bareme_type}")
async def update_bareme_type(bareme_type: str, tranches: list[TrancheBareme]):
    valid_types = ['solide_avec_gasoil', 'solide_sans_gasoil', 'liquide_avec_gasoil', 'liquide_sans_gasoil']
    if bareme_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Type de barème invalide. Valeurs acceptées: {valid_types}")
    
    existing = await db.config.find_one({"id": "config_baremes"})
    if not existing:
        await get_baremes_config()
    
    tranches_data = [t.model_dump() for t in tranches]
    await db.config.update_one(
        {"id": "config_baremes"},
        {"$set": {bareme_type: tranches_data}}
    )
    
    return await db.config.find_one({"id": "config_baremes"}, {"_id": 0})


@router.put("/baremes/taux-horaire-minimum")
async def update_taux_horaire_minimum(taux: float):
    existing = await db.config.find_one({"id": "config_baremes"})
    if not existing:
        await get_baremes_config()
    
    await db.config.update_one(
        {"id": "config_baremes"},
        {"$set": {"taux_horaire_minimum": taux}}
    )
    
    return await db.config.find_one({"id": "config_baremes"}, {"_id": 0})
