from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import FileResponse, RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, date
from enum import Enum
import io
import base64

# DocuSign imports
from docusign_esign import ApiClient, EnvelopesApi, EnvelopeDefinition, Document, Signer, SignHere, Tabs, Recipients

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# DocuSign configuration
DOCUSIGN_INTEGRATION_KEY = os.environ.get('DOCUSIGN_INTEGRATION_KEY')
DOCUSIGN_SECRET_KEY = os.environ.get('DOCUSIGN_SECRET_KEY')
DOCUSIGN_ACCOUNT_ID = os.environ.get('DOCUSIGN_ACCOUNT_ID')
DOCUSIGN_AUTH_SERVER = os.environ.get('DOCUSIGN_AUTH_SERVER', 'account-d.docusign.com')
DOCUSIGN_BASE_URL = os.environ.get('DOCUSIGN_BASE_URL', 'https://demo.docusign.net/restapi')

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

class MethodeFacturation(str, Enum):
    HEURE = "heure"
    TONNE = "tonne"
    JOURNEE = "journee"

class FactureStatus(str, Enum):
    BROUILLON = "brouillon"
    EMISE = "emise"
    ENVOYEE = "envoyee"
    SIGNEE = "signee"
    PAYEE = "payee"

class ContratStatus(str, Enum):
    BROUILLON = "brouillon"
    ENVOYE = "envoye"
    SIGNE = "signe"
    ANNULE = "annule"

class TransportType(str, Enum):
    SOLIDE = "solide"
    LIQUIDE = "liquide"

# ============= MODELS =============

# Configuration Entreprise
class EntrepriseConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "config_entreprise"
    raison_sociale: str = "Terre de Beauce"
    adresse: str = "Ferme de Mennessard"
    code_postal: str = "91660"
    ville: str = "Le Mérévillois"
    pays: str = "France"
    siren: str = "953286333"
    siret: str = "95328633300018"
    tva_intracommunautaire: str = "FR57953286333"
    email: str = "r.coisnon@terredebeauce.com"
    telephone: Optional[str] = None
    iban: Optional[str] = None
    bic: Optional[str] = None
    logo_url: Optional[str] = None

class EntrepriseConfigUpdate(BaseModel):
    raison_sociale: Optional[str] = None
    adresse: Optional[str] = None
    code_postal: Optional[str] = None
    ville: Optional[str] = None
    pays: Optional[str] = None
    siren: Optional[str] = None
    siret: Optional[str] = None
    tva_intracommunautaire: Optional[str] = None
    email: Optional[str] = None
    telephone: Optional[str] = None
    iban: Optional[str] = None
    bic: Optional[str] = None

# Tracteurs
class TracteurBase(BaseModel):
    identifiant: str
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
    numero: str
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
    code_acces: Optional[str] = None  # Code pour accès chauffeur
    notes: Optional[str] = None

class ChauffeurCreate(ChauffeurBase):
    pass

class Chauffeur(ChauffeurBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Tarification Client
class TarifClient(BaseModel):
    methode: MethodeFacturation
    prix_unitaire: float  # €/h, €/tonne ou €/jour
    description: Optional[str] = None

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
    # Tarification
    tarifs: List[TarifClient] = []
    notes: Optional[str] = None

class ClientCreate(ClientBase):
    pass

class Client(ClientBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Affectation (pour un chantier) - Simplifiée
class Affectation(BaseModel):
    tracteur_id: str
    tracteur_identifiant: Optional[str] = None
    equipement_id: str
    equipement_numero: Optional[str] = None
    equipement_type: Optional[str] = None
    chauffeur_id: str
    chauffeur_nom: Optional[str] = None

# Tarification Chantier
class TarifChantier(BaseModel):
    methode: MethodeFacturation
    prix_unitaire: float
    description: Optional[str] = None

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
    # Tarification du chantier
    tarifs: List[TarifChantier] = []
    transport_type: TransportType = TransportType.SOLIDE
    notes: Optional[str] = None

class ChantierCreate(ChantierBase):
    pass

class Chantier(ChantierBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Pointage Chauffeur (Saisie heures et volumes)
class PointageBase(BaseModel):
    chantier_id: str
    chauffeur_id: str
    date: str  # YYYY-MM-DD
    heures_travaillees: float = 0
    tonnage_transporte: float = 0
    nombre_rotations: int = 0
    commentaire: Optional[str] = None

class PointageCreate(PointageBase):
    pass

class Pointage(PointageBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    chantier_reference: Optional[str] = None
    chauffeur_nom: Optional[str] = None
    client_nom: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Ligne de facture
class LigneFacture(BaseModel):
    description: str
    quantite: float
    unite: str  # "heures", "tonnes", "jours"
    prix_unitaire: float
    montant_ht: float

# Facture
class FactureBase(BaseModel):
    chantier_id: str
    client_id: str
    numero: str
    date_emission: str
    date_echeance: str
    lignes: List[LigneFacture] = []
    montant_ht: float = 0
    taux_tva: float = 20.0
    montant_tva: float = 0
    montant_ttc: float = 0
    statut: FactureStatus = FactureStatus.BROUILLON
    notes: Optional[str] = None
    # Infos pour PDF
    client_raison_sociale: Optional[str] = None
    client_adresse: Optional[str] = None
    client_siret: Optional[str] = None
    client_tva: Optional[str] = None
    chantier_reference: Optional[str] = None
    chantier_lieu: Optional[str] = None

class FactureCreate(BaseModel):
    chantier_id: str
    date_echeance: str
    notes: Optional[str] = None

class Facture(FactureBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Contrat de transport
class ContratBase(BaseModel):
    client_id: str
    type_transport: TransportType
    reference: str
    date_creation: str
    conditions: Optional[str] = None
    statut: ContratStatus = ContratStatus.BROUILLON
    # Infos client
    client_raison_sociale: Optional[str] = None
    client_adresse: Optional[str] = None
    client_siret: Optional[str] = None
    client_email: Optional[str] = None
    # Signature
    docusign_envelope_id: Optional[str] = None
    date_signature: Optional[str] = None

class ContratCreate(BaseModel):
    client_id: str
    type_transport: TransportType
    conditions: Optional[str] = None

class Contrat(ContratBase):
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
    factures_en_attente: int = 0
    ca_mois: float = 0

# Auth Chauffeur
class ChauffeurLogin(BaseModel):
    code_acces: str

class ChauffeurSession(BaseModel):
    chauffeur_id: str
    chauffeur_nom: str
    token: str

# ============= HELPER FUNCTIONS =============
def serialize_doc(doc: dict) -> dict:
    if '_id' in doc:
        del doc['_id']
    if 'created_at' in doc and isinstance(doc['created_at'], datetime):
        doc['created_at'] = doc['created_at'].isoformat()
    if 'updated_at' in doc and isinstance(doc['updated_at'], datetime):
        doc['updated_at'] = doc['updated_at'].isoformat()
    return doc

def generate_numero_facture():
    now = datetime.now()
    return f"FAC-{now.year}-{now.month:02d}-{str(uuid.uuid4())[:8].upper()}"

def generate_reference_contrat(type_transport: str):
    now = datetime.now()
    prefix = "CTR-S" if type_transport == "solide" else "CTR-L"
    return f"{prefix}-{now.year}-{str(uuid.uuid4())[:6].upper()}"

# ============= ENTREPRISE CONFIG ROUTES =============
@api_router.get("/config/entreprise", response_model=EntrepriseConfig)
async def get_entreprise_config():
    config = await db.config.find_one({"id": "config_entreprise"}, {"_id": 0})
    if not config:
        # Créer config par défaut
        default_config = EntrepriseConfig()
        await db.config.insert_one(default_config.model_dump())
        return default_config
    return config

@api_router.put("/config/entreprise", response_model=EntrepriseConfig)
async def update_entreprise_config(input: EntrepriseConfigUpdate):
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    await db.config.update_one(
        {"id": "config_entreprise"},
        {"$set": update_data},
        upsert=True
    )
    config = await db.config.find_one({"id": "config_entreprise"}, {"_id": 0})
    return config

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
    chauffeur_data = input.model_dump()
    # Générer un code d'accès automatique si non fourni
    if not chauffeur_data.get('code_acces'):
        chauffeur_data['code_acces'] = str(uuid.uuid4())[:6].upper()
    chauffeur = Chauffeur(**chauffeur_data)
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

# ============= AUTH CHAUFFEUR =============
@api_router.post("/chauffeur/login", response_model=ChauffeurSession)
async def chauffeur_login(input: ChauffeurLogin):
    chauffeur = await db.chauffeurs.find_one({"code_acces": input.code_acces}, {"_id": 0})
    if not chauffeur:
        raise HTTPException(status_code=401, detail="Code d'accès invalide")
    
    # Générer un token simple
    token = str(uuid.uuid4())
    
    return ChauffeurSession(
        chauffeur_id=chauffeur['id'],
        chauffeur_nom=f"{chauffeur['prenom']} {chauffeur['nom']}",
        token=token
    )

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
        tracteur = await db.tracteurs.find_one({"id": aff.tracteur_id}, {"_id": 0})
        if tracteur:
            aff_dict['tracteur_identifiant'] = tracteur.get('identifiant')
        equipement = await db.equipements.find_one({"id": aff.equipement_id}, {"_id": 0})
        if equipement:
            aff_dict['equipement_numero'] = equipement.get('numero')
            aff_dict['equipement_type'] = equipement.get('type')
        chauffeur = await db.chauffeurs.find_one({"id": aff.chauffeur_id}, {"_id": 0})
        if chauffeur:
            aff_dict['chauffeur_nom'] = f"{chauffeur.get('prenom', '')} {chauffeur.get('nom', '')}".strip()
        enriched_affectations.append(aff_dict)
    
    # Get client name
    client = await db.clients.find_one({"id": input.client_id}, {"_id": 0})
    client_nom = client.get('raison_sociale') if client else None
    
    # Si pas de tarifs définis, récupérer ceux du client
    tarifs = input.tarifs
    if not tarifs and client and client.get('tarifs'):
        tarifs = [TarifChantier(**t) for t in client.get('tarifs', [])]
    
    chantier_data = input.model_dump()
    chantier_data['affectations'] = enriched_affectations
    chantier_data['client_nom'] = client_nom
    chantier_data['tarifs'] = [t.model_dump() if hasattr(t, 'model_dump') else t for t in tarifs]
    
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
    
    enriched_affectations = []
    for aff in input.affectations:
        aff_dict = aff.model_dump()
        tracteur = await db.tracteurs.find_one({"id": aff.tracteur_id}, {"_id": 0})
        if tracteur:
            aff_dict['tracteur_identifiant'] = tracteur.get('identifiant')
        equipement = await db.equipements.find_one({"id": aff.equipement_id}, {"_id": 0})
        if equipement:
            aff_dict['equipement_numero'] = equipement.get('numero')
            aff_dict['equipement_type'] = equipement.get('type')
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

# Chantiers pour un chauffeur
@api_router.get("/chauffeur/{chauffeur_id}/chantiers")
async def get_chauffeur_chantiers(chauffeur_id: str):
    # Récupérer les chantiers où le chauffeur est affecté et qui sont en cours ou planifiés
    chantiers = await db.chantiers.find({
        "affectations.chauffeur_id": chauffeur_id,
        "statut": {"$in": ["planifie", "en_cours"]}
    }, {"_id": 0}).to_list(100)
    return chantiers

# ============= POINTAGES ROUTES =============
@api_router.get("/pointages", response_model=List[Pointage])
async def get_pointages(chantier_id: Optional[str] = None, chauffeur_id: Optional[str] = None):
    query = {}
    if chantier_id:
        query["chantier_id"] = chantier_id
    if chauffeur_id:
        query["chauffeur_id"] = chauffeur_id
    pointages = await db.pointages.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    return pointages

@api_router.get("/pointages/{pointage_id}", response_model=Pointage)
async def get_pointage(pointage_id: str):
    pointage = await db.pointages.find_one({"id": pointage_id}, {"_id": 0})
    if not pointage:
        raise HTTPException(status_code=404, detail="Pointage non trouvé")
    return pointage

@api_router.post("/pointages", response_model=Pointage)
async def create_pointage(input: PointageCreate):
    # Vérifier que le chauffeur est bien affecté au chantier
    chantier = await db.chantiers.find_one({"id": input.chantier_id}, {"_id": 0})
    if not chantier:
        raise HTTPException(status_code=404, detail="Chantier non trouvé")
    
    chauffeur = await db.chauffeurs.find_one({"id": input.chauffeur_id}, {"_id": 0})
    if not chauffeur:
        raise HTTPException(status_code=404, detail="Chauffeur non trouvé")
    
    # Vérifier si un pointage existe déjà pour ce jour
    existing = await db.pointages.find_one({
        "chantier_id": input.chantier_id,
        "chauffeur_id": input.chauffeur_id,
        "date": input.date
    }, {"_id": 0})
    
    if existing:
        # Mettre à jour le pointage existant
        update_data = input.model_dump()
        update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
        await db.pointages.update_one(
            {"id": existing['id']},
            {"$set": update_data}
        )
        updated = await db.pointages.find_one({"id": existing['id']}, {"_id": 0})
        return updated
    
    # Créer un nouveau pointage
    pointage_data = input.model_dump()
    pointage_data['chantier_reference'] = chantier.get('reference')
    pointage_data['chauffeur_nom'] = f"{chauffeur.get('prenom', '')} {chauffeur.get('nom', '')}".strip()
    pointage_data['client_nom'] = chantier.get('client_nom')
    
    pointage = Pointage(**pointage_data)
    doc = pointage.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.pointages.insert_one(doc)
    return pointage

@api_router.put("/pointages/{pointage_id}", response_model=Pointage)
async def update_pointage(pointage_id: str, input: PointageCreate):
    existing = await db.pointages.find_one({"id": pointage_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Pointage non trouvé")
    
    update_data = input.model_dump()
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.pointages.update_one({"id": pointage_id}, {"$set": update_data})
    updated = await db.pointages.find_one({"id": pointage_id}, {"_id": 0})
    return updated

@api_router.delete("/pointages/{pointage_id}")
async def delete_pointage(pointage_id: str):
    result = await db.pointages.delete_one({"id": pointage_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pointage non trouvé")
    return {"message": "Pointage supprimé"}

# Récapitulatif pointages pour un chantier
@api_router.get("/chantiers/{chantier_id}/recap")
async def get_chantier_recap(chantier_id: str):
    chantier = await db.chantiers.find_one({"id": chantier_id}, {"_id": 0})
    if not chantier:
        raise HTTPException(status_code=404, detail="Chantier non trouvé")
    
    pointages = await db.pointages.find({"chantier_id": chantier_id}, {"_id": 0}).to_list(1000)
    
    total_heures = sum(p.get('heures_travaillees', 0) for p in pointages)
    total_tonnage = sum(p.get('tonnage_transporte', 0) for p in pointages)
    total_rotations = sum(p.get('nombre_rotations', 0) for p in pointages)
    nombre_jours = len(set(p.get('date') for p in pointages))
    
    # Calculer le montant selon les tarifs
    montant_ht = 0
    lignes = []
    tarifs = chantier.get('tarifs', [])
    
    for tarif in tarifs:
        methode = tarif.get('methode')
        prix = tarif.get('prix_unitaire', 0)
        
        if methode == 'heure' and total_heures > 0:
            montant = total_heures * prix
            lignes.append({
                "description": f"Heures de travail",
                "quantite": total_heures,
                "unite": "heures",
                "prix_unitaire": prix,
                "montant_ht": montant
            })
            montant_ht += montant
        elif methode == 'tonne' and total_tonnage > 0:
            montant = total_tonnage * prix
            lignes.append({
                "description": f"Transport ({chantier.get('transport_type', 'solide')})",
                "quantite": total_tonnage,
                "unite": "tonnes",
                "prix_unitaire": prix,
                "montant_ht": montant
            })
            montant_ht += montant
        elif methode == 'journee' and nombre_jours > 0:
            montant = nombre_jours * prix
            lignes.append({
                "description": "Forfait journalier",
                "quantite": nombre_jours,
                "unite": "jours",
                "prix_unitaire": prix,
                "montant_ht": montant
            })
            montant_ht += montant
    
    return {
        "chantier": chantier,
        "total_heures": total_heures,
        "total_tonnage": total_tonnage,
        "total_rotations": total_rotations,
        "nombre_jours": nombre_jours,
        "pointages": pointages,
        "lignes_facture": lignes,
        "montant_ht": montant_ht,
        "montant_tva": montant_ht * 0.20,
        "montant_ttc": montant_ht * 1.20
    }

# ============= FACTURES ROUTES =============
@api_router.get("/factures", response_model=List[Facture])
async def get_factures(statut: Optional[FactureStatus] = None, client_id: Optional[str] = None):
    query = {}
    if statut:
        query["statut"] = statut
    if client_id:
        query["client_id"] = client_id
    factures = await db.factures.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return factures

@api_router.get("/factures/{facture_id}", response_model=Facture)
async def get_facture(facture_id: str):
    facture = await db.factures.find_one({"id": facture_id}, {"_id": 0})
    if not facture:
        raise HTTPException(status_code=404, detail="Facture non trouvée")
    return facture

@api_router.post("/factures/generer", response_model=Facture)
async def generer_facture(input: FactureCreate):
    """Génère automatiquement une facture à partir du récapitulatif d'un chantier"""
    
    # Récupérer le chantier
    chantier = await db.chantiers.find_one({"id": input.chantier_id}, {"_id": 0})
    if not chantier:
        raise HTTPException(status_code=404, detail="Chantier non trouvé")
    
    # Récupérer le client
    client = await db.clients.find_one({"id": chantier.get('client_id')}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    
    # Récupérer la config entreprise
    config = await db.config.find_one({"id": "config_entreprise"}, {"_id": 0})
    if not config:
        config = EntrepriseConfig().model_dump()
    
    # Calculer les lignes de facture depuis les pointages
    pointages = await db.pointages.find({"chantier_id": input.chantier_id}, {"_id": 0}).to_list(1000)
    
    total_heures = sum(p.get('heures_travaillees', 0) for p in pointages)
    total_tonnage = sum(p.get('tonnage_transporte', 0) for p in pointages)
    nombre_jours = len(set(p.get('date') for p in pointages))
    
    lignes = []
    montant_ht = 0
    tarifs = chantier.get('tarifs', [])
    
    for tarif in tarifs:
        methode = tarif.get('methode')
        prix = tarif.get('prix_unitaire', 0)
        
        if methode == 'heure' and total_heures > 0:
            montant = round(total_heures * prix, 2)
            lignes.append(LigneFacture(
                description=f"Heures de travail - Chantier {chantier.get('reference')}",
                quantite=total_heures,
                unite="heures",
                prix_unitaire=prix,
                montant_ht=montant
            ))
            montant_ht += montant
        elif methode == 'tonne' and total_tonnage > 0:
            montant = round(total_tonnage * prix, 2)
            lignes.append(LigneFacture(
                description=f"Transport {chantier.get('transport_type', 'solide')} - {chantier.get('lieu')}",
                quantite=total_tonnage,
                unite="tonnes",
                prix_unitaire=prix,
                montant_ht=montant
            ))
            montant_ht += montant
        elif methode == 'journee' and nombre_jours > 0:
            montant = round(nombre_jours * prix, 2)
            lignes.append(LigneFacture(
                description=f"Forfait journalier - Chantier {chantier.get('reference')}",
                quantite=nombre_jours,
                unite="jours",
                prix_unitaire=prix,
                montant_ht=montant
            ))
            montant_ht += montant
    
    if not lignes:
        raise HTTPException(status_code=400, detail="Aucune donnée à facturer (vérifiez les pointages et tarifs)")
    
    taux_tva = 20.0
    montant_tva = round(montant_ht * (taux_tva / 100), 2)
    montant_ttc = round(montant_ht + montant_tva, 2)
    
    facture = Facture(
        chantier_id=input.chantier_id,
        client_id=client['id'],
        numero=generate_numero_facture(),
        date_emission=datetime.now().strftime("%Y-%m-%d"),
        date_echeance=input.date_echeance,
        lignes=[l.model_dump() for l in lignes],
        montant_ht=montant_ht,
        taux_tva=taux_tva,
        montant_tva=montant_tva,
        montant_ttc=montant_ttc,
        statut=FactureStatus.BROUILLON,
        notes=input.notes,
        client_raison_sociale=client.get('raison_sociale'),
        client_adresse=f"{client.get('adresse')}, {client.get('code_postal')} {client.get('ville')}",
        client_siret=client.get('siret'),
        client_tva=client.get('tva_intracommunautaire'),
        chantier_reference=chantier.get('reference'),
        chantier_lieu=chantier.get('lieu')
    )
    
    doc = facture.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.factures.insert_one(doc)
    
    return facture

@api_router.put("/factures/{facture_id}/statut")
async def update_facture_statut(facture_id: str, statut: FactureStatus):
    existing = await db.factures.find_one({"id": facture_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Facture non trouvée")
    
    await db.factures.update_one({"id": facture_id}, {"$set": {"statut": statut}})
    updated = await db.factures.find_one({"id": facture_id}, {"_id": 0})
    return updated

@api_router.delete("/factures/{facture_id}")
async def delete_facture(facture_id: str):
    result = await db.factures.delete_one({"id": facture_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Facture non trouvée")
    return {"message": "Facture supprimée"}

# ============= CONTRATS ROUTES =============
@api_router.get("/contrats", response_model=List[Contrat])
async def get_contrats(client_id: Optional[str] = None, statut: Optional[ContratStatus] = None):
    query = {}
    if client_id:
        query["client_id"] = client_id
    if statut:
        query["statut"] = statut
    contrats = await db.contrats.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return contrats

@api_router.get("/contrats/{contrat_id}", response_model=Contrat)
async def get_contrat(contrat_id: str):
    contrat = await db.contrats.find_one({"id": contrat_id}, {"_id": 0})
    if not contrat:
        raise HTTPException(status_code=404, detail="Contrat non trouvé")
    return contrat

@api_router.post("/contrats", response_model=Contrat)
async def create_contrat(input: ContratCreate):
    client = await db.clients.find_one({"id": input.client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    
    contrat = Contrat(
        client_id=input.client_id,
        type_transport=input.type_transport,
        reference=generate_reference_contrat(input.type_transport),
        date_creation=datetime.now().strftime("%Y-%m-%d"),
        conditions=input.conditions,
        statut=ContratStatus.BROUILLON,
        client_raison_sociale=client.get('raison_sociale'),
        client_adresse=f"{client.get('adresse')}, {client.get('code_postal')} {client.get('ville')}",
        client_siret=client.get('siret'),
        client_email=client.get('email')
    )
    
    doc = contrat.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.contrats.insert_one(doc)
    return contrat

@api_router.put("/contrats/{contrat_id}/statut")
async def update_contrat_statut(contrat_id: str, statut: ContratStatus):
    existing = await db.contrats.find_one({"id": contrat_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Contrat non trouvé")
    
    await db.contrats.update_one({"id": contrat_id}, {"$set": {"statut": statut}})
    updated = await db.contrats.find_one({"id": contrat_id}, {"_id": 0})
    return updated

@api_router.delete("/contrats/{contrat_id}")
async def delete_contrat(contrat_id: str):
    result = await db.contrats.delete_one({"id": contrat_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contrat non trouvé")
    return {"message": "Contrat supprimé"}

# ============= DASHBOARD STATS =============
@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    total_tracteurs = await db.tracteurs.count_documents({})
    tracteurs_disponibles = await db.tracteurs.count_documents({"statut": VehicleStatus.DISPONIBLE})
    total_equipements = await db.equipements.count_documents({})
    equipements_disponibles = await db.equipements.count_documents({"statut": VehicleStatus.DISPONIBLE})
    total_chauffeurs = await db.chauffeurs.count_documents({})
    chauffeurs_disponibles = await db.chauffeurs.count_documents({"disponible": True})
    total_clients = await db.clients.count_documents({})
    chantiers_en_cours = await db.chantiers.count_documents({"statut": ChantierStatus.EN_COURS})
    chantiers_planifies = await db.chantiers.count_documents({"statut": ChantierStatus.PLANIFIE})
    
    # Factures en attente
    factures_en_attente = await db.factures.count_documents({"statut": {"$in": ["brouillon", "emise", "envoyee"]}})
    
    # CA du mois (factures payées ou signées)
    debut_mois = datetime.now().replace(day=1).strftime("%Y-%m-%d")
    factures_mois = await db.factures.find({
        "statut": {"$in": ["signee", "payee"]},
        "date_emission": {"$gte": debut_mois}
    }, {"_id": 0, "montant_ht": 1}).to_list(1000)
    ca_mois = sum(f.get('montant_ht', 0) for f in factures_mois)
    
    return DashboardStats(
        total_tracteurs=total_tracteurs,
        tracteurs_disponibles=tracteurs_disponibles,
        total_equipements=total_equipements,
        equipements_disponibles=equipements_disponibles,
        total_chauffeurs=total_chauffeurs,
        chauffeurs_disponibles=chauffeurs_disponibles,
        total_clients=total_clients,
        chantiers_en_cours=chantiers_en_cours,
        chantiers_planifies=chantiers_planifies,
        factures_en_attente=factures_en_attente,
        ca_mois=ca_mois
    )

# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "Terre de Beauce ERP API", "version": "2.0.0"}

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
