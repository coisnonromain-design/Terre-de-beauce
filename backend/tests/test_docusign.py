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
    
    def test_send_contrat_requires_authentication(self):
        """POST /api/docusign/send-contrat/{id} should return 401 when not authenticated"""
        # Get an existing contrat from the database
        contrats_res = requests.get(f"{BASE_URL}/api/contrats-ccpa")
        assert contrats_res.status_code == 200
        contrats = contrats_res.json()
        
        if len(contrats) > 0:
            contrat_id = contrats[0]["id"]
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
        else:
            # If no contrats exist, test with a fake ID (auth check happens first)
            fake_id = str(uuid.uuid4())
            response = requests.post(
                f"{BASE_URL}/api/docusign/send-contrat/{fake_id}",
                params={"signer_email": "test@example.com", "signer_name": "Test User"}
            )
            assert response.status_code == 401
            print("No existing contrats, tested with fake ID")
    
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
        """Sync status with invalid document type should return 400 (validation before auth)"""
        fake_id = str(uuid.uuid4())
        response = requests.post(f"{BASE_URL}/api/docusign/sync-status/invalid/{fake_id}")
        # Document type validation happens before auth check
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print(f"Expected 400 response: {data['detail']}")


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
