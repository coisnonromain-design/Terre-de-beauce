"""
Terre de Beauce ERP - Main Application (Refactored Architecture)
This file shows the target architecture after full refactoring.
Currently, server.py remains the production file for stability.
Directory Structure:
/app/backend/
├── server.py              # Current production file
├── main.py               # Future entry point (this file)
├── core/
│   ├── __init__.py
│   └── database.py       # Database connection and config
├── models/
│   ├── __init__.py
│   └── schemas.py        # Pydantic models and enums
└── routers/
    ├── __init__.py
    ├── tracteurs.py      # Fleet management - Tracteurs
    ├── equipements.py    # Fleet management - Equipment
    ├── chauffeurs.py     # Driver management
    ├── clients.py        # Client management
    ├── chantiers.py      # Project/Site management
    ├── pointages.py      # Time tracking
    ├── config.py         # Configuration (entreprise + barèmes)
    ├── export.py         # CSV/Excel export
    ├── dashboard.py      # Dashboard & Statistics
    ├── factures.py       # Invoicing (complex logic)
    ├── contrats.py       # CCPA Contracts
    ├── docusign.py       # DocuSign integration
    └── treasury.py       # Module Trésorerie
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from dotenv import load_dotenv

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Import routers
from routers import tracteurs, equipements, chauffeurs, clients
from routers import chantiers, pointages, config, export, dashboard
from routers import treasury

# Create FastAPI app
app = FastAPI(
    title="Terre de Beauce ERP",
    description="ERP pour la gestion de flotte de transport agricole",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with /api prefix
app.include_router(tracteurs.router, prefix="/api")
app.include_router(equipements.router, prefix="/api")
app.include_router(chauffeurs.router, prefix="/api")
app.include_router(clients.router, prefix="/api")
app.include_router(chantiers.router, prefix="/api")
app.include_router(pointages.router, prefix="/api")
app.include_router(config.router, prefix="/api")
app.include_router(export.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(treasury.router, prefix="/api")

# Note: factures, contrats, and docusign routers contain complex logic
# and will be migrated separately with extensive testing

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": "2.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
