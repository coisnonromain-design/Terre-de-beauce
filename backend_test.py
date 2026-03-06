import requests
import sys
from datetime import datetime
import json

class TerreDeBeauceAPITester:
    def __init__(self, base_url="https://fleet-dispatch-sys.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_ids = {
            'tracteurs': [],
            'equipements': [],
            'chauffeurs': [],
            'clients': [],
            'chantiers': []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.text else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.text:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_dashboard_stats(self):
        """Test dashboard statistics endpoint"""
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        if success:
            required_fields = ['total_tracteurs', 'tracteurs_disponibles', 'total_equipements', 
                             'equipements_disponibles', 'total_chauffeurs', 'chauffeurs_disponibles',
                             'total_clients', 'chantiers_en_cours', 'chantiers_planifies']
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing field in stats: {field}")
                    return False
            print(f"   Stats: {response}")
        return success

    def test_tracteur_crud(self):
        """Test tracteur CRUD operations"""
        # Create tracteur
        tracteur_data = {
            "identifiant": "A",
            "marque": "John Deere",
            "modele": "6R 250",
            "immatriculation": "AB-123-CD",
            "annee": 2020,
            "statut": "disponible",
            "notes": "Test tracteur"
        }
        
        success, response = self.run_test(
            "Create Tracteur",
            "POST",
            "tracteurs",
            200,
            data=tracteur_data
        )
        
        if not success:
            return False
            
        tracteur_id = response.get('id')
        if tracteur_id:
            self.created_ids['tracteurs'].append(tracteur_id)
        
        # Get tracteur
        success, _ = self.run_test(
            "Get Tracteur",
            "GET",
            f"tracteurs/{tracteur_id}",
            200
        )
        
        if not success:
            return False
            
        # Update tracteur
        update_data = tracteur_data.copy()
        update_data['marque'] = "Fendt"
        
        success, _ = self.run_test(
            "Update Tracteur",
            "PUT",
            f"tracteurs/{tracteur_id}",
            200,
            data=update_data
        )
        
        # Get all tracteurs
        success, _ = self.run_test(
            "Get All Tracteurs",
            "GET",
            "tracteurs",
            200
        )
        
        return success

    def test_equipement_crud(self):
        """Test equipement CRUD operations"""
        # Create remorque
        equipement_data = {
            "numero": "1",
            "type": "remorque",
            "capacite": "25T",
            "marque": "Test Brand",
            "immatriculation": "EQ-123-CD",
            "statut": "disponible",
            "notes": "Test remorque"
        }
        
        success, response = self.run_test(
            "Create Equipement",
            "POST",
            "equipements",
            200,
            data=equipement_data
        )
        
        if not success:
            return False
            
        equipement_id = response.get('id')
        if equipement_id:
            self.created_ids['equipements'].append(equipement_id)
        
        # Get equipement
        success, _ = self.run_test(
            "Get Equipement",
            "GET",
            f"equipements/{equipement_id}",
            200
        )
        
        if not success:
            return False
            
        # Get equipements by type
        success, _ = self.run_test(
            "Get Equipements by Type",
            "GET",
            "equipements",
            200,
            params={"type": "remorque"}
        )
        
        return success

    def test_chauffeur_crud(self):
        """Test chauffeur CRUD operations"""
        chauffeur_data = {
            "nom": "Dupont",
            "prenom": "Jean",
            "telephone": "06 12 34 56 78",
            "email": "jean.dupont@test.com",
            "permis": "C",
            "date_embauche": "2024-01-15",
            "disponible": True,
            "notes": "Test chauffeur"
        }
        
        success, response = self.run_test(
            "Create Chauffeur",
            "POST",
            "chauffeurs",
            200,
            data=chauffeur_data
        )
        
        if not success:
            return False
            
        chauffeur_id = response.get('id')
        if chauffeur_id:
            self.created_ids['chauffeurs'].append(chauffeur_id)
        
        # Get chauffeur
        success, _ = self.run_test(
            "Get Chauffeur",
            "GET",
            f"chauffeurs/{chauffeur_id}",
            200
        )
        
        return success

    def test_client_crud(self):
        """Test client CRUD operations"""
        client_data = {
            "raison_sociale": "Test SARL",
            "siren": "123456789",
            "siret": "12345678900012",
            "tva_intracommunautaire": "FR12345678901",
            "adresse": "123 Rue de Test",
            "code_postal": "45000",
            "ville": "Orléans",
            "pays": "France",
            "telephone": "02 38 00 00 00",
            "email": "contact@test.com",
            "contact_nom": "M. Test",
            "contact_telephone": "06 00 00 00 00",
            "notes": "Client test"
        }
        
        success, response = self.run_test(
            "Create Client",
            "POST",
            "clients",
            200,
            data=client_data
        )
        
        if not success:
            return False
            
        client_id = response.get('id')
        if client_id:
            self.created_ids['clients'].append(client_id)
        
        # Get client
        success, _ = self.run_test(
            "Get Client",
            "GET",
            f"clients/{client_id}",
            200
        )
        
        return success

    def test_chantier_crud(self):
        """Test chantier CRUD operations with affectations"""
        # Need existing tracteur, equipement, chauffeur, and client
        if not (self.created_ids['tracteurs'] and self.created_ids['equipements'] 
                and self.created_ids['chauffeurs'] and self.created_ids['clients']):
            print("❌ Cannot test chantiers without existing resources")
            return False
            
        chantier_data = {
            "reference": "CH-2024-001",
            "client_id": self.created_ids['clients'][0],
            "lieu": "Champ de test, Orléans",
            "description": "Chantier de test",
            "date_debut": "2024-12-01",
            "date_fin": "2024-12-15",
            "statut": "planifie",
            "affectations": [
                {
                    "tracteur_id": self.created_ids['tracteurs'][0],
                    "equipement_id": self.created_ids['equipements'][0],
                    "chauffeur_id": self.created_ids['chauffeurs'][0]
                }
            ],
            "notes": "Chantier test"
        }
        
        success, response = self.run_test(
            "Create Chantier with Affectations",
            "POST",
            "chantiers",
            200,
            data=chantier_data
        )
        
        if not success:
            return False
            
        chantier_id = response.get('id')
        if chantier_id:
            self.created_ids['chantiers'].append(chantier_id)
            
        # Verify affectations were enriched
        if 'affectations' in response and len(response['affectations']) > 0:
            aff = response['affectations'][0]
            if not all(key in aff for key in ['tracteur_identifiant', 'equipement_numero', 'chauffeur_nom']):
                print("❌ Affectations not properly enriched")
                return False
            print(f"   Affectation enriched: {aff}")
        
        # Get chantier
        success, _ = self.run_test(
            "Get Chantier",
            "GET",
            f"chantiers/{chantier_id}",
            200
        )
        
        # Get chantiers by status
        success, _ = self.run_test(
            "Get Chantiers by Status",
            "GET",
            "chantiers",
            200,
            params={"statut": "planifie"}
        )
        
        return success

    def cleanup_test_data(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete in reverse order due to dependencies
        for chantier_id in self.created_ids['chantiers']:
            self.run_test("Delete Chantier", "DELETE", f"chantiers/{chantier_id}", 200)
            
        for client_id in self.created_ids['clients']:
            self.run_test("Delete Client", "DELETE", f"clients/{client_id}", 200)
            
        for chauffeur_id in self.created_ids['chauffeurs']:
            self.run_test("Delete Chauffeur", "DELETE", f"chauffeurs/{chauffeur_id}", 200)
            
        for equipement_id in self.created_ids['equipements']:
            self.run_test("Delete Equipement", "DELETE", f"equipements/{equipement_id}", 200)
            
        for tracteur_id in self.created_ids['tracteurs']:
            self.run_test("Delete Tracteur", "DELETE", f"tracteurs/{tracteur_id}", 200)

def main():
    print("🚜 Testing Terre de Beauce ERP API")
    print("=" * 50)
    
    tester = TerreDeBeauceAPITester()
    
    # Test API root
    success, _ = tester.run_test("API Root", "GET", "", 200)
    if not success:
        print("❌ API not accessible, stopping tests")
        return 1
    
    # Test dashboard stats (should work even with empty data)
    if not tester.test_dashboard_stats():
        print("❌ Dashboard stats failed")
        return 1
    
    # Test CRUD operations
    tests = [
        ("Tracteur CRUD", tester.test_tracteur_crud),
        ("Equipement CRUD", tester.test_equipement_crud),
        ("Chauffeur CRUD", tester.test_chauffeur_crud),
        ("Client CRUD", tester.test_client_crud),
        ("Chantier CRUD", tester.test_chantier_crud),
    ]
    
    for test_name, test_func in tests:
        print(f"\n📋 Running {test_name}...")
        if not test_func():
            print(f"❌ {test_name} failed")
            tester.cleanup_test_data()
            return 1
    
    # Clean up
    tester.cleanup_test_data()
    
    # Print results
    print(f"\n📊 Tests completed: {tester.tests_passed}/{tester.tests_run}")
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"📈 Success rate: {success_rate:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("❌ Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())