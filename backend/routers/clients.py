"""
Clients routes
"""
from fastapi import APIRouter, HTTPException
from typing import List
import uuid
from datetime import datetime, timezone

from ..core.database import db
from ..models.schemas import Client, ClientCreate

router = APIRouter(prefix="/clients", tags=["Clients"])


@router.get("", response_model=List[Client])
async def get_clients():
    clients = await db.clients.find({}, {"_id": 0}).to_list(100)
    return clients


@router.get("/{client_id}", response_model=Client)
async def get_client(client_id: str):
    client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    return client


@router.post("", response_model=Client)
async def create_client(client: ClientCreate):
    client_dict = client.model_dump()
    client_dict["id"] = str(uuid.uuid4())[:8].upper()
    client_dict["date_creation"] = datetime.now(timezone.utc).isoformat()
    await db.clients.insert_one(client_dict)
    return client_dict


@router.put("/{client_id}", response_model=Client)
async def update_client(client_id: str, client: ClientCreate):
    existing = await db.clients.find_one({"id": client_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    client_dict = client.model_dump()
    await db.clients.update_one({"id": client_id}, {"$set": client_dict})
    updated = await db.clients.find_one({"id": client_id}, {"_id": 0})
    return updated


@router.delete("/{client_id}")
async def delete_client(client_id: str):
    result = await db.clients.delete_one({"id": client_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    return {"message": "Client supprimé"}
