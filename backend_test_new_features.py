import requests
import sys
from datetime import datetime, timedelta
import json

class TerreDeBeauceNewFeaturesTest:
    def __init__(self, base_url="https://transport-fleet-mgmt-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_ids = {
            'tracteurs': [],
            'equipements': [],
            'chauffeurs': [],
            'clients': [],
            'chantiers': [],
            'pointages': [],
            'factures': []
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

    def test_client_with_tarification(self):
        """Test client creation with tarification (€/h, €/tonne, €/jour)"""
        client_data = {
            "raison_sociale": "Client Tarifs Test",
            "adresse": "123 Rue Test",
            "code_postal": "45000",
            "ville": "Orléans",
            "pays": "France",
            "tarifs": [
                {
                    "methode": "heure",
                    "prix_unitaire": 45.50,
                    "description": "Tarif horaire standard"
                },
                {
                    "methode": "tonne",
                    "prix_unitaire": 12.00,
                    "description": "Transport au tonnage"
                },
                {
                    "methode": "journee",
                    "prix_unitaire": 350.00,
                    "description": "Forfait journalier"
                }
            ]
        }
        
        success, response = self.run_test(
            "Create Client with Tarification",
            "POST",
            "clients",
            200,
            data=client_data
        )
        
        if success and response.get('id'):
            self.created_ids['clients'].append(response['id'])
            # Verify tarifs are saved
            if 'tarifs' in response and len(response['tarifs']) == 3:
                print(f"   ✅ Tarifs saved: {len(response['tarifs'])} tarifs")
                for tarif in response['tarifs']:
                    print(f"      - {tarif['methode']}: {tarif['prix_unitaire']}€")
            else:
                print(f"   ❌ Tarifs not properly saved")
                return False
        
        return success

    def test_chauffeur_with_code_acces(self):
        """Test chauffeur creation with automatic code_acces generation"""
        chauffeur_data = {
            "nom": "Martin",
            "prenom": "Pierre",
            "telephone": "06 12 34 56 78",
            "email": "pierre.martin@test.com",
            "permis": "C",
            "disponible": True
        }
        
        success, response = self.run_test(
            "Create Chauffeur (auto code_acces)",
            "POST",
            "chauffeurs",
            200,
            data=chauffeur_data
        )
        
        if success and response.get('id'):
            self.created_ids['chauffeurs'].append(response['id'])
            # Verify code_acces was generated
            if 'code_acces' in response and response['code_acces']:
                print(f"   ✅ Code d'accès généré: {response['code_acces']}")
                return True, response['code_acces']
            else:
                print(f"   ❌ Code d'accès non généré")
                return False, None
        
        return success, None

    def test_chauffeur_login(self, code_acces):
        """Test chauffeur portal login"""
        if not code_acces:
            print("❌ No code_acces to test login")
            return False
            
        login_data = {
            "code_acces": code_acces
        }
        
        success, response = self.run_test(
            "Chauffeur Portal Login",
            "POST",
            "chauffeur/login",
            200,
            data=login_data
        )
        
        if success:
            required_fields = ['chauffeur_id', 'chauffeur_nom', 'token']
            for field in required_fields:
                if field not in response:
                    print(f"   ❌ Missing field in login response: {field}")
                    return False
            print(f"   ✅ Login successful for: {response['chauffeur_nom']}")
            return True, response
        
        return False, None

    def test_chantier_with_tarification(self):
        """Test chantier creation with tarification and affectations"""
        if not (self.created_ids['clients'] and self.created_ids['chauffeurs']):
            print("❌ Need client and chauffeur for chantier test")
            return False
            
        # Create minimal tracteur and equipement for affectation
        tracteur_data = {
            "identifiant": "T-TEST",
            "marque": "Test",
            "modele": "Test",
            "immatriculation": "TEST-123"
        }
        
        success, tracteur_response = self.run_test(
            "Create Test Tracteur",
            "POST",
            "tracteurs",
            200,
            data=tracteur_data
        )
        
        if success:
            self.created_ids['tracteurs'].append(tracteur_response['id'])
        
        equipement_data = {
            "numero": "E-TEST",
            "type": "remorque"
        }
        
        success, equipement_response = self.run_test(
            "Create Test Equipement",
            "POST",
            "equipements",
            200,
            data=equipement_data
        )
        
        if success:
            self.created_ids['equipements'].append(equipement_response['id'])
        
        # Create chantier with tarification
        chantier_data = {
            "reference": "CH-TARIF-001",
            "client_id": self.created_ids['clients'][0],
            "lieu": "Site de test avec tarification",
            "date_debut": "2024-12-01",
            "statut": "en_cours",
            "affectations": [
                {
                    "tracteur_id": tracteur_response['id'],
                    "equipement_id": equipement_response['id'],
                    "chauffeur_id": self.created_ids['chauffeurs'][0]
                }
            ],
            "tarifs": [
                {
                    "methode": "heure",
                    "prix_unitaire": 50.00,
                    "description": "Tarif spécial chantier"
                }
            ],
            "transport_type": "solide"
        }
        
        success, response = self.run_test(
            "Create Chantier with Tarification",
            "POST",
            "chantiers",
            200,
            data=chantier_data
        )
        
        if success and response.get('id'):
            self.created_ids['chantiers'].append(response['id'])
            # Verify tarifs and affectations
            if 'tarifs' in response and len(response['tarifs']) > 0:
                print(f"   ✅ Chantier tarifs: {response['tarifs']}")
            if 'affectations' in response and len(response['affectations']) > 0:
                aff = response['affectations'][0]
                if 'chauffeur_nom' in aff:
                    print(f"   ✅ Affectation enriched: {aff['chauffeur_nom']}")
        
        return success

    def test_pointage_submission(self):
        """Test pointage submission (chauffeur portal functionality)"""
        if not (self.created_ids['chantiers'] and self.created_ids['chauffeurs']):
            print("❌ Need chantier and chauffeur for pointage test")
            return False
            
        pointage_data = {
            "chantier_id": self.created_ids['chantiers'][0],
            "chauffeur_id": self.created_ids['chauffeurs'][0],
            "date": datetime.now().strftime("%Y-%m-%d"),
            "heures_travaillees": 8.5,
            "tonnage_transporte": 25.0,
            "nombre_rotations": 3,
            "commentaire": "Journée test - tout s'est bien passé"
        }
        
        success, response = self.run_test(
            "Submit Pointage",
            "POST",
            "pointages",
            200,
            data=pointage_data
        )
        
        if success and response.get('id'):
            self.created_ids['pointages'].append(response['id'])
            # Verify enriched data
            if 'chantier_reference' in response and 'chauffeur_nom' in response:
                print(f"   ✅ Pointage enriched: {response['chantier_reference']} - {response['chauffeur_nom']}")
        
        return success

    def test_pointages_view(self):
        """Test consolidated pointages view"""
        success, response = self.run_test(
            "Get All Pointages",
            "GET",
            "pointages",
            200
        )
        
        if success:
            print(f"   ✅ Found {len(response)} pointages")
            if len(response) > 0:
                pointage = response[0]
                required_fields = ['date', 'heures_travaillees', 'tonnage_transporte', 'chantier_reference', 'chauffeur_nom']
                for field in required_fields:
                    if field not in pointage:
                        print(f"   ❌ Missing field in pointage: {field}")
                        return False
        
        return success

    def test_facture_generation(self):
        """Test automatic invoice generation from pointages"""
        if not self.created_ids['chantiers']:
            print("❌ Need chantier for facture generation")
            return False
            
        # First check chantier recap
        success, recap_response = self.run_test(
            "Get Chantier Recap",
            "GET",
            f"chantiers/{self.created_ids['chantiers'][0]}/recap",
            200
        )
        
        if success:
            print(f"   ✅ Recap - Heures: {recap_response.get('total_heures', 0)}, Tonnage: {recap_response.get('total_tonnage', 0)}")
            print(f"   ✅ Montant estimé: {recap_response.get('montant_ttc', 0)}€ TTC")
        
        # Generate facture
        facture_data = {
            "chantier_id": self.created_ids['chantiers'][0],
            "date_echeance": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
            "notes": "Facture générée automatiquement depuis les pointages"
        }
        
        success, response = self.run_test(
            "Generate Facture from Chantier",
            "POST",
            "factures/generer",
            200,
            data=facture_data
        )
        
        if success and response.get('id'):
            self.created_ids['factures'].append(response['id'])
            # Verify facture content
            required_fields = ['numero', 'lignes', 'montant_ht', 'montant_ttc']
            for field in required_fields:
                if field not in response:
                    print(f"   ❌ Missing field in facture: {field}")
                    return False
            
            print(f"   ✅ Facture générée: {response['numero']}")
            print(f"   ✅ Montant TTC: {response['montant_ttc']}€")
            print(f"   ✅ Lignes de facture: {len(response['lignes'])}")
        
        return success

    def test_configuration_update(self):
        """Test company configuration update"""
        config_data = {
            "raison_sociale": "TERRE DE BEAUCE - TEST",
            "telephone": "02 38 12 34 56",
            "iban": "FR76 1234 5678 9012 3456 7890 123",
            "bic": "BNPAFRPP"
        }
        
        success, response = self.run_test(
            "Update Company Configuration",
            "PUT",
            "config/entreprise",
            200,
            data=config_data
        )
        
        if success:
            # Verify update
            success, get_response = self.run_test(
                "Get Updated Configuration",
                "GET",
                "config/entreprise",
                200
            )
            
            if success:
                for key, value in config_data.items():
                    if get_response.get(key) != value:
                        print(f"   ❌ Configuration not updated for {key}")
                        return False
                print(f"   ✅ Configuration updated successfully")
        
        return success

    def cleanup_test_data(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete in reverse order due to dependencies
        for facture_id in self.created_ids['factures']:
            self.run_test("Delete Facture", "DELETE", f"factures/{facture_id}", 200)
            
        for pointage_id in self.created_ids['pointages']:
            self.run_test("Delete Pointage", "DELETE", f"pointages/{pointage_id}", 200)
            
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
    print("🚜 Testing Terre de Beauce ERP - New Features")
    print("=" * 60)
    
    tester = TerreDeBeauceNewFeaturesTest()
    
    # Test new features in order
    tests = [
        ("Client with Tarification", tester.test_client_with_tarification),
        ("Chauffeur with Code Access", lambda: tester.test_chauffeur_with_code_acces()[0]),
        ("Chantier with Tarification", tester.test_chantier_with_tarification),
        ("Pointage Submission", tester.test_pointage_submission),
        ("Pointages View", tester.test_pointages_view),
        ("Facture Generation", tester.test_facture_generation),
        ("Configuration Update", tester.test_configuration_update),
    ]
    
    # Test chauffeur login separately to get code_acces
    print(f"\n📋 Testing Chauffeur Features...")
    success, code_acces = tester.test_chauffeur_with_code_acces()
    if success and code_acces:
        login_success, login_response = tester.test_chauffeur_login(code_acces)
        if not login_success:
            print("❌ Chauffeur login failed")
            tester.cleanup_test_data()
            return 1
    
    for test_name, test_func in tests:
        if test_name == "Chauffeur with Code Access":
            continue  # Already tested above
            
        print(f"\n📋 Testing {test_name}...")
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
        print("🎉 All new features tests passed!")
        return 0
    else:
        print("❌ Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())