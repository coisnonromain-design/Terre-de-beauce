"""
Test suite for Contrats CCPA (Contrat Cadre de Prestations Agricoles) feature
Tests: GET, POST, PUT, DELETE endpoints for /api/contrats-ccpa
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestContratsCCPAAPI:
    """Test suite for Contrats CCPA endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data - create a test client and chantier"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Create test client
        client_data = {
            "raison_sociale": f"TEST_Client_CCPA_{uuid.uuid4().hex[:6]}",
            "adresse": "123 Rue Test",
            "code_postal": "75001",
            "ville": "Paris",
            "pays": "France",
            "email": "test@ccpa.fr",
            "telephone": "0123456789",
            "contact_nom": "Contact Test"
        }
        client_resp = self.session.post(f"{BASE_URL}/api/clients", json=client_data)
        assert client_resp.status_code == 200, f"Failed to create test client: {client_resp.text}"
        self.test_client = client_resp.json()
        
        # Create test chantier
        chantier_data = {
            "reference": f"TEST-CCPA-{uuid.uuid4().hex[:6].upper()}",
            "client_id": self.test_client["id"],
            "lieu": "Site de test CCPA",
            "date_debut": "2026-03-01",
            "statut": "planifie",
            "affectations": [],
            "tarifs": [{"methode": "heure", "prix_unitaire": 85.0, "description": "Tarif test"}],
            "transport_type": "solide",
            "avec_gasoil": True
        }
        chantier_resp = self.session.post(f"{BASE_URL}/api/chantiers", json=chantier_data)
        assert chantier_resp.status_code == 200, f"Failed to create test chantier: {chantier_resp.text}"
        self.test_chantier = chantier_resp.json()
        
        yield
        
        # Cleanup - delete test data
        # Delete contrat if created
        if hasattr(self, 'created_contrat_id'):
            self.session.delete(f"{BASE_URL}/api/contrats-ccpa/{self.created_contrat_id}")
        
        # Delete test chantier
        self.session.delete(f"{BASE_URL}/api/chantiers/{self.test_chantier['id']}")
        
        # Delete test client
        self.session.delete(f"{BASE_URL}/api/clients/{self.test_client['id']}")
    
    def test_01_get_contrats_ccpa_list(self):
        """Test GET /api/contrats-ccpa returns list of contrats"""
        response = self.session.get(f"{BASE_URL}/api/contrats-ccpa")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/contrats-ccpa returns {len(data)} contrats")
    
    def test_02_create_contrat_ccpa(self):
        """Test POST /api/contrats-ccpa creates a new contrat pre-filled from chantier"""
        payload = {"chantier_id": self.test_chantier["id"]}
        response = self.session.post(f"{BASE_URL}/api/contrats-ccpa", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Store for cleanup
        self.created_contrat_id = data["id"]
        
        # Verify contrat structure
        assert "id" in data, "Contrat should have an id"
        assert "numero_contrat" in data, "Contrat should have numero_contrat"
        assert data["numero_contrat"].startswith("CCPA-"), "Numero should start with CCPA-"
        assert data["chantier_id"] == self.test_chantier["id"], "Chantier ID should match"
        assert data["client_id"] == self.test_client["id"], "Client ID should match"
        
        # Verify pre-filled client info
        assert data["client_nom"] == self.test_client["raison_sociale"], "Client name should be pre-filled"
        assert "123 Rue Test" in data["client_adresse"], "Client address should be pre-filled"
        
        # Verify pre-filled tarif info
        assert data["prix_unitaire"] == 85.0, "Prix should be pre-filled from chantier tarif"
        assert "heure" in data["unite_facturation"], "Unite should be pre-filled from chantier tarif"
        
        # Verify gasoil and transport type
        assert data["gasoil_fourni"] == True, "Gasoil should be inherited from chantier"
        assert data["transport_type"] == "solide", "Transport type should be inherited"
        
        # Verify default status
        assert data["statut"] == "brouillon", "Default status should be brouillon"
        
        print(f"✓ POST /api/contrats-ccpa created contrat {data['numero_contrat']}")
    
    def test_03_get_contrat_ccpa_by_id(self):
        """Test GET /api/contrats-ccpa/{id} returns specific contrat"""
        # First create a contrat
        payload = {"chantier_id": self.test_chantier["id"]}
        create_resp = self.session.post(f"{BASE_URL}/api/contrats-ccpa", json=payload)
        
        if create_resp.status_code == 400 and "existe déjà" in create_resp.text:
            # Contrat already exists, get it by chantier
            list_resp = self.session.get(f"{BASE_URL}/api/contrats-ccpa?chantier_id={self.test_chantier['id']}")
            contrat = list_resp.json()[0]
            self.created_contrat_id = contrat["id"]
        else:
            assert create_resp.status_code == 200
            contrat = create_resp.json()
            self.created_contrat_id = contrat["id"]
        
        # Get by ID
        response = self.session.get(f"{BASE_URL}/api/contrats-ccpa/{contrat['id']}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["id"] == contrat["id"], "ID should match"
        print(f"✓ GET /api/contrats-ccpa/{contrat['id']} returns correct contrat")
    
    def test_04_update_contrat_ccpa_editable_fields(self):
        """Test PUT /api/contrats-ccpa/{id} updates editable fields"""
        # First create or get contrat
        payload = {"chantier_id": self.test_chantier["id"]}
        create_resp = self.session.post(f"{BASE_URL}/api/contrats-ccpa", json=payload)
        
        if create_resp.status_code == 400:
            list_resp = self.session.get(f"{BASE_URL}/api/contrats-ccpa?chantier_id={self.test_chantier['id']}")
            contrat = list_resp.json()[0]
            self.created_contrat_id = contrat["id"]
        else:
            contrat = create_resp.json()
            self.created_contrat_id = contrat["id"]
        
        # Update editable fields
        update_data = {
            "client_nom": "Nouveau Nom Client",
            "client_interlocuteur": "Jean Martin",
            "client_adresse": "456 Nouvelle Adresse, 69000 Lyon",
            "client_email": "nouveau@email.fr",
            "client_telephone": "0987654321",
            "prix_unitaire": 95.50,
            "unite_facturation": "tonne transportée",
            "date_signature": "2026-03-15"
        }
        
        response = self.session.put(f"{BASE_URL}/api/contrats-ccpa/{contrat['id']}", json=update_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify updates
        assert data["client_nom"] == "Nouveau Nom Client", "Client name should be updated"
        assert data["client_interlocuteur"] == "Jean Martin", "Interlocuteur should be updated"
        assert data["client_adresse"] == "456 Nouvelle Adresse, 69000 Lyon", "Address should be updated"
        assert data["client_email"] == "nouveau@email.fr", "Email should be updated"
        assert data["client_telephone"] == "0987654321", "Phone should be updated"
        assert data["prix_unitaire"] == 95.50, "Prix should be updated"
        assert data["unite_facturation"] == "tonne transportée", "Unite should be updated"
        assert data["date_signature"] == "2026-03-15", "Date signature should be updated"
        
        # Verify GET returns updated data
        get_resp = self.session.get(f"{BASE_URL}/api/contrats-ccpa/{contrat['id']}")
        get_data = get_resp.json()
        assert get_data["client_nom"] == "Nouveau Nom Client", "GET should return updated name"
        
        print("✓ PUT /api/contrats-ccpa/{id} updates all editable fields correctly")
    
    def test_05_update_contrat_status_workflow(self):
        """Test status workflow: brouillon -> envoye -> signe"""
        # First create or get contrat
        payload = {"chantier_id": self.test_chantier["id"]}
        create_resp = self.session.post(f"{BASE_URL}/api/contrats-ccpa", json=payload)
        
        if create_resp.status_code == 400:
            list_resp = self.session.get(f"{BASE_URL}/api/contrats-ccpa?chantier_id={self.test_chantier['id']}")
            contrat = list_resp.json()[0]
            self.created_contrat_id = contrat["id"]
        else:
            contrat = create_resp.json()
            self.created_contrat_id = contrat["id"]
        
        # Update to envoye
        response = self.session.put(f"{BASE_URL}/api/contrats-ccpa/{contrat['id']}", json={"statut": "envoye"})
        assert response.status_code == 200
        assert response.json()["statut"] == "envoye", "Status should be envoye"
        print("✓ Status updated to 'envoye'")
        
        # Update to signe
        response = self.session.put(f"{BASE_URL}/api/contrats-ccpa/{contrat['id']}", json={"statut": "signe"})
        assert response.status_code == 200
        assert response.json()["statut"] == "signe", "Status should be signe"
        print("✓ Status updated to 'signe'")
    
    def test_06_filter_contrats_by_status(self):
        """Test GET /api/contrats-ccpa?statut=xxx filters correctly"""
        response = self.session.get(f"{BASE_URL}/api/contrats-ccpa?statut=brouillon")
        assert response.status_code == 200
        data = response.json()
        for contrat in data:
            assert contrat["statut"] == "brouillon", "All contrats should have brouillon status"
        print(f"✓ Filter by status works - found {len(data)} brouillon contrats")
    
    def test_07_prevent_duplicate_contrat_per_chantier(self):
        """Test that creating a second contrat for same chantier fails"""
        # First create a contrat
        payload = {"chantier_id": self.test_chantier["id"]}
        first_resp = self.session.post(f"{BASE_URL}/api/contrats-ccpa", json=payload)
        
        if first_resp.status_code == 200:
            self.created_contrat_id = first_resp.json()["id"]
        
        # Try to create another for same chantier
        second_resp = self.session.post(f"{BASE_URL}/api/contrats-ccpa", json=payload)
        assert second_resp.status_code == 400, "Should fail with 400 for duplicate"
        assert "existe déjà" in second_resp.text, "Error message should mention existing contrat"
        print("✓ Duplicate contrat per chantier is prevented")
    
    def test_08_delete_contrat_ccpa(self):
        """Test DELETE /api/contrats-ccpa/{id} removes contrat"""
        # First create a contrat
        payload = {"chantier_id": self.test_chantier["id"]}
        create_resp = self.session.post(f"{BASE_URL}/api/contrats-ccpa", json=payload)
        
        if create_resp.status_code == 400:
            list_resp = self.session.get(f"{BASE_URL}/api/contrats-ccpa?chantier_id={self.test_chantier['id']}")
            contrat = list_resp.json()[0]
        else:
            contrat = create_resp.json()
        
        # Delete
        response = self.session.delete(f"{BASE_URL}/api/contrats-ccpa/{contrat['id']}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Verify deleted
        get_resp = self.session.get(f"{BASE_URL}/api/contrats-ccpa/{contrat['id']}")
        assert get_resp.status_code == 404, "Deleted contrat should return 404"
        print("✓ DELETE /api/contrats-ccpa/{id} removes contrat successfully")
    
    def test_09_get_contrat_by_chantier(self):
        """Test GET /api/chantiers/{id}/contrat-ccpa returns contrat for chantier"""
        # First create a contrat
        payload = {"chantier_id": self.test_chantier["id"]}
        create_resp = self.session.post(f"{BASE_URL}/api/contrats-ccpa", json=payload)
        
        if create_resp.status_code == 200:
            self.created_contrat_id = create_resp.json()["id"]
        
        # Get by chantier
        response = self.session.get(f"{BASE_URL}/api/chantiers/{self.test_chantier['id']}/contrat-ccpa")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["chantier_id"] == self.test_chantier["id"], "Chantier ID should match"
        print("✓ GET /api/chantiers/{id}/contrat-ccpa returns correct contrat")
    
    def test_10_contrat_not_found(self):
        """Test 404 for non-existent contrat"""
        fake_id = str(uuid.uuid4())
        response = self.session.get(f"{BASE_URL}/api/contrats-ccpa/{fake_id}")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Non-existent contrat returns 404")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
