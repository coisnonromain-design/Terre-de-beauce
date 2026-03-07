"""
Enums and Models for Terre de Beauce ERP
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from enum import Enum


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


# ============= CONFIG MODELS =============
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
    telephone: str = ""
    logo_url: Optional[str] = None


class EntrepriseConfigUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
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
    logo_url: Optional[str] = None


# ============= TRACTEURS MODELS =============
class TracteurBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    immatriculation: str
    marque: str
    modele: str
    annee: Optional[int] = None
    statut: VehicleStatus = VehicleStatus.DISPONIBLE
    notes: Optional[str] = None


class TracteurCreate(TracteurBase):
    pass


class Tracteur(TracteurBase):
    id: str
    date_creation: str


# ============= EQUIPEMENTS MODELS =============
class EquipementBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    numero: str
    type: EquipmentType
    marque: Optional[str] = None
    capacite: Optional[float] = None
    statut: VehicleStatus = VehicleStatus.DISPONIBLE
    notes: Optional[str] = None


class EquipementCreate(EquipementBase):
    pass


class Equipement(EquipementBase):
    id: str
    date_creation: str


# ============= CHAUFFEURS MODELS =============
class ChauffeurBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    nom: str
    prenom: str
    telephone: Optional[str] = None
    email: Optional[str] = None
    permis: List[str] = []
    date_embauche: Optional[str] = None
    disponibilite: bool = True
    notes: Optional[str] = None


class ChauffeurCreate(ChauffeurBase):
    pass


class Chauffeur(ChauffeurBase):
    id: str
    code_acces: str
    date_creation: str


class ChauffeurLogin(BaseModel):
    code_acces: str


class ChauffeurSession(BaseModel):
    chauffeur_id: str
    nom: str
    prenom: str


# ============= CLIENTS MODELS =============
class TarifClient(BaseModel):
    heure: Optional[float] = None
    tonne: Optional[float] = None
    journee: Optional[float] = None


class ClientBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    raison_sociale: str
    siren: Optional[str] = None
    siret: Optional[str] = None
    tva_intracommunautaire: Optional[str] = None
    adresse: Optional[str] = None
    code_postal: Optional[str] = None
    ville: Optional[str] = None
    pays: str = "France"
    contact_nom: Optional[str] = None
    contact_email: Optional[str] = None
    contact_telephone: Optional[str] = None
    tarifs: Optional[TarifClient] = None
    notes: Optional[str] = None


class ClientCreate(ClientBase):
    pass


class Client(ClientBase):
    id: str
    date_creation: str


# ============= CHANTIERS MODELS =============
class Affectation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    tracteur_id: Optional[str] = None
    tracteur_immat: Optional[str] = None
    equipement_id: Optional[str] = None
    equipement_numero: Optional[str] = None
    chauffeur_id: Optional[str] = None
    chauffeur_nom: Optional[str] = None


class TarifChantier(BaseModel):
    heure: Optional[float] = None
    tonne: Optional[float] = None
    journee: Optional[float] = None


class ChantierBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    reference: str
    client_id: str
    client_nom: Optional[str] = None
    lieu: str
    description: Optional[str] = None
    date_debut: str
    date_fin: Optional[str] = None
    statut: ChantierStatus = ChantierStatus.PLANIFIE
    affectations: List[Affectation] = []
    tarifs: Optional[TarifChantier] = None
    methode_facturation: MethodeFacturation = MethodeFacturation.HEURE
    transport_type: TransportType = TransportType.SOLIDE
    avec_gasoil: bool = True
    notes: Optional[str] = None
    numero_contrat: Optional[str] = None


class ChantierCreate(ChantierBase):
    pass


class Chantier(ChantierBase):
    id: str
    date_creation: str


# ============= POINTAGES MODELS =============
class Tour(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: Optional[str] = None
    volume: float = 0
    distance: float = 0
    unite_volume: str = "tonnes"
    commentaire: Optional[str] = None


class PointageBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    chauffeur_id: str
    chantier_id: str
    date: str
    heures_travaillees: float = 0
    tours: List[Tour] = []


class PointageCreate(BaseModel):
    chauffeur_id: str
    chantier_id: str
    date: str
    heures_travaillees: float = 0
    tours: List[Tour] = []


class Pointage(PointageBase):
    id: str
    chauffeur_nom: Optional[str] = None
    chantier_reference: Optional[str] = None
    client_nom: Optional[str] = None
    date_creation: str
    total_volume: float = 0
    total_distance: float = 0
    nombre_tours: int = 0
    tonnage_transporte: Optional[float] = 0
    nombre_rotations: Optional[int] = 0


# ============= BAREMES MODELS =============
class TrancheBareme(BaseModel):
    distance_max: float
    prix: float


class Bareme(BaseModel):
    tranches: List[TrancheBareme] = []


class BaremesConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "config_baremes"
    solide_avec_gasoil: List[TrancheBareme] = []
    solide_sans_gasoil: List[TrancheBareme] = []
    liquide_avec_gasoil: List[TrancheBareme] = []
    liquide_sans_gasoil: List[TrancheBareme] = []
    taux_horaire_minimum: float = 85.0


class BaremesConfigUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    solide_avec_gasoil: Optional[List[TrancheBareme]] = None
    solide_sans_gasoil: Optional[List[TrancheBareme]] = None
    liquide_avec_gasoil: Optional[List[TrancheBareme]] = None
    liquide_sans_gasoil: Optional[List[TrancheBareme]] = None
    taux_horaire_minimum: Optional[float] = None


# ============= FACTURES MODELS =============
class LigneFacture(BaseModel):
    description: str
    quantite: float
    unite: str
    prix_unitaire: float
    montant_ht: float


class FactureBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    numero: str
    client_id: str
    client_raison_sociale: Optional[str] = None
    client_adresse: Optional[str] = None
    client_siret: Optional[str] = None
    client_tva: Optional[str] = None
    client_email: Optional[str] = None
    chantier_id: str
    chantier_reference: Optional[str] = None
    chantier_lieu: Optional[str] = None
    contrat_ccpa_id: Optional[str] = None
    contrat_numero: Optional[str] = None
    date_emission: str
    date_echeance: str
    lignes: List[LigneFacture] = []
    montant_ht: float = 0
    taux_tva: float = 20.0
    montant_tva: float = 0
    montant_ttc: float = 0
    statut: FactureStatus = FactureStatus.BROUILLON
    notes: Optional[str] = None
    docusign_envelope_id: Optional[str] = None
    docusign_status: Optional[str] = None


class FactureCreate(BaseModel):
    chantier_id: str
    date_echeance: str
    notes: Optional[str] = None


class Facture(FactureBase):
    id: str
    date_creation: str


# ============= CONTRATS CCPA MODELS =============
class ContratCCPA(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    chantier_id: str
    numero_contrat: str
    client_id: Optional[str] = None
    client_nom: Optional[str] = None
    client_interlocuteur: Optional[str] = None
    client_adresse: Optional[str] = None
    client_email: Optional[str] = None
    client_telephone: Optional[str] = None
    chantier_reference: Optional[str] = None
    chantier_lieu: Optional[str] = None
    chantier_description: Optional[str] = None
    date_debut: Optional[str] = None
    date_fin: Optional[str] = None
    transport_type: Optional[str] = None
    avec_gasoil: bool = True
    prix_unitaire: Optional[float] = None
    unite_facturation: Optional[str] = None
    conditions_particulieres: Optional[str] = None
    statut: ContratStatus = ContratStatus.BROUILLON
    date_creation: str
    date_signature: Optional[str] = None
    docusign_envelope_id: Optional[str] = None
    docusign_status: Optional[str] = None
    docusign_sent_at: Optional[str] = None


class ContratCCPACreate(BaseModel):
    chantier_id: str
    conditions_particulieres: Optional[str] = None


class ContratCCPAUpdate(BaseModel):
    client_nom: Optional[str] = None
    client_interlocuteur: Optional[str] = None
    client_adresse: Optional[str] = None
    client_email: Optional[str] = None
    client_telephone: Optional[str] = None
    prix_unitaire: Optional[float] = None
    unite_facturation: Optional[str] = None
    conditions_particulieres: Optional[str] = None


# ============= DASHBOARD MODELS =============
class DashboardStats(BaseModel):
    total_tracteurs: int = 0
    tracteurs_disponibles: int = 0
    total_equipements: int = 0
    equipements_disponibles: int = 0
    total_chauffeurs: int = 0
    chauffeurs_disponibles: int = 0
    total_clients: int = 0
    chantiers_planifies: int = 0
    chantiers_en_cours: int = 0
    chantiers_termines: int = 0
