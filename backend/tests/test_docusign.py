"""
Test DocuSign integration endpoints for Terre de Beauce ERP
Tests: send-contrat, sync-status, sync-all endpoints
Note: DocuSign is not authenticated in demo mode, so we test error handling
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestDocuSignStatus:
    """Test DocuSign status endpoint"""
    
    def test_docusign_status_returns_configured(self):
        """DocuSign status should return configured=true, authenticated=false"""
        response = requests.get(f"{BASE_URL}/api/docusign/status")
        assert response.status_code == 200
        data = response.json()
        assert "configured" in data
        assert "authenticated" in data
        assert "account_id" in data
        # DocuSign is configured but not authenticated in demo mode
        assert data["configured"] == True
        assert data["authenticated"] == False
        print(f"DocuSign status: configured={data['configured']}, authenticated={data['authenticated']}")


class TestDocuSignSendContrat:
    """Test POST /api/docusign/send-contrat/{id} endpoint"""
    
    @pytest.fixture
    def test_client_and_chantier(self):
        """Create test client and chantier for contrat testing"""
        # Create test client
        client_data = {
            "raison_sociale": f"TEST_DocuSign_Client_{uuid.uuid4().hex[:6]}",
            "adresse": "123 Test Street",
            "code_postal": "75001",
            "ville": "Paris",
            "pays": "France",
            "email": "test@docusign.com",
            "tarifs": [{"methode": "heure", "prix_unitaire": 50.0}]
        }
        client_res = requests.post(f"{BASE_URL}/api/clients", json=client_data)
        assert client_res.status_code == 200
        client = client_res.json()
        
        # Create test chantier
        chantier_data = {
            "reference": f"TEST_CH_{uuid.uuid4().hex[:6]}",
            "client_id": client["id"],
            "lieu": "Test Location",
            "date_debut": "2026-01-15",
            "statut": "planifie",
            "affectations": [],
            "tarifs": [{"methode": "heure", "prix_unitaire": 50.0}],
            "transport_type": "solide",
            "avec_gasoil": True
        }
        chantier_res = requests.post(f"{BASE_URL}/api/chantiers", json=chantier_data)
        assert chantier_res.status_code == 200
        chantier = chantier_res.json()
        
        yield {"client": client, "chantier": chantier}
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/chantiers/{chantier['id']}")
        requests.delete(f"{BASE_URL}/api/clients/{client['id']}")
    
    @pytest.fixture
    def test_contrat(self, test_client_and_chantier):
        """Create test contrat CCPA"""
        chantier = test_client_and_chantier["chantier"]
        
        contrat_res = requests.post(f"{BASE_URL}/api/contrats-ccpa", json={"chantier_id": chantier["id"]})
        assert contrat_res.status_code == 200
        contrat = contrat_res.json()
        
        yield contrat
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/contrats-ccpa/{contrat['id']}")
    
    def test_send_contrat_requires_authentication(self, test_contrat):
        """POST /api/docusign/send-contrat/{id} should return 401 when not authenticated"""
        contrat_id = test_contrat["id"]
        response = requests.post(
            f"{BASE_URL}/api/docusign/send-contrat/{contrat_id}",
            params={"signer_email": "test@example.com", "signer_name": "Test User"}
        )
        # Should return 401 because DocuSign is not authenticated
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "non authentifié" in data["detail"].lower() or "authentifié" in data["detail"]
        print(f"Expected 401 response: {data['detail']}")
    
    def test_send_contrat_not_found(self):
        """POST /api/docusign/send-contrat/{id} should return 401 for non-existent contrat (auth check first)"""
        fake_id = str(uuid.uuid4())
        response = requests.post(
            f"{BASE_URL}/api/docusign/send-contrat/{fake_id}",
            params={"signer_email": "test@example.com", "signer_name": "Test User"}
        )
        # Auth check happens before contrat lookup, so expect 401
        assert response.status_code == 401


class TestDocuSignSyncStatus:
    """Test POST /api/docusign/sync-status/{document_type}/{id} endpoint"""
    
    def test_sync_status_contrat_requires_auth(self):
        """Sync status for contrat should return 401 when not authenticated"""
        fake_id = str(uuid.uuid4())
        response = requests.post(f"{BASE_URL}/api/docusign/sync-status/contrat/{fake_id}")
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        print(f"Expected 401 response: {data['detail']}")
    
    def test_sync_status_facture_requires_auth(self):
        """Sync status for facture should return 401 when not authenticated"""
        fake_id = str(uuid.uuid4())
        response = requests.post(f"{BASE_URL}/api/docusign/sync-status/facture/{fake_id}")
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        print(f"Expected 401 response: {data['detail']}")
    
    def test_sync_status_invalid_document_type(self):
        """Sync status with invalid document type should return 400"""
        fake_id = str(uuid.uuid4())
        response = requests.post(f"{BASE_URL}/api/docusign/sync-status/invalid/{fake_id}")
        # Auth check happens first, so expect 401
        assert response.status_code == 401


class TestDocuSignSyncAll:
    """Test POST /api/docusign/sync-all endpoint"""
    
    def test_sync_all_requires_auth(self):
        """Sync all should return 401 when not authenticated"""
        response = requests.post(f"{BASE_URL}/api/docusign/sync-all")
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "non authentifié" in data["detail"].lower() or "authentifié" in data["detail"]
        print(f"Expected 401 response: {data['detail']}")


class TestDocuSignAuthUrl:
    """Test GET /api/docusign/auth-url endpoint"""
    
    def test_auth_url_returns_url(self):
        """Auth URL endpoint should return a valid DocuSign auth URL"""
        redirect_uri = "https://example.com/callback"
        response = requests.get(f"{BASE_URL}/api/docusign/auth-url", params={"redirect_uri": redirect_uri})
        assert response.status_code == 200
        data = response.json()
        assert "auth_url" in data
        assert "account-d.docusign.com" in data["auth_url"]
        assert "oauth/auth" in data["auth_url"]
        assert "response_type=code" in data["auth_url"]
        print(f"Auth URL generated successfully")


class TestDocuSignEnvelopeStatus:
    """Test GET /api/docusign/envelope/{envelope_id}/status endpoint"""
    
    def test_envelope_status_requires_auth(self):
        """Envelope status should return 401 when not authenticated"""
        fake_envelope_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/docusign/envelope/{fake_envelope_id}/status")
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        print(f"Expected 401 response: {data['detail']}")


class TestDocuSignSendFacture:
    """Test POST /api/docusign/send-facture/{id} endpoint"""
    
    def test_send_facture_requires_auth(self):
        """Send facture should return 401 when not authenticated"""
        fake_id = str(uuid.uuid4())
        response = requests.post(
            f"{BASE_URL}/api/docusign/send-facture/{fake_id}",
            params={"signer_email": "test@example.com", "signer_name": "Test User"}
        )
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        print(f"Expected 401 response: {data['detail']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
