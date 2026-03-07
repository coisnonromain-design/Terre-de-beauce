"""
Test suite for Phase PDF Pointages et PWA Mobile Chauffeur features:
- PDF generation for pointages (daily and recap)
- Notes de frais CRUD with photo support
- Offline sync for pointages
- Justificatifs for factures
"""
import pytest
import requests
import os
import json
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data from existing database
CHAUFFEUR_CODE_1 = "43FC7D"  # Jean Dupont
CHAUFFEUR_CODE_2 = "EE81FC"  # Lorenzo GOHIER
EXISTING_CHANTIER_ID = "cb3dcd26-dc01-46fa-be3d-dac8975ea03d"  # CH-2026-001 (en_cours)
EXISTING_POINTAGE_ID = "f72c0c79-2da9-477d-a9d8-d432d7c83639"


class TestChauffeurLogin:
    """Test chauffeur authentication for mobile portal"""
    
    def test_chauffeur_login_valid_code(self):
        """Test login with valid chauffeur code"""
        response = requests.post(f"{BASE_URL}/api/chauffeur/login", json={
            "code_acces": CHAUFFEUR_CODE_1
        })
        assert response.status_code == 200
        data = response.json()
        assert "chauffeur_id" in data
        assert "chauffeur_nom" in data
        assert "token" in data
        print(f"✓ Chauffeur login successful: {data['chauffeur_nom']}")
    
    def test_chauffeur_login_invalid_code(self):
        """Test login with invalid code returns 401"""
        response = requests.post(f"{BASE_URL}/api/chauffeur/login", json={
            "code_acces": "INVALID"
        })
        assert response.status_code == 401
        print("✓ Invalid chauffeur code correctly rejected")


class TestPointagesPDF:
    """Test PDF generation for pointages"""
    
    def test_get_pointage_pdf(self):
        """Test generating PDF for a single pointage"""
        response = requests.get(f"{BASE_URL}/api/pointages/{EXISTING_POINTAGE_ID}/pdf")
        assert response.status_code == 200
        assert response.headers.get('content-type') == 'application/pdf'
        assert len(response.content) > 0
        print(f"✓ Pointage PDF generated, size: {len(response.content)} bytes")
    
    def test_get_pointage_pdf_not_found(self):
        """Test PDF generation for non-existent pointage"""
        response = requests.get(f"{BASE_URL}/api/pointages/nonexistent-id/pdf")
        assert response.status_code == 404
        print("✓ Non-existent pointage PDF correctly returns 404")
    
    def test_get_chantier_pointages_recap_pdf(self):
        """Test generating recap PDF for all pointages of a chantier"""
        response = requests.get(f"{BASE_URL}/api/chantiers/{EXISTING_CHANTIER_ID}/pointages/pdf")
        assert response.status_code == 200
        assert response.headers.get('content-type') == 'application/pdf'
        assert len(response.content) > 0
        print(f"✓ Chantier pointages recap PDF generated, size: {len(response.content)} bytes")
    
    def test_get_chantier_pointages_pdf_not_found(self):
        """Test recap PDF for non-existent chantier"""
        response = requests.get(f"{BASE_URL}/api/chantiers/nonexistent-id/pointages/pdf")
        assert response.status_code == 404
        print("✓ Non-existent chantier recap PDF correctly returns 404")


class TestNotesFrais:
    """Test notes de frais CRUD operations"""
    
    @pytest.fixture
    def chauffeur_session(self):
        """Get chauffeur session for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/chauffeur/login", json={
            "code_acces": CHAUFFEUR_CODE_2
        })
        return response.json()
    
    def test_get_notes_frais_list(self):
        """Test listing all notes de frais"""
        response = requests.get(f"{BASE_URL}/api/notes-frais")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print(f"✓ Notes de frais list retrieved: {len(response.json())} items")
    
    def test_get_notes_frais_by_chauffeur(self, chauffeur_session):
        """Test filtering notes de frais by chauffeur"""
        chauffeur_id = chauffeur_session['chauffeur_id']
        response = requests.get(f"{BASE_URL}/api/notes-frais?chauffeur_id={chauffeur_id}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned notes should belong to this chauffeur
        for note in data:
            assert note['chauffeur_id'] == chauffeur_id
        print(f"✓ Notes de frais filtered by chauffeur: {len(data)} items")
    
    def test_create_note_frais_carburant(self, chauffeur_session):
        """Test creating a fuel expense note"""
        chauffeur_id = chauffeur_session['chauffeur_id']
        note_data = {
            "chauffeur_id": chauffeur_id,
            "chantier_id": EXISTING_CHANTIER_ID,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "montant": 85.50,
            "type_frais": "carburant",
            "description": "TEST_Plein de gasoil station Total"
        }
        response = requests.post(f"{BASE_URL}/api/notes-frais", json=note_data)
        assert response.status_code == 200
        data = response.json()
        assert data['montant'] == 85.50
        assert data['type_frais'] == "carburant"
        assert data['statut'] == "en_attente"
        assert 'id' in data
        print(f"✓ Note de frais carburant created: {data['id']}")
        return data['id']
    
    def test_create_note_frais_peage(self, chauffeur_session):
        """Test creating a toll expense note"""
        chauffeur_id = chauffeur_session['chauffeur_id']
        note_data = {
            "chauffeur_id": chauffeur_id,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "montant": 12.30,
            "type_frais": "peage",
            "description": "TEST_Péage A10 Orléans-Tours"
        }
        response = requests.post(f"{BASE_URL}/api/notes-frais", json=note_data)
        assert response.status_code == 200
        data = response.json()
        assert data['type_frais'] == "peage"
        print(f"✓ Note de frais péage created: {data['id']}")
        return data['id']
    
    def test_create_note_frais_repas(self, chauffeur_session):
        """Test creating a meal expense note"""
        chauffeur_id = chauffeur_session['chauffeur_id']
        note_data = {
            "chauffeur_id": chauffeur_id,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "montant": 15.00,
            "type_frais": "repas",
            "description": "TEST_Déjeuner routier"
        }
        response = requests.post(f"{BASE_URL}/api/notes-frais", json=note_data)
        assert response.status_code == 200
        data = response.json()
        assert data['type_frais'] == "repas"
        print(f"✓ Note de frais repas created: {data['id']}")
        return data['id']
    
    def test_create_note_frais_with_photo(self, chauffeur_session):
        """Test creating expense note with photo (base64)"""
        chauffeur_id = chauffeur_session['chauffeur_id']
        # Small test image in base64 (1x1 red pixel PNG)
        test_photo_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
        
        note_data = {
            "chauffeur_id": chauffeur_id,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "montant": 45.00,
            "type_frais": "autre",
            "description": "TEST_Frais avec photo ticket",
            "photo_base64": test_photo_base64
        }
        response = requests.post(f"{BASE_URL}/api/notes-frais", json=note_data)
        assert response.status_code == 200
        data = response.json()
        assert data['photo_url'] is not None
        assert data['photo_url'].startswith('data:image')
        print(f"✓ Note de frais with photo created: {data['id']}")
        return data['id']
    
    def test_get_note_frais_by_id(self, chauffeur_session):
        """Test getting a specific note de frais"""
        # First create one
        chauffeur_id = chauffeur_session['chauffeur_id']
        create_response = requests.post(f"{BASE_URL}/api/notes-frais", json={
            "chauffeur_id": chauffeur_id,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "montant": 20.00,
            "type_frais": "autre",
            "description": "TEST_Note for GET test"
        })
        note_id = create_response.json()['id']
        
        # Then get it
        response = requests.get(f"{BASE_URL}/api/notes-frais/{note_id}")
        assert response.status_code == 200
        data = response.json()
        assert data['id'] == note_id
        assert data['montant'] == 20.00
        print(f"✓ Note de frais retrieved by ID: {note_id}")
    
    def test_update_note_frais_statut(self, chauffeur_session):
        """Test updating note de frais status"""
        # First create one
        chauffeur_id = chauffeur_session['chauffeur_id']
        create_response = requests.post(f"{BASE_URL}/api/notes-frais", json={
            "chauffeur_id": chauffeur_id,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "montant": 30.00,
            "type_frais": "carburant",
            "description": "TEST_Note for status update"
        })
        note_id = create_response.json()['id']
        
        # Update status to 'valide'
        response = requests.put(f"{BASE_URL}/api/notes-frais/{note_id}/statut?statut=valide")
        assert response.status_code == 200
        
        # Verify status changed
        get_response = requests.get(f"{BASE_URL}/api/notes-frais/{note_id}")
        assert get_response.json()['statut'] == 'valide'
        print(f"✓ Note de frais status updated to 'valide'")
    
    def test_delete_note_frais(self, chauffeur_session):
        """Test deleting a note de frais"""
        # First create one
        chauffeur_id = chauffeur_session['chauffeur_id']
        create_response = requests.post(f"{BASE_URL}/api/notes-frais", json={
            "chauffeur_id": chauffeur_id,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "montant": 10.00,
            "type_frais": "autre",
            "description": "TEST_Note to delete"
        })
        note_id = create_response.json()['id']
        
        # Delete it
        response = requests.delete(f"{BASE_URL}/api/notes-frais/{note_id}")
        assert response.status_code == 200
        
        # Verify it's gone
        get_response = requests.get(f"{BASE_URL}/api/notes-frais/{note_id}")
        assert get_response.status_code == 404
        print(f"✓ Note de frais deleted and verified: {note_id}")


class TestOfflineSync:
    """Test offline synchronization for pointages"""
    
    @pytest.fixture
    def chauffeur_session(self):
        """Get chauffeur session"""
        response = requests.post(f"{BASE_URL}/api/chauffeur/login", json={
            "code_acces": CHAUFFEUR_CODE_2
        })
        return response.json()
    
    def test_sync_single_pointage(self, chauffeur_session):
        """Test syncing a single offline pointage"""
        chauffeur_id = chauffeur_session['chauffeur_id']
        
        offline_pointages = [{
            "offline_id": "offline_123",
            "chauffeur_id": chauffeur_id,
            "chantier_id": EXISTING_CHANTIER_ID,
            "date": "2026-03-15",
            "heures_travaillees": 8.5,
            "tours": [
                {"id": "tour1", "volume": 25.0, "distance_km": 15.0, "commentaire": "TEST_Tour 1"}
            ],
            "commentaire": "TEST_Pointage synced from offline"
        }]
        
        response = requests.post(f"{BASE_URL}/api/sync/pointages", json=offline_pointages)
        assert response.status_code == 200
        data = response.json()
        assert 'success' in data
        assert 'errors' in data
        assert len(data['success']) == 1
        assert len(data['errors']) == 0
        assert data['success'][0]['offline_id'] == "offline_123"
        assert data['success'][0]['action'] in ['created', 'updated']
        print(f"✓ Single offline pointage synced: {data['success'][0]}")
    
    def test_sync_multiple_pointages(self, chauffeur_session):
        """Test syncing multiple offline pointages"""
        chauffeur_id = chauffeur_session['chauffeur_id']
        
        offline_pointages = [
            {
                "offline_id": "offline_multi_1",
                "chauffeur_id": chauffeur_id,
                "chantier_id": EXISTING_CHANTIER_ID,
                "date": "2026-03-16",
                "heures_travaillees": 7.0,
                "tours": [],
                "commentaire": "TEST_Multi sync 1"
            },
            {
                "offline_id": "offline_multi_2",
                "chauffeur_id": chauffeur_id,
                "chantier_id": EXISTING_CHANTIER_ID,
                "date": "2026-03-17",
                "heures_travaillees": 9.0,
                "tours": [
                    {"id": "t1", "volume": 30.0, "distance_km": 20.0}
                ],
                "commentaire": "TEST_Multi sync 2"
            }
        ]
        
        response = requests.post(f"{BASE_URL}/api/sync/pointages", json=offline_pointages)
        assert response.status_code == 200
        data = response.json()
        assert len(data['success']) == 2
        print(f"✓ Multiple offline pointages synced: {len(data['success'])} items")
    
    def test_sync_updates_existing_pointage(self, chauffeur_session):
        """Test that sync updates existing pointage for same date/chauffeur/chantier"""
        chauffeur_id = chauffeur_session['chauffeur_id']
        
        # First sync
        pointage1 = [{
            "offline_id": "offline_update_test",
            "chauffeur_id": chauffeur_id,
            "chantier_id": EXISTING_CHANTIER_ID,
            "date": "2026-03-18",
            "heures_travaillees": 5.0,
            "tours": [],
            "commentaire": "TEST_Original"
        }]
        
        response1 = requests.post(f"{BASE_URL}/api/sync/pointages", json=pointage1)
        assert response1.status_code == 200
        first_action = response1.json()['success'][0]['action']
        
        # Second sync with same date - should update
        pointage2 = [{
            "offline_id": "offline_update_test_2",
            "chauffeur_id": chauffeur_id,
            "chantier_id": EXISTING_CHANTIER_ID,
            "date": "2026-03-18",
            "heures_travaillees": 10.0,
            "tours": [{"id": "new_tour", "volume": 50.0, "distance_km": 30.0}],
            "commentaire": "TEST_Updated"
        }]
        
        response2 = requests.post(f"{BASE_URL}/api/sync/pointages", json=pointage2)
        assert response2.status_code == 200
        second_action = response2.json()['success'][0]['action']
        assert second_action == 'updated'
        print(f"✓ Sync correctly updates existing pointage (first: {first_action}, second: {second_action})")


class TestJustificatifs:
    """Test justificatifs (pointages) for factures"""
    
    @pytest.fixture
    def facture_id(self):
        """Get or create a facture for testing"""
        # First check if there are any factures
        response = requests.get(f"{BASE_URL}/api/factures")
        factures = response.json()
        if factures:
            return factures[0]['id']
        
        # If no factures, we need to create one
        # Get a chantier with pointages
        chantiers_response = requests.get(f"{BASE_URL}/api/chantiers")
        chantiers = chantiers_response.json()
        
        for chantier in chantiers:
            if chantier['statut'] in ['en_cours', 'termine']:
                # Try to generate a facture
                create_response = requests.post(f"{BASE_URL}/api/factures/generer", json={
                    "chantier_id": chantier['id'],
                    "date_echeance": "2026-04-15",
                    "notes": "TEST_Facture for justificatifs test"
                })
                if create_response.status_code == 200:
                    return create_response.json()['id']
        
        pytest.skip("No facture available for testing")
    
    def test_get_facture_justificatifs(self, facture_id):
        """Test getting justificatifs (pointages) for a facture"""
        response = requests.get(f"{BASE_URL}/api/factures/{facture_id}/justificatifs")
        assert response.status_code == 200
        data = response.json()
        assert 'facture' in data
        assert 'pointages' in data
        assert 'chantier' in data
        print(f"✓ Facture justificatifs retrieved: {len(data['pointages'])} pointages")
    
    def test_get_facture_justificatifs_pdf(self, facture_id):
        """Test generating PDF of justificatifs for a facture"""
        response = requests.get(f"{BASE_URL}/api/factures/{facture_id}/justificatifs/pdf")
        assert response.status_code == 200
        assert response.headers.get('content-type') == 'application/pdf'
        assert len(response.content) > 0
        print(f"✓ Facture justificatifs PDF generated, size: {len(response.content)} bytes")
    
    def test_get_justificatifs_not_found(self):
        """Test justificatifs for non-existent facture"""
        response = requests.get(f"{BASE_URL}/api/factures/nonexistent-id/justificatifs")
        assert response.status_code == 404
        print("✓ Non-existent facture justificatifs correctly returns 404")


class TestChauffeurChantiers:
    """Test chauffeur-specific chantier endpoints"""
    
    @pytest.fixture
    def chauffeur_session(self):
        """Get chauffeur session"""
        response = requests.post(f"{BASE_URL}/api/chauffeur/login", json={
            "code_acces": CHAUFFEUR_CODE_2
        })
        return response.json()
    
    def test_get_chauffeur_chantiers(self, chauffeur_session):
        """Test getting chantiers assigned to a chauffeur"""
        chauffeur_id = chauffeur_session['chauffeur_id']
        response = requests.get(f"{BASE_URL}/api/chauffeur/{chauffeur_id}/chantiers")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned chantiers should have this chauffeur in affectations
        for chantier in data:
            chauffeur_ids = [aff['chauffeur_id'] for aff in chantier.get('affectations', [])]
            assert chauffeur_id in chauffeur_ids
        print(f"✓ Chauffeur chantiers retrieved: {len(data)} chantiers")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_notes_frais(self):
        """Remove TEST_ prefixed notes de frais"""
        response = requests.get(f"{BASE_URL}/api/notes-frais")
        notes = response.json()
        deleted_count = 0
        for note in notes:
            if note.get('description', '').startswith('TEST_'):
                delete_response = requests.delete(f"{BASE_URL}/api/notes-frais/{note['id']}")
                if delete_response.status_code == 200:
                    deleted_count += 1
        print(f"✓ Cleaned up {deleted_count} test notes de frais")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
