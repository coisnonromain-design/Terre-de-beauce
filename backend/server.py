from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Terre de Beauce ERP")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============= ENUMS =============
class VehicleStatus(str, Enum):
    DISPONIBLE = "disponible"
    EN_MISSION = "en_mission"
    MAINTENANCE = "maintenance"

class EquipmentType(str, Enum):
    REMORQUE = "remorque"
    CITERNE = "citerne"
    BENNE = "benne"

class ChantierStatus(str, Enum):
    PLANIFIE = "planifie"
    EN_COURS = "en_cours"
    TERMINE = "termine"
    ANNULE = "annule"

# ============= MODELS =============

# Tracteurs
class TracteurBase(BaseModel):
    identifiant: str  # Lettre (A, B, C, etc.)
    marque: str
    modele: str
    immatriculation: str
    annee: Optional[int] = None
    statut: VehicleStatus = VehicleStatus.DISPONIBLE
    notes: Optional[str] = None

class TracteurCreate(TracteurBase):
    pass

class Tracteur(TracteurBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Equipements (Remorques, Citernes, Bennes)
class EquipementBase(BaseModel):
    numero: str  # Numéro d'identification
    type: EquipmentType
    capacite: Optional[str] = None
    marque: Optional[str] = None
    immatriculation: Optional[str] = None
    statut: VehicleStatus = VehicleStatus.DISPONIBLE
    notes: Optional[str] = None

class EquipementCreate(EquipementBase):
    pass

class Equipement(EquipementBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Chauffeurs
class ChauffeurBase(BaseModel):
    nom: str
    prenom: str
    telephone: str
    email: Optional[str] = None
    permis: str
    date_embauche: Optional[str] = None
    disponible: bool = True
    notes: Optional[str] = None

class ChauffeurCreate(ChauffeurBase):
    pass

class Chauffeur(ChauffeurBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Clients
class ClientBase(BaseModel):
    raison_sociale: str
    siren: Optional[str] = None
    siret: Optional[str] = None
    tva_intracommunautaire: Optional[str] = None
    adresse: str
    code_postal: str
    ville: str
    pays: str = "France"
    telephone: Optional[str] = None
    email: Optional[str] = None
    contact_nom: Optional[str] = None
    contact_telephone: Optional[str] = None
    notes: Optional[str] = None

class ClientCreate(ClientBase):
    pass

class Client(ClientBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Affectation (pour un chantier)
class Affectation(BaseModel):
    tracteur_id: str
    tracteur_identifiant: Optional[str] = None
    equipement_id: str
    equipement_numero: Optional[str] = None
    chauffeur_id: str
    chauffeur_nom: Optional[str] = None

# Chantiers
class ChantierBase(BaseModel):
    reference: str
    client_id: str
    client_nom: Optional[str] = None
    lieu: str
    description: Optional[str] = None
    date_debut: str
    date_fin: Optional[str] = None
    statut: ChantierStatus = ChantierStatus.PLANIFIE
    affectations: List[Affectation] = []
    notes: Optional[str] = None

class ChantierCreate(ChantierBase):
    pass

class Chantier(ChantierBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Dashboard Stats
class DashboardStats(BaseModel):
    total_tracteurs: int
    tracteurs_disponibles: int
    total_equipements: int
    equipements_disponibles: int
    total_chauffeurs: int
    chauffeurs_disponibles: int
    total_clients: int
    chantiers_en_cours: int
    chantiers_planifies: int

# ============= HELPER FUNCTIONS =============
def serialize_doc(doc: dict) -> dict:
    """Remove MongoDB _id and convert datetime to ISO string"""
    if '_id' in doc:
        del doc['_id']
    if 'created_at' in doc and isinstance(doc['created_at'], datetime):
        doc['created_at'] = doc['created_at'].isoformat()
    return doc

# ============= TRACTEURS ROUTES =============
@api_router.get("/tracteurs", response_model=List[Tracteur])
async def get_tracteurs():
    tracteurs = await db.tracteurs.find({}, {"_id": 0}).to_list(1000)
    return tracteurs

@api_router.get("/tracteurs/{tracteur_id}", response_model=Tracteur)
async def get_tracteur(tracteur_id: str):
    tracteur = await db.tracteurs.find_one({"id": tracteur_id}, {"_id": 0})
    if not tracteur:
        raise HTTPException(status_code=404, detail="Tracteur non trouvé")
    return tracteur

@api_router.post("/tracteurs", response_model=Tracteur)
async def create_tracteur(input: TracteurCreate):
    tracteur = Tracteur(**input.model_dump())
    doc = tracteur.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.tracteurs.insert_one(doc)
    return tracteur

@api_router.put("/tracteurs/{tracteur_id}", response_model=Tracteur)
async def update_tracteur(tracteur_id: str, input: TracteurCreate):
    existing = await db.tracteurs.find_one({"id": tracteur_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Tracteur non trouvé")
    update_data = input.model_dump()
    await db.tracteurs.update_one({"id": tracteur_id}, {"$set": update_data})
    updated = await db.tracteurs.find_one({"id": tracteur_id}, {"_id": 0})
    return updated

@api_router.delete("/tracteurs/{tracteur_id}")
async def delete_tracteur(tracteur_id: str):
    result = await db.tracteurs.delete_one({"id": tracteur_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tracteur non trouvé")
    return {"message": "Tracteur supprimé"}

# ============= EQUIPEMENTS ROUTES =============
@api_router.get("/equipements", response_model=List[Equipement])
async def get_equipements(type: Optional[EquipmentType] = None):
    query = {}
    if type:
        query["type"] = type
    equipements = await db.equipements.find(query, {"_id": 0}).to_list(1000)
    return equipements

@api_router.get("/equipements/{equipement_id}", response_model=Equipement)
async def get_equipement(equipement_id: str):
    equipement = await db.equipements.find_one({"id": equipement_id}, {"_id": 0})
    if not equipement:
        raise HTTPException(status_code=404, detail="Équipement non trouvé")
    return equipement

@api_router.post("/equipements", response_model=Equipement)
async def create_equipement(input: EquipementCreate):
    equipement = Equipement(**input.model_dump())
    doc = equipement.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.equipements.insert_one(doc)
    return equipement

@api_router.put("/equipements/{equipement_id}", response_model=Equipement)
async def update_equipement(equipement_id: str, input: EquipementCreate):
    existing = await db.equipements.find_one({"id": equipement_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Équipement non trouvé")
    update_data = input.model_dump()
    await db.equipements.update_one({"id": equipement_id}, {"$set": update_data})
    updated = await db.equipements.find_one({"id": equipement_id}, {"_id": 0})
    return updated

@api_router.delete("/equipements/{equipement_id}")
async def delete_equipement(equipement_id: str):
    result = await db.equipements.delete_one({"id": equipement_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Équipement non trouvé")
    return {"message": "Équipement supprimé"}

# ============= CHAUFFEURS ROUTES =============
@api_router.get("/chauffeurs", response_model=List[Chauffeur])
async def get_chauffeurs():
    chauffeurs = await db.chauffeurs.find({}, {"_id": 0}).to_list(1000)
    return chauffeurs

@api_router.get("/chauffeurs/{chauffeur_id}", response_model=Chauffeur)
async def get_chauffeur(chauffeur_id: str):
    chauffeur = await db.chauffeurs.find_one({"id": chauffeur_id}, {"_id": 0})
    if not chauffeur:
        raise HTTPException(status_code=404, detail="Chauffeur non trouvé")
    return chauffeur

@api_router.post("/chauffeurs", response_model=Chauffeur)
async def create_chauffeur(input: ChauffeurCreate):
    chauffeur = Chauffeur(**input.model_dump())
    doc = chauffeur.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.chauffeurs.insert_one(doc)
    return chauffeur

@api_router.put("/chauffeurs/{chauffeur_id}", response_model=Chauffeur)
async def update_chauffeur(chauffeur_id: str, input: ChauffeurCreate):
    existing = await db.chauffeurs.find_one({"id": chauffeur_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Chauffeur non trouvé")
    update_data = input.model_dump()
    await db.chauffeurs.update_one({"id": chauffeur_id}, {"$set": update_data})
    updated = await db.chauffeurs.find_one({"id": chauffeur_id}, {"_id": 0})
    return updated

@api_router.delete("/chauffeurs/{chauffeur_id}")
async def delete_chauffeur(chauffeur_id: str):
    result = await db.chauffeurs.delete_one({"id": chauffeur_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Chauffeur non trouvé")
    return {"message": "Chauffeur supprimé"}

# ============= CLIENTS ROUTES =============
@api_router.get("/clients", response_model=List[Client])
async def get_clients():
    clients = await db.clients.find({}, {"_id": 0}).to_list(1000)
    return clients

@api_router.get("/clients/{client_id}", response_model=Client)
async def get_client(client_id: str):
    client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    return client

@api_router.post("/clients", response_model=Client)
async def create_client(input: ClientCreate):
    client = Client(**input.model_dump())
    doc = client.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.clients.insert_one(doc)
    return client

@api_router.put("/clients/{client_id}", response_model=Client)
async def update_client(client_id: str, input: ClientCreate):
    existing = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    update_data = input.model_dump()
    await db.clients.update_one({"id": client_id}, {"$set": update_data})
    updated = await db.clients.find_one({"id": client_id}, {"_id": 0})
    return updated

@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str):
    result = await db.clients.delete_one({"id": client_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    return {"message": "Client supprimé"}

# ============= CHANTIERS ROUTES =============
@api_router.get("/chantiers", response_model=List[Chantier])
async def get_chantiers(statut: Optional[ChantierStatus] = None):
    query = {}
    if statut:
        query["statut"] = statut
    chantiers = await db.chantiers.find(query, {"_id": 0}).to_list(1000)
    return chantiers

@api_router.get("/chantiers/{chantier_id}", response_model=Chantier)
async def get_chantier(chantier_id: str):
    chantier = await db.chantiers.find_one({"id": chantier_id}, {"_id": 0})
    if not chantier:
        raise HTTPException(status_code=404, detail="Chantier non trouvé")
    return chantier

@api_router.post("/chantiers", response_model=Chantier)
async def create_chantier(input: ChantierCreate):
    # Enrich affectations with names
    enriched_affectations = []
    for aff in input.affectations:
        aff_dict = aff.model_dump()
        # Get tracteur identifiant
        tracteur = await db.tracteurs.find_one({"id": aff.tracteur_id}, {"_id": 0})
        if tracteur:
            aff_dict['tracteur_identifiant'] = tracteur.get('identifiant')
        # Get equipement numero
        equipement = await db.equipements.find_one({"id": aff.equipement_id}, {"_id": 0})
        if equipement:
            aff_dict['equipement_numero'] = equipement.get('numero')
        # Get chauffeur name
        chauffeur = await db.chauffeurs.find_one({"id": aff.chauffeur_id}, {"_id": 0})
        if chauffeur:
            aff_dict['chauffeur_nom'] = f"{chauffeur.get('prenom', '')} {chauffeur.get('nom', '')}".strip()
        enriched_affectations.append(aff_dict)
    
    # Get client name
    client = await db.clients.find_one({"id": input.client_id}, {"_id": 0})
    client_nom = client.get('raison_sociale') if client else None
    
    chantier_data = input.model_dump()
    chantier_data['affectations'] = enriched_affectations
    chantier_data['client_nom'] = client_nom
    
    chantier = Chantier(**chantier_data)
    doc = chantier.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.chantiers.insert_one(doc)
    return chantier

@api_router.put("/chantiers/{chantier_id}", response_model=Chantier)
async def update_chantier(chantier_id: str, input: ChantierCreate):
    existing = await db.chantiers.find_one({"id": chantier_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Chantier non trouvé")
    
    # Enrich affectations with names
    enriched_affectations = []
    for aff in input.affectations:
        aff_dict = aff.model_dump()
        tracteur = await db.tracteurs.find_one({"id": aff.tracteur_id}, {"_id": 0})
        if tracteur:
            aff_dict['tracteur_identifiant'] = tracteur.get('identifiant')
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

@api_router.delete("/chantiers/{chantier_id}")
async def delete_chantier(chantier_id: str):
    result = await db.chantiers.delete_one({"id": chantier_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Chantier non trouvé")
    return {"message": "Chantier supprimé"}

# ============= DASHBOARD STATS =============
@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    # Tracteurs
    total_tracteurs = await db.tracteurs.count_documents({})
    tracteurs_disponibles = await db.tracteurs.count_documents({"statut": VehicleStatus.DISPONIBLE})
    
    # Equipements
    total_equipements = await db.equipements.count_documents({})
    equipements_disponibles = await db.equipements.count_documents({"statut": VehicleStatus.DISPONIBLE})
    
    # Chauffeurs
    total_chauffeurs = await db.chauffeurs.count_documents({})
    chauffeurs_disponibles = await db.chauffeurs.count_documents({"disponible": True})
    
    # Clients
    total_clients = await db.clients.count_documents({})
    
    # Chantiers
    chantiers_en_cours = await db.chantiers.count_documents({"statut": ChantierStatus.EN_COURS})
    chantiers_planifies = await db.chantiers.count_documents({"statut": ChantierStatus.PLANIFIE})
    
    return DashboardStats(
        total_tracteurs=total_tracteurs,
        tracteurs_disponibles=tracteurs_disponibles,
        total_equipements=total_equipements,
        equipements_disponibles=equipements_disponibles,
        total_chauffeurs=total_chauffeurs,
        chauffeurs_disponibles=chauffeurs_disponibles,
        total_clients=total_clients,
        chantiers_en_cours=chantiers_en_cours,
        chantiers_planifies=chantiers_planifies
    )

# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "Terre de Beauce ERP API", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
