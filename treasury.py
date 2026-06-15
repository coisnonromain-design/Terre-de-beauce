"""
Treasury routes - Module Trésorerie
Terre de Beauce ERP
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone, date
import uuid

from ..core.database import db

router = APIRouter(prefix="/treasury", tags=["Trésorerie"])

def new_id() -> str:
    return str(uuid.uuid4())[:8].upper()

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

class QuarterConfig(BaseModel):
    id: int
    label: str
    name: str
    start: str
    end: str
    payment_date: str
    color: str = "#E6F1FB"
    text_color: str = "#0C447C"

class QuarterSettingsUpdate(BaseModel):
    quarters: List[QuarterConfig]

class BankAccountCreate(BaseModel):
    label: str
    bank: str
    iban: str
    balance: float
    currency: str = "EUR"

class BankAccount(BankAccountCreate):
    id: str
    date_creation: str

class BankAccountUpdate(BaseModel):
    label: Optional[str] = None
    bank: Optional[str] = None
    iban: Optional[str] = None
    balance: Optional[float] = None

class AutoDebitCreate(BaseModel):
    account_id: str
    supplier: str
    label: str
    amount: float
    day_of_month: int = Field(ge=1, le=31)
    frequency: str = Field(pattern="^(monthly|quarterly|annual)$")
    active: bool = True

class AutoDebit(AutoDebitCreate):
    id: str
    date_creation: str

class AutoDebitUpdate(BaseModel):
    supplier: Optional[str] = None
    label: Optional[str] = None
    amount: Optional[float] = None
    day_of_month: Optional[int] = None
    frequency: Optional[str] = None
    active: Optional[bool] = None

class SupplierInvoiceCreate(BaseModel):
    ref: str
    supplier: str
    category: str = Field(pattern="^(carb|entr|sous|aut)$")
    amount: float
    received_date: str
    due_date: str
    quarter_id: int = Field(ge=1, le=4)

class SupplierInvoice(SupplierInvoiceCreate):
    id: str
    status: str = "pending"
    date_creation: str

class SupplierInvoiceUpdate(BaseModel):
    ref: Optional[str] = None
    supplier: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    received_date: Optional[str] = None
    due_date: Optional[str] = None
    quarter_id: Optional[int] = None
    status: Optional[str] = None

class CampaignValidate(BaseModel):
    quarter_id: int = Field(ge=1, le=4)

class FactorCreate(BaseModel):
    name: str
    short_name: str
    contract_ref: str
    rate: float
    guarantee_rate: float

class Factor(FactorCreate):
    id: str
    date_creation: str

class FactorUpdate(BaseModel):
    name: Optional[str] = None
    short_name: Optional[str] = None
    contract_ref: Optional[str] = None
    rate: Optional[float] = None
    guarantee_rate: Optional[float] = None

class FactoringAssignmentCreate(BaseModel):
    factor_id: str
    invoice_ref: str
    client: str
    amount: float
    assigned_date: str
    expected_payment_date: str
    guarantee_release_date: str
    status: str = "pending"

class FactoringAssignment(FactoringAssignmentCreate):
    id: str
    date_creation: str

class FactoringAssignmentUpdate(BaseModel):
    factor_id: Optional[str] = None
    invoice_ref: Optional[str] = None
    client: Optional[str] = None
    amount: Optional[float] = None
    assigned_date: Optional[str] = None
    expected_payment_date: Optional[str] = None
    guarantee_release_date: Optional[str] = None
    status: Optional[str] = None

class ClientInvoiceCreate(BaseModel):
    client: str
    amount: float
    due_date: str
    factored: bool = False
    status: str = "pending"

class ClientInvoice(ClientInvoiceCreate):
    id: str
    date_creation: str

class ClientInvoiceUpdate(BaseModel):
    client: Optional[str] = None
    amount: Optional[float] = None
    due_date: Optional[str] = None
    factored: Optional[bool] = None
    status: Optional[str] = None

class WorkerCreate(BaseModel):
    first_name: str
    last_name: str
    role: str
    phone: str
    start_year: int
    active: bool = True

class Worker(WorkerCreate):
    id: str
    date_creation: str

class WorkerUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    start_year: Optional[int] = None
    active: Optional[bool] = None

class PayslipCreate(BaseModel):
    worker_id: str
    period_start: str
    period_end: str
    gross_salary: float
    net_salary: float
    employer_charges: float
    urssaf: float
    payment_date: str
    status: str = "pending"

class Payslip(PayslipCreate):
    id: str
    date_creation: str

class PayslipUpdate(BaseModel):
    period_start: Optional[str] = None
    period_end: Optional[str] = None
    gross_salary: Optional[float] = None
    net_salary: Optional[float] = None
    employer_charges: Optional[float] = None
    urssaf: Optional[float] = None
    payment_date: Optional[str] = None
    status: Optional[str] = None

@router.get("/settings/quarters")
async def get_quarter_settings():
    doc = await db.treasury_settings.find_one({"type": "quarters"}, {"_id": 0})
    if not doc:
        return {"quarters": [
            {"id": 1, "label": "T1", "name": "1er trimestre", "start": "01-15", "end": "04-14", "payment_date": "2026-03-31", "color": "#E6F1FB", "text_color": "#0C447C"},
            {"id": 2, "label": "T2", "name": "2ème trimestre", "start": "04-15", "end": "07-14", "payment_date": "2026-06-30", "color": "#EAF3DE", "text_color": "#27500A"},
            {"id": 3, "label": "T3", "name": "3ème trimestre", "start": "07-15", "end": "10-14", "payment_date": "2026-09-30", "color": "#FAEEDA", "text_color": "#633806"},
            {"id": 4, "label": "T4", "name": "4ème trimestre", "start": "10-15", "end": "01-14", "payment_date": "2026-12-31", "color": "#FAECE7", "text_color": "#712B13"},
        ]}
    return doc

@router.patch("/settings/quarters")
async def update_quarter_settings(payload: QuarterSettingsUpdate):
    await db.treasury_settings.update_one(
        {"type": "quarters"},
        {"$set": {"quarters": [q.model_dump() for q in payload.quarters], "updated_at": now_iso()}},
        upsert=True
    )
    return {"message": "Paramètres trimestres mis à jour"}

@router.get("/bank-accounts", response_model=List[BankAccount])
async def get_bank_accounts():
    return await db.bank_accounts.find({}, {"_id": 0}).to_list(100)

@router.post("/bank-accounts", response_model=BankAccount)
async def create_bank_account(payload: BankAccountCreate):
    doc = payload.model_dump()
    doc["id"] = new_id()
    doc["date_creation"] = now_iso()
    await db.bank_accounts.insert_one(doc)
    return doc

@router.patch("/bank-accounts/{account_id}")
async def update_bank_account(account_id: str, payload: BankAccountUpdate):
    existing = await db.bank_accounts.find_one({"id": account_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Compte bancaire non trouvé")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    updates["updated_at"] = now_iso()
    await db.bank_accounts.update_one({"id": account_id}, {"$set": updates})
    return {"message": "Compte mis à jour"}

@router.delete("/bank-accounts/{account_id}")
async def delete_bank_account(account_id: str):
    result = await db.bank_accounts.delete_one({"id": account_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Compte bancaire non trouvé")
    return {"message": "Compte supprimé"}

@router.get("/auto-debits", response_model=List[AutoDebit])
async def get_auto_debits():
    return await db.auto_debits.find({}, {"_id": 0}).to_list(200)

@router.post("/auto-debits", response_model=AutoDebit)
async def create_auto_debit(payload: AutoDebitCreate):
    doc = payload.model_dump()
    doc["id"] = new_id()
    doc["date_creation"] = now_iso()
    await db.auto_debits.insert_one(doc)
    return doc

@router.patch("/auto-debits/{debit_id}")
async def update_auto_debit(debit_id: str, payload: AutoDebitUpdate):
    existing = await db.auto_debits.find_one({"id": debit_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Prélèvement non trouvé")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    updates["updated_at"] = now_iso()
    await db.auto_debits.update_one({"id": debit_id}, {"$set": updates})
    return {"message": "Prélèvement mis à jour"}

@router.delete("/auto-debits/{debit_id}")
async def delete_auto_debit(debit_id: str):
    result = await db.auto_debits.delete_one({"id": debit_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Prélèvement non trouvé")
    return {"message": "Prélèvement supprimé"}

@router.get("/supplier-invoices", response_model=List[SupplierInvoice])
async def get_supplier_invoices(quarter_id: Optional[int] = None, status: Optional[str] = None):
    query = {}
    if quarter_id:
        query["quarter_id"] = quarter_id
    if status:
        query["status"] = status
    return await db.supplier_invoices.find(query, {"_id": 0}).to_list(500)

@router.post("/supplier-invoices", response_model=SupplierInvoice)
async def create_supplier_invoice(payload: SupplierInvoiceCreate):
    doc = payload.model_dump()
    doc["id"] = new_id()
    doc["status"] = "pending"
    doc["date_creation"] = now_iso()
    settings = await db.treasury_settings.find_one({"type": "quarters"}, {"_id": 0})
    if settings and "quarters" in settings:
        received = datetime.fromisoformat(doc["received_date"])
        for q in settings["quarters"]:
            mm, dd = q["end"].split("-")
            end_date = datetime(received.year, int(mm), int(dd))
            if end_date < received:
                end_date = datetime(received.year + 1, int(mm), int(dd))
            if 0 <= (end_date - received).days < 30:
                doc["quarter_id"] = (q["id"] % 4) + 1
                break
    await db.supplier_invoices.insert_one(doc)
    return doc

@router.patch("/supplier-invoices/{invoice_id}")
async def update_supplier_invoice(invoice_id: str, payload: SupplierInvoiceUpdate):
    existing = await db.supplier_invoices.find_one({"id": invoice_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Facture fournisseur non trouvée")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    updates["updated_at"] = now_iso()
    await db.supplier_invoices.update_one({"id": invoice_id}, {"$set": updates})
    return {"message": "Facture mise à jour"}

@router.delete("/supplier-invoices/{invoice_id}")
async def delete_supplier_invoice(invoice_id: str):
    result = await db.supplier_invoices.delete_one({"id": invoice_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Facture fournisseur non trouvée")
    return {"message": "Facture supprimée"}

@router.post("/payment-campaigns/validate")
async def validate_payment_campaign(payload: CampaignValidate):
    result = await db.supplier_invoices.update_many(
        {"quarter_id": payload.quarter_id, "status": "pending"},
        {"$set": {"status": "paid", "paid_at": now_iso()}}
    )
    await db.payment_campaigns.update_one(
        {"quarter_id": payload.quarter_id},
        {"$set": {"status": "validated", "validated_at": now_iso()}},
        upsert=True
    )
    return {"message": "Campagne validée", "invoices_updated": result.modified_count}

@router.get("/factors", response_model=List[Factor])
async def get_factors():
    return await db.factors.find({}, {"_id": 0}).to_list(50)

@router.post("/factors", response_model=Factor)
async def create_factor(payload: FactorCreate):
    doc = payload.model_dump()
    doc["id"] = new_id()
    doc["date_creation"] = now_iso()
    await db.factors.insert_one(doc)
    return doc

@router.patch("/factors/{factor_id}")
async def update_factor(factor_id: str, payload: FactorUpdate):
    existing = await db.factors.find_one({"id": factor_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Factor non trouvé")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    updates["updated_at"] = now_iso()
    await db.factors.update_one({"id": factor_id}, {"$set": updates})
    return {"message": "Factor mis à jour"}

@router.delete("/factors/{factor_id}")
async def delete_factor(factor_id: str):
    result = await db.factors.delete_one({"id": factor_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Factor non trouvé")
    return {"message": "Factor supprimé"}

@router.get("/factoring-assignments", response_model=List[FactoringAssignment])
async def get_factoring_assignments(factor_id: Optional[str] = None, status: Optional[str] = None):
    query = {}
    if factor_id:
        query["factor_id"] = factor_id
    if status:
        query["status"] = status
    return await db.factoring_assignments.find(query, {"_id": 0}).to_list(500)

@router.post("/factoring-assignments", response_model=FactoringAssignment)
async def create_factoring_assignment(payload: FactoringAssignmentCreate):
    doc = payload.model_dump()
    doc["id"] = new_id()
    doc["date_creation"] = now_iso()
    await db.factoring_assignments.insert_one(doc)
    return doc

@router.patch("/factoring-assignments/{assignment_id}")
async def update_factoring_assignment(assignment_id: str, payload: FactoringAssignmentUpdate):
    existing = await db.factoring_assignments.find_one({"id": assignment_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Cession non trouvée")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    updates["updated_at"] = now_iso()
    await db.factoring_assignments.update_one({"id": assignment_id}, {"$set": updates})
    return {"message": "Cession mise à jour"}

@router.delete("/factoring-assignments/{assignment_id}")
async def delete_factoring_assignment(assignment_id: str):
    result = await db.factoring_assignments.delete_one({"id": assignment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cession non trouvée")
    return {"message": "Cession supprimée"}

@router.get("/client-invoices", response_model=List[ClientInvoice])
async def get_client_invoices(status: Optional[str] = None):
    query = {}
    if status:
        query["status"] = status
    return await db.client_invoices.find(query, {"_id": 0}).to_list(500)

@router.post("/client-invoices", response_model=ClientInvoice)
async def create_client_invoice(payload: ClientInvoiceCreate):
    doc = payload.model_dump()
    doc["id"] = new_id()
    doc["date_creation"] = now_iso()
    await db.client_invoices.insert_one(doc)
    return doc

@router.patch("/client-invoices/{invoice_id}")
async def update_client_invoice(invoice_id: str, payload: ClientInvoiceUpdate):
    existing = await db.client_invoices.find_one({"id": invoice_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Facture client non trouvée")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    updates["updated_at"] = now_iso()
    await db.client_invoices.update_one({"id": invoice_id}, {"$set": updates})
    return {"message": "Facture cliente mise à jour"}

@router.delete("/client-invoices/{invoice_id}")
async def delete_client_invoice(invoice_id: str):
    result = await db.client_invoices.delete_one({"id": invoice_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Facture client non trouvée")
    return {"message": "Facture cliente supprimée"}

@router.get("/workers", response_model=List[Worker])
async def get_workers():
    return await db.treasury_workers.find({}, {"_id": 0}).to_list(100)

@router.post("/workers", response_model=Worker)
async def create_worker(payload: WorkerCreate):
    doc = payload.model_dump()
    doc["id"] = new_id()
    doc["date_creation"] = now_iso()
    await db.treasury_workers.insert_one(doc)
    return doc

@router.patch("/workers/{worker_id}")
async def update_worker(worker_id: str, payload: WorkerUpdate):
    existing = await db.treasury_workers.find_one({"id": worker_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Saisonnier non trouvé")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    updates["updated_at"] = now_iso()
    await db.treasury_workers.update_one({"id": worker_id}, {"$set": updates})
    return {"message": "Saisonnier mis à jour"}

@router.delete("/workers/{worker_id}")
async def delete_worker(worker_id: str):
    result = await db.treasury_workers.delete_one({"id": worker_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Saisonnier non trouvé")
    return {"message": "Saisonnier supprimé"}

@router.get("/payslips", response_model=List[Payslip])
async def get_payslips(worker_id: Optional[str] = None, status: Optional[str] = None):
    query = {}
    if worker_id:
        query["worker_id"] = worker_id
    if status:
        query["status"] = status
    return await db.payslips.find(query, {"_id": 0}).to_list(500)

@router.post("/payslips", response_model=Payslip)
async def create_payslip(payload: PayslipCreate):
    doc = payload.model_dump()
    doc["id"] = new_id()
    doc["date_creation"] = now_iso()
    await db.payslips.insert_one(doc)
    return doc

@router.patch("/payslips/{payslip_id}")
async def update_payslip(payslip_id: str, payload: PayslipUpdate):
    existing = await db.payslips.find_one({"id": payslip_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Fiche de paie non trouvée")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    updates["updated_at"] = now_iso()
    await db.payslips.update_one({"id": payslip_id}, {"$set": updates})
    return {"message": "Fiche de paie mise à jour"}

@router.delete("/payslips/{payslip_id}")
async def delete_payslip(payslip_id: str):
    result = await db.payslips.delete_one({"id": payslip_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Fiche de paie non trouvée")
    return {"message": "Fiche de paie supprimée"}

@router.get("/dashboard")
async def get_treasury_dashboard():
    accounts          = await db.bank_accounts.find({}, {"_id": 0}).to_list(100)
    auto_debits       = await db.auto_debits.find({"active": True}, {"_id": 0}).to_list(200)
    supplier_pending  = await db.supplier_invoices.find({"status": "pending"}, {"_id": 0}).to_list(500)
    client_pending    = await db.client_invoices.find({"status": "pending"}, {"_id": 0}).to_list(500)
    factors           = await db.factors.find({}, {"_id": 0}).to_list(50)
    factoring_pending = await db.factoring_assignments.find({"status": "pending"}, {"_id": 0}).to_list(200)
    campaigns         = await db.payment_campaigns.find({}, {"_id": 0}).to_list(20)
    payslips_pending  = await db.payslips.find({"status": "pending"}, {"_id": 0}).to_list(200)
    factors_map = {f["id"]: f for f in factors}
    total_balance = sum(a["balance"] for a in accounts)
    total_guarantee = sum(
        a["amount"] * factors_map.get(a["factor_id"], {}).get("guarantee_rate", 0) / 100
        for a in factoring_pending
    )
    monthly_auto = sum(
        d["amount"] if d["frequency"] == "monthly"
        else d["amount"] / 3 if d["frequency"] == "quarterly"
        else d["amount"] / 12
        for d in auto_debits
    )
    quarter_totals = {}
    for inv in supplier_pending:
        qid = str(inv.get("quarter_id"))
        quarter_totals[qid] = quarter_totals.get(qid, 0) + inv["amount"]
    return {
        "total_balance":               total_balance,
        "available_after_guarantee":   total_balance - total_guarantee,
        "total_guarantee_immobilized": total_guarantee,
        "total_client_pending":        sum(i["amount"] for i in client_pending),
        "total_supplier_pending":      sum(i["amount"] for i in supplier_pending),
        "monthly_auto_debits":         monthly_auto,
        "total_payroll_pending":       sum(p["net_salary"] + p["employer_charges"] for p in payslips_pending),
        "total_urssaf_pending":        sum(p["urssaf"] for p in payslips_pending),
        "quarter_totals":              quarter_totals,
        "accounts":                    accounts,
        "campaigns":                   campaigns,
    }
