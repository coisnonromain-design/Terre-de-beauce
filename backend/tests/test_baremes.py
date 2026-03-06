"""
Test suite for Barèmes Kilométriques API endpoints
Tests the Phase 3 implementation: kilometric pricing configuration
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestBaremesAPI:
    """Tests for /api/config/baremes endpoints"""
    
    def test_get_baremes_returns_200(self):
        """GET /api/config/baremes should return 200"""
        response = requests.get(f"{BASE_URL}/api/config/baremes")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ GET /api/config/baremes returns 200")
    
    def test_get_baremes_has_4_bareme_types(self):
        """GET /api/config/baremes should return all 4 barème types"""
        response = requests.get(f"{BASE_URL}/api/config/baremes")
        data = response.json()
        
        required_types = [
            "solide_avec_gasoil",
            "solide_sans_gasoil", 
            "liquide_avec_gasoil",
            "liquide_sans_gasoil"
        ]
        
        for bareme_type in required_types:
            assert bareme_type in data, f"Missing barème type: {bareme_type}"
            assert "tranches" in data[bareme_type], f"Missing tranches in {bareme_type}"
        
        print("✓ All 4 barème types present (solide/liquide × avec/sans gasoil)")
    
    def test_each_bareme_has_20_tranches(self):
        """Each barème should have exactly 20 tranches (0-50km in 2.5km steps)"""
        response = requests.get(f"{BASE_URL}/api/config/baremes")
        data = response.json()
        
        bareme_types = [
            "solide_avec_gasoil",
            "solide_sans_gasoil",
            "liquide_avec_gasoil", 
            "liquide_sans_gasoil"
        ]
        
        for bareme_type in bareme_types:
            tranches = data[bareme_type]["tranches"]
            assert len(tranches) == 20, f"{bareme_type} has {len(tranches)} tranches, expected 20"
        
        print("✓ Each barème has exactly 20 tranches")
    
    def test_tranches_cover_0_to_50km(self):
        """Tranches should cover 0-2.5km, 2.5-5km, ... up to 47.5-50km"""
        response = requests.get(f"{BASE_URL}/api/config/baremes")
        data = response.json()
        
        tranches = data["solide_avec_gasoil"]["tranches"]
        
        # Check first tranche
        assert tranches[0]["km_min"] == 0.0, f"First tranche km_min should be 0, got {tranches[0]['km_min']}"
        assert tranches[0]["km_max"] == 2.5, f"First tranche km_max should be 2.5, got {tranches[0]['km_max']}"
        
        # Check last tranche
        assert tranches[19]["km_min"] == 47.5, f"Last tranche km_min should be 47.5, got {tranches[19]['km_min']}"
        assert tranches[19]["km_max"] == 50.0, f"Last tranche km_max should be 50, got {tranches[19]['km_max']}"
        
        # Check all tranches are 2.5km intervals
        for i, tranche in enumerate(tranches):
            expected_min = i * 2.5
            expected_max = (i + 1) * 2.5
            assert tranche["km_min"] == expected_min, f"Tranche {i} km_min should be {expected_min}"
            assert tranche["km_max"] == expected_max, f"Tranche {i} km_max should be {expected_max}"
        
        print("✓ Tranches correctly cover 0-50km in 2.5km intervals")
    
    def test_baremes_has_taux_horaire_minimum(self):
        """Barèmes config should include taux_horaire_minimum field"""
        response = requests.get(f"{BASE_URL}/api/config/baremes")
        data = response.json()
        
        assert "taux_horaire_minimum" in data, "Missing taux_horaire_minimum field"
        assert isinstance(data["taux_horaire_minimum"], (int, float)), "taux_horaire_minimum should be numeric"
        
        print(f"✓ taux_horaire_minimum present: {data['taux_horaire_minimum']}€/h")
    
    def test_update_baremes_full(self):
        """PUT /api/config/baremes should update all barèmes"""
        # First get current baremes
        get_response = requests.get(f"{BASE_URL}/api/config/baremes")
        original_data = get_response.json()
        
        # Prepare update with modified prices
        update_payload = {
            "solide_avec_gasoil": {
                "tranches": [
                    {"km_min": i * 2.5, "km_max": (i + 1) * 2.5, "prix_tonne_km": 1.5 + (i * 0.1)}
                    for i in range(20)
                ]
            },
            "taux_horaire_minimum": 85.50
        }
        
        # Update
        put_response = requests.put(f"{BASE_URL}/api/config/baremes", json=update_payload)
        assert put_response.status_code == 200, f"PUT failed with {put_response.status_code}"
        
        # Verify update persisted
        verify_response = requests.get(f"{BASE_URL}/api/config/baremes")
        verify_data = verify_response.json()
        
        assert verify_data["taux_horaire_minimum"] == 85.50, "taux_horaire_minimum not updated"
        assert verify_data["solide_avec_gasoil"]["tranches"][0]["prix_tonne_km"] == 1.5, "First tranche price not updated"
        
        # Reset to original values
        reset_payload = {
            "solide_avec_gasoil": original_data["solide_avec_gasoil"],
            "taux_horaire_minimum": original_data.get("taux_horaire_minimum", 0)
        }
        requests.put(f"{BASE_URL}/api/config/baremes", json=reset_payload)
        
        print("✓ PUT /api/config/baremes successfully updates barèmes")
    
    def test_update_single_bareme(self):
        """PUT /api/config/baremes/{type} should update a single barème"""
        # Get original
        get_response = requests.get(f"{BASE_URL}/api/config/baremes")
        original_data = get_response.json()
        
        # Update single barème
        update_payload = {
            "tranches": [
                {"km_min": i * 2.5, "km_max": (i + 1) * 2.5, "prix_tonne_km": 2.0 + (i * 0.05)}
                for i in range(20)
            ]
        }
        
        put_response = requests.put(
            f"{BASE_URL}/api/config/baremes/liquide_avec_gasoil",
            json=update_payload
        )
        assert put_response.status_code == 200, f"PUT single barème failed: {put_response.status_code}"
        
        # Verify
        verify_response = requests.get(f"{BASE_URL}/api/config/baremes")
        verify_data = verify_response.json()
        
        assert verify_data["liquide_avec_gasoil"]["tranches"][0]["prix_tonne_km"] == 2.0
        
        # Reset
        reset_payload = {"tranches": original_data["liquide_avec_gasoil"]["tranches"]}
        requests.put(f"{BASE_URL}/api/config/baremes/liquide_avec_gasoil", json=reset_payload)
        
        print("✓ PUT /api/config/baremes/{type} updates single barème")
    
    def test_update_invalid_bareme_type_returns_400(self):
        """PUT /api/config/baremes/{invalid_type} should return 400"""
        update_payload = {"tranches": []}
        
        response = requests.put(
            f"{BASE_URL}/api/config/baremes/invalid_type",
            json=update_payload
        )
        assert response.status_code == 400, f"Expected 400 for invalid type, got {response.status_code}"
        
        print("✓ Invalid barème type returns 400")
    
    def test_tranches_have_prix_tonne_km_field(self):
        """Each tranche should have prix_tonne_km field"""
        response = requests.get(f"{BASE_URL}/api/config/baremes")
        data = response.json()
        
        for bareme_type in ["solide_avec_gasoil", "solide_sans_gasoil", "liquide_avec_gasoil", "liquide_sans_gasoil"]:
            for i, tranche in enumerate(data[bareme_type]["tranches"]):
                assert "prix_tonne_km" in tranche, f"Missing prix_tonne_km in {bareme_type} tranche {i}"
                assert isinstance(tranche["prix_tonne_km"], (int, float)), f"prix_tonne_km should be numeric"
        
        print("✓ All tranches have prix_tonne_km field")


class TestBaremesDataIntegrity:
    """Tests for data integrity and persistence"""
    
    def test_update_and_verify_persistence(self):
        """Update barèmes and verify changes persist after re-fetch"""
        # Get original
        original = requests.get(f"{BASE_URL}/api/config/baremes").json()
        
        # Update taux_horaire_minimum
        test_value = 99.99
        requests.put(f"{BASE_URL}/api/config/baremes", json={"taux_horaire_minimum": test_value})
        
        # Verify persistence
        verify = requests.get(f"{BASE_URL}/api/config/baremes").json()
        assert verify["taux_horaire_minimum"] == test_value, "Value not persisted"
        
        # Reset
        requests.put(f"{BASE_URL}/api/config/baremes", json={"taux_horaire_minimum": original.get("taux_horaire_minimum", 0)})
        
        print("✓ Barèmes updates persist correctly")
    
    def test_partial_update_preserves_other_fields(self):
        """Updating one barème should not affect others"""
        # Get original
        original = requests.get(f"{BASE_URL}/api/config/baremes").json()
        
        # Update only solide_avec_gasoil
        update_payload = {
            "solide_avec_gasoil": {
                "tranches": [
                    {"km_min": i * 2.5, "km_max": (i + 1) * 2.5, "prix_tonne_km": 5.0}
                    for i in range(20)
                ]
            }
        }
        requests.put(f"{BASE_URL}/api/config/baremes", json=update_payload)
        
        # Verify other barèmes unchanged
        verify = requests.get(f"{BASE_URL}/api/config/baremes").json()
        
        # solide_sans_gasoil should be unchanged
        assert verify["solide_sans_gasoil"]["tranches"] == original["solide_sans_gasoil"]["tranches"], \
            "solide_sans_gasoil was modified unexpectedly"
        
        # Reset
        requests.put(f"{BASE_URL}/api/config/baremes", json={"solide_avec_gasoil": original["solide_avec_gasoil"]})
        
        print("✓ Partial updates preserve other fields")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
