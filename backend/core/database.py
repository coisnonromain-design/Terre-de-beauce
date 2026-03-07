"""
Database configuration and connection
"""
from motor.motor_asyncio import AsyncIOMotorClient
import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent.parent
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
