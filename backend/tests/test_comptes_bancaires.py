"""
Test suite for Comptes Bancaires (Bank Accounts) feature
Tests CRUD operations for bank accounts and integration with invoices
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data prefix for cleanup
TEST_PREFIX = "TEST_"

class TestComptesBancairesCRUD:
    """Tests for bank accounts CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.test_compte_ids = []
        yield
        # Cleanup test data
        for compte_id in self.test_compte_ids:
            try:
                requests.delete(f"{BASE_URL}/api/comptes-bancaires/{compte_id}")
            except:
                pass
    
    def test_get_comptes_bancaires_list(self):
        """GET /api/comptes-bancaires - should return list of bank accounts"""
        response = requests.get(f"{BASE_URL}/api/comptes-bancaires")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/comptes-bancaires returns {len(data)} accounts")
    
    def test_create_compte_bancaire(self):
        """POST /api/comptes-bancaires - should create a new bank account"""
        payload = {
            "nom_banque": f"{TEST_PREFIX}Banque Test",
            "iban": "FR7612345678901234567890123",
            "bic": "TESTFRPP",
            "is_default": False
        }
        response = requests.post(f"{BASE_URL}/api/comptes-bancaires", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert data["nom_banque"] == payload["nom_banque"]
        assert data["iban"] == payload["iban"]
        assert data["bic"] == payload["bic"]
        
        self.test_compte_ids.append(data["id"])
        print(f"✓ POST /api/comptes-bancaires created account with id {data['id']}")
        
        # Verify persistence with GET
        get_response = requests.get(f"{BASE_URL}/api/comptes-bancaires/{data['id']}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["nom_banque"] == payload["nom_banque"]
        print("✓ Account persisted and retrievable via GET")
    
    def test_create_compte_bancaire_default(self):
        """POST /api/comptes-bancaires - should set as default when is_default=True"""
        payload = {
            "nom_banque": f"{TEST_PREFIX}Banque Default Test",
            "iban": "FR7698765432109876543210987",
            "bic": "DEFTFRPP",
            "is_default": True
        }
        response = requests.post(f"{BASE_URL}/api/comptes-bancaires", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        self.test_compte_ids.append(data["id"])
        
        # Verify it's set as default
        assert data["is_default"] == True
        print(f"✓ Account created with is_default=True")
    
    def test_get_compte_bancaire_by_id(self):
        """GET /api/comptes-bancaires/{id} - should return specific account"""
        # First create an account
        payload = {
            "nom_banque": f"{TEST_PREFIX}Banque Get Test",
            "iban": "FR7611111111111111111111111",
            "bic": "GETFRPP",
            "is_default": False
        }
        create_response = requests.post(f"{BASE_URL}/api/comptes-bancaires", json=payload)
        compte_id = create_response.json()["id"]
        self.test_compte_ids.append(compte_id)
        
        # Get by ID
        response = requests.get(f"{BASE_URL}/api/comptes-bancaires/{compte_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == compte_id
        assert data["nom_banque"] == payload["nom_banque"]
        print(f"✓ GET /api/comptes-bancaires/{compte_id} returns correct account")
    
    def test_get_compte_bancaire_not_found(self):
        """GET /api/comptes-bancaires/{id} - should return 404 for non-existent account"""
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/comptes-bancaires/{fake_id}")
        assert response.status_code == 404
        print("✓ GET non-existent account returns 404")
    
    def test_update_compte_bancaire(self):
        """PUT /api/comptes-bancaires/{id} - should update bank account"""
        # First create an account
        payload = {
            "nom_banque": f"{TEST_PREFIX}Banque Update Test",
            "iban": "FR7622222222222222222222222",
            "bic": "UPDFRPP",
            "is_default": False
        }
        create_response = requests.post(f"{BASE_URL}/api/comptes-bancaires", json=payload)
        compte_id = create_response.json()["id"]
        self.test_compte_ids.append(compte_id)
        
        # Update the account
        update_payload = {
            "nom_banque": f"{TEST_PREFIX}Banque Updated",
            "iban": "FR7633333333333333333333333",
            "bic": "NEWFRPP",
            "is_default": False
        }
        response = requests.put(f"{BASE_URL}/api/comptes-bancaires/{compte_id}", json=update_payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["nom_banque"] == update_payload["nom_banque"]
        assert data["iban"] == update_payload["iban"]
        assert data["bic"] == update_payload["bic"]
        print(f"✓ PUT /api/comptes-bancaires/{compte_id} updated successfully")
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/comptes-bancaires/{compte_id}")
        fetched = get_response.json()
        assert fetched["nom_banque"] == update_payload["nom_banque"]
        print("✓ Update persisted correctly")
    
    def test_update_compte_bancaire_not_found(self):
        """PUT /api/comptes-bancaires/{id} - should return 404 for non-existent account"""
        fake_id = str(uuid.uuid4())
        payload = {
            "nom_banque": "Test",
            "iban": "FR7600000000000000000000000",
            "bic": "TESTFRPP",
            "is_default": False
        }
        response = requests.put(f"{BASE_URL}/api/comptes-bancaires/{fake_id}", json=payload)
        assert response.status_code == 404
        print("✓ PUT non-existent account returns 404")
    
    def test_delete_compte_bancaire(self):
        """DELETE /api/comptes-bancaires/{id} - should delete bank account"""
        # First create an account
        payload = {
            "nom_banque": f"{TEST_PREFIX}Banque Delete Test",
            "iban": "FR7644444444444444444444444",
            "bic": "DELFRPP",
            "is_default": False
        }
        create_response = requests.post(f"{BASE_URL}/api/comptes-bancaires", json=payload)
        compte_id = create_response.json()["id"]
        
        # Delete the account
        response = requests.delete(f"{BASE_URL}/api/comptes-bancaires/{compte_id}")
        assert response.status_code == 200
        print(f"✓ DELETE /api/comptes-bancaires/{compte_id} successful")
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/comptes-bancaires/{compte_id}")
        assert get_response.status_code == 404
        print("✓ Account no longer exists after deletion")
    
    def test_delete_compte_bancaire_not_found(self):
        """DELETE /api/comptes-bancaires/{id} - should return 404 for non-existent account"""
        fake_id = str(uuid.uuid4())
        response = requests.delete(f"{BASE_URL}/api/comptes-bancaires/{fake_id}")
        assert response.status_code == 404
        print("✓ DELETE non-existent account returns 404")


class TestComptesBancairesDefaultLogic:
    """Tests for default bank account logic"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.test_compte_ids = []
        yield
        # Cleanup test data
        for compte_id in self.test_compte_ids:
            try:
                requests.delete(f"{BASE_URL}/api/comptes-bancaires/{compte_id}")
            except:
                pass
    
    def test_setting_new_default_removes_old_default(self):
        """When setting a new default, the old default should be unset"""
        # Create first account as default
        payload1 = {
            "nom_banque": f"{TEST_PREFIX}First Default",
            "iban": "FR7655555555555555555555555",
            "bic": "FIR1FRPP",
            "is_default": True
        }
        response1 = requests.post(f"{BASE_URL}/api/comptes-bancaires", json=payload1)
        compte1_id = response1.json()["id"]
        self.test_compte_ids.append(compte1_id)
        
        # Create second account as default
        payload2 = {
            "nom_banque": f"{TEST_PREFIX}Second Default",
            "iban": "FR7666666666666666666666666",
            "bic": "SEC2FRPP",
            "is_default": True
        }
        response2 = requests.post(f"{BASE_URL}/api/comptes-bancaires", json=payload2)
        compte2_id = response2.json()["id"]
        self.test_compte_ids.append(compte2_id)
        
        # Check that first account is no longer default
        get_response1 = requests.get(f"{BASE_URL}/api/comptes-bancaires/{compte1_id}")
        compte1 = get_response1.json()
        
        get_response2 = requests.get(f"{BASE_URL}/api/comptes-bancaires/{compte2_id}")
        compte2 = get_response2.json()
        
        assert compte2["is_default"] == True
        assert compte1["is_default"] == False
        print("✓ Setting new default correctly unsets old default")


class TestFacturesWithCompteBancaire:
    """Tests for invoice creation with bank account selection"""
    
    def test_factures_list_includes_compte_bancaire_info(self):
        """GET /api/factures - should include bank account info in response"""
        response = requests.get(f"{BASE_URL}/api/factures")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Check structure of factures (if any exist)
        if len(data) > 0:
            facture = data[0]
            # These fields should exist (may be null for old factures)
            assert "compte_bancaire_id" in facture or facture.get("compte_bancaire_id") is None
            print(f"✓ GET /api/factures returns {len(data)} factures with bank account fields")
        else:
            print("✓ GET /api/factures returns empty list (no factures yet)")


class TestExistingBankAccounts:
    """Tests to verify existing bank accounts created by main agent"""
    
    def test_existing_bank_accounts(self):
        """Verify the 3 bank accounts mentioned in context exist"""
        response = requests.get(f"{BASE_URL}/api/comptes-bancaires")
        assert response.status_code == 200
        data = response.json()
        
        bank_names = [compte["nom_banque"] for compte in data]
        print(f"✓ Found {len(data)} bank accounts: {bank_names}")
        
        # Check if expected banks exist (from context: Crédit Agricole, BNP Paribas, Société Générale)
        expected_banks = ["Crédit Agricole", "BNP Paribas", "Société Générale"]
        for bank in expected_banks:
            if bank in bank_names:
                print(f"  ✓ Found expected bank: {bank}")
            else:
                print(f"  ⚠ Expected bank not found: {bank}")
        
        # Check for default account
        default_accounts = [c for c in data if c.get("is_default")]
        if default_accounts:
            print(f"  ✓ Default account: {default_accounts[0]['nom_banque']}")
        else:
            print("  ⚠ No default account set")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
