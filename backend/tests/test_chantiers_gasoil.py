"""
Test suite for Chantiers 'Gasoil fourni' feature
Tests the avec_gasoil field in chantiers CRUD operations
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data prefix for cleanup
TEST_PREFIX = "TEST_GASOIL_"


class TestChantierGasoilBackend:
    """Tests for avec_gasoil field in chantiers API"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data - create a client for chantier tests"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Create a test client
        client_data = {
            "raison_sociale": f"{TEST_PREFIX}Client_{uuid.uuid4().hex[:6]}",
            "adresse": "123 Test Street",
            "code_postal": "75001",
            "ville": "Paris",
            "pays": "France"
        }
        response = self.session.post(f"{BASE_URL}/api/clients", json=client_data)
        assert response.status_code == 200, f"Failed to create test client: {response.text}"
        self.test_client = response.json()
        self.created_chantiers = []
        
        yield
        
        # Cleanup - delete created chantiers and client
        for chantier_id in self.created_chantiers:
            try:
                self.session.delete(f"{BASE_URL}/api/chantiers/{chantier_id}")
            except:
                pass
        try:
            self.session.delete(f"{BASE_URL}/api/clients/{self.test_client['id']}")
        except:
            pass
    
    def test_create_chantier_with_gasoil_true(self):
        """Test creating a chantier with avec_gasoil=true (gasoil fourni)"""
        chantier_data = {
            "reference": f"{TEST_PREFIX}CH_{uuid.uuid4().hex[:6]}",
            "client_id": self.test_client['id'],
            "lieu": "Test Location Gasoil True",
            "date_debut": "2025-01-15",
            "statut": "planifie",
            "transport_type": "solide",
            "avec_gasoil": True,
            "affectations": [],
            "tarifs": []
        }
        
        response = self.session.post(f"{BASE_URL}/api/chantiers", json=chantier_data)
        assert response.status_code == 200, f"Failed to create chantier: {response.text}"
        
        created = response.json()
        self.created_chantiers.append(created['id'])
        
        # Verify avec_gasoil is True
        assert created.get('avec_gasoil') == True, f"Expected avec_gasoil=True, got {created.get('avec_gasoil')}"
        print(f"✓ Created chantier with avec_gasoil=True: {created['reference']}")
        
        # Verify by GET
        get_response = self.session.get(f"{BASE_URL}/api/chantiers/{created['id']}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched.get('avec_gasoil') == True, f"GET: Expected avec_gasoil=True, got {fetched.get('avec_gasoil')}"
        print(f"✓ GET verified avec_gasoil=True persisted correctly")
    
    def test_create_chantier_with_gasoil_false(self):
        """Test creating a chantier with avec_gasoil=false (sans gasoil)"""
        chantier_data = {
            "reference": f"{TEST_PREFIX}CH_{uuid.uuid4().hex[:6]}",
            "client_id": self.test_client['id'],
            "lieu": "Test Location Gasoil False",
            "date_debut": "2025-01-16",
            "statut": "planifie",
            "transport_type": "solide",
            "avec_gasoil": False,
            "affectations": [],
            "tarifs": []
        }
        
        response = self.session.post(f"{BASE_URL}/api/chantiers", json=chantier_data)
        assert response.status_code == 200, f"Failed to create chantier: {response.text}"
        
        created = response.json()
        self.created_chantiers.append(created['id'])
        
        # Verify avec_gasoil is False
        assert created.get('avec_gasoil') == False, f"Expected avec_gasoil=False, got {created.get('avec_gasoil')}"
        print(f"✓ Created chantier with avec_gasoil=False: {created['reference']}")
        
        # Verify by GET
        get_response = self.session.get(f"{BASE_URL}/api/chantiers/{created['id']}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched.get('avec_gasoil') == False, f"GET: Expected avec_gasoil=False, got {fetched.get('avec_gasoil')}"
        print(f"✓ GET verified avec_gasoil=False persisted correctly")
    
    def test_create_chantier_default_gasoil(self):
        """Test that avec_gasoil defaults to True when not specified"""
        chantier_data = {
            "reference": f"{TEST_PREFIX}CH_{uuid.uuid4().hex[:6]}",
            "client_id": self.test_client['id'],
            "lieu": "Test Location Default Gasoil",
            "date_debut": "2025-01-17",
            "statut": "planifie",
            "transport_type": "solide",
            "affectations": [],
            "tarifs": []
            # Note: avec_gasoil not specified - should default to True
        }
        
        response = self.session.post(f"{BASE_URL}/api/chantiers", json=chantier_data)
        assert response.status_code == 200, f"Failed to create chantier: {response.text}"
        
        created = response.json()
        self.created_chantiers.append(created['id'])
        
        # Verify avec_gasoil defaults to True
        assert created.get('avec_gasoil') == True, f"Expected default avec_gasoil=True, got {created.get('avec_gasoil')}"
        print(f"✓ Created chantier with default avec_gasoil=True: {created['reference']}")
    
    def test_update_chantier_gasoil_true_to_false(self):
        """Test updating a chantier from avec_gasoil=true to false"""
        # Create with gasoil=true
        chantier_data = {
            "reference": f"{TEST_PREFIX}CH_{uuid.uuid4().hex[:6]}",
            "client_id": self.test_client['id'],
            "lieu": "Test Location Update",
            "date_debut": "2025-01-18",
            "statut": "planifie",
            "transport_type": "solide",
            "avec_gasoil": True,
            "affectations": [],
            "tarifs": []
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/chantiers", json=chantier_data)
        assert create_response.status_code == 200
        created = create_response.json()
        self.created_chantiers.append(created['id'])
        
        # Update to gasoil=false
        update_data = {
            "reference": created['reference'],
            "client_id": self.test_client['id'],
            "lieu": "Test Location Update",
            "date_debut": "2025-01-18",
            "statut": "planifie",
            "transport_type": "solide",
            "avec_gasoil": False,  # Changed to False
            "affectations": [],
            "tarifs": []
        }
        
        update_response = self.session.put(f"{BASE_URL}/api/chantiers/{created['id']}", json=update_data)
        assert update_response.status_code == 200, f"Failed to update chantier: {update_response.text}"
        
        updated = update_response.json()
        assert updated.get('avec_gasoil') == False, f"Expected updated avec_gasoil=False, got {updated.get('avec_gasoil')}"
        print(f"✓ Updated chantier from avec_gasoil=True to False")
        
        # Verify by GET
        get_response = self.session.get(f"{BASE_URL}/api/chantiers/{created['id']}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched.get('avec_gasoil') == False, f"GET: Expected avec_gasoil=False after update, got {fetched.get('avec_gasoil')}"
        print(f"✓ GET verified avec_gasoil=False persisted after update")
    
    def test_update_chantier_gasoil_false_to_true(self):
        """Test updating a chantier from avec_gasoil=false to true"""
        # Create with gasoil=false
        chantier_data = {
            "reference": f"{TEST_PREFIX}CH_{uuid.uuid4().hex[:6]}",
            "client_id": self.test_client['id'],
            "lieu": "Test Location Update 2",
            "date_debut": "2025-01-19",
            "statut": "planifie",
            "transport_type": "solide",
            "avec_gasoil": False,
            "affectations": [],
            "tarifs": []
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/chantiers", json=chantier_data)
        assert create_response.status_code == 200
        created = create_response.json()
        self.created_chantiers.append(created['id'])
        
        # Update to gasoil=true
        update_data = {
            "reference": created['reference'],
            "client_id": self.test_client['id'],
            "lieu": "Test Location Update 2",
            "date_debut": "2025-01-19",
            "statut": "planifie",
            "transport_type": "solide",
            "avec_gasoil": True,  # Changed to True
            "affectations": [],
            "tarifs": []
        }
        
        update_response = self.session.put(f"{BASE_URL}/api/chantiers/{created['id']}", json=update_data)
        assert update_response.status_code == 200, f"Failed to update chantier: {update_response.text}"
        
        updated = update_response.json()
        assert updated.get('avec_gasoil') == True, f"Expected updated avec_gasoil=True, got {updated.get('avec_gasoil')}"
        print(f"✓ Updated chantier from avec_gasoil=False to True")
    
    def test_list_chantiers_with_gasoil_field(self):
        """Test that listing chantiers includes avec_gasoil field"""
        # Create two chantiers with different gasoil values
        chantier1_data = {
            "reference": f"{TEST_PREFIX}CH_LIST1_{uuid.uuid4().hex[:6]}",
            "client_id": self.test_client['id'],
            "lieu": "Test Location List 1",
            "date_debut": "2025-01-20",
            "statut": "planifie",
            "transport_type": "solide",
            "avec_gasoil": True,
            "affectations": [],
            "tarifs": []
        }
        
        chantier2_data = {
            "reference": f"{TEST_PREFIX}CH_LIST2_{uuid.uuid4().hex[:6]}",
            "client_id": self.test_client['id'],
            "lieu": "Test Location List 2",
            "date_debut": "2025-01-21",
            "statut": "planifie",
            "transport_type": "liquide",
            "avec_gasoil": False,
            "affectations": [],
            "tarifs": []
        }
        
        resp1 = self.session.post(f"{BASE_URL}/api/chantiers", json=chantier1_data)
        resp2 = self.session.post(f"{BASE_URL}/api/chantiers", json=chantier2_data)
        
        assert resp1.status_code == 200 and resp2.status_code == 200
        
        created1 = resp1.json()
        created2 = resp2.json()
        self.created_chantiers.extend([created1['id'], created2['id']])
        
        # List all chantiers
        list_response = self.session.get(f"{BASE_URL}/api/chantiers")
        assert list_response.status_code == 200
        
        chantiers = list_response.json()
        
        # Find our test chantiers
        test_chantiers = [c for c in chantiers if c['reference'].startswith(TEST_PREFIX)]
        
        # Verify avec_gasoil field is present in list
        for chantier in test_chantiers:
            assert 'avec_gasoil' in chantier, f"avec_gasoil field missing in chantier list for {chantier['reference']}"
        
        # Find specific chantiers and verify values
        ch1 = next((c for c in chantiers if c['id'] == created1['id']), None)
        ch2 = next((c for c in chantiers if c['id'] == created2['id']), None)
        
        assert ch1 is not None and ch1.get('avec_gasoil') == True, "Chantier 1 should have avec_gasoil=True"
        assert ch2 is not None and ch2.get('avec_gasoil') == False, "Chantier 2 should have avec_gasoil=False"
        
        print(f"✓ List chantiers includes avec_gasoil field with correct values")
    
    def test_chantier_recap_includes_gasoil(self):
        """Test that chantier recap endpoint includes avec_gasoil info"""
        chantier_data = {
            "reference": f"{TEST_PREFIX}CH_RECAP_{uuid.uuid4().hex[:6]}",
            "client_id": self.test_client['id'],
            "lieu": "Test Location Recap",
            "date_debut": "2025-01-22",
            "statut": "en_cours",
            "transport_type": "solide",
            "avec_gasoil": False,
            "affectations": [],
            "tarifs": []
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/chantiers", json=chantier_data)
        assert create_response.status_code == 200
        created = create_response.json()
        self.created_chantiers.append(created['id'])
        
        # Get recap
        recap_response = self.session.get(f"{BASE_URL}/api/chantiers/{created['id']}/recap")
        assert recap_response.status_code == 200, f"Failed to get recap: {recap_response.text}"
        
        recap = recap_response.json()
        
        # Verify chantier info in recap includes avec_gasoil
        assert 'chantier' in recap, "Recap should include chantier info"
        assert recap['chantier'].get('avec_gasoil') == False, f"Recap chantier should have avec_gasoil=False"
        
        print(f"✓ Chantier recap includes avec_gasoil field")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
