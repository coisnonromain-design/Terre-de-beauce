"""
Test suite for Admin and Chauffeur Authentication
Tests the new authentication system with:
- Admin login with email/password and JWT
- Multi-admin management
- Chauffeur login with access code
- Route protection
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "r.coisnon@terredebeauce.com"
ADMIN_PASSWORD = "Mennessard03"
CHAUFFEUR_CODES = ["43FC7D", "EE81FC"]


class TestAdminAuthentication:
    """Tests for admin authentication endpoints"""
    
    def test_admin_check_endpoint(self):
        """Test /api/admin/check returns has_admins status"""
        response = requests.get(f"{BASE_URL}/api/admin/check")
        assert response.status_code == 200
        data = response.json()
        assert "has_admins" in data
        print(f"Admin check: has_admins = {data['has_admins']}")
    
    def test_admin_init_creates_default_admin(self):
        """Test /api/admin/init creates default admin if none exists"""
        # First check if admins exist
        check_response = requests.get(f"{BASE_URL}/api/admin/check")
        has_admins = check_response.json().get("has_admins", False)
        
        if not has_admins:
            # Initialize admin
            response = requests.post(f"{BASE_URL}/api/admin/init")
            assert response.status_code == 200
            data = response.json()
            assert data["email"] == ADMIN_EMAIL
            print(f"Admin initialized: {data['email']}")
        else:
            # Should return 400 if admins already exist
            response = requests.post(f"{BASE_URL}/api/admin/init")
            assert response.status_code == 400
            print("Admin already exists, init correctly rejected")
    
    def test_admin_login_success(self):
        """Test successful admin login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "token" in data
        assert "admin_id" in data
        assert "email" in data
        assert "nom" in data
        assert "prenom" in data
        
        # Verify values
        assert data["email"] == ADMIN_EMAIL
        assert len(data["token"]) > 0
        print(f"Admin login successful: {data['prenom']} {data['nom']}")
        
        return data["token"]
    
    def test_admin_login_wrong_password(self):
        """Test admin login fails with wrong password"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        print(f"Wrong password correctly rejected: {data['detail']}")
    
    def test_admin_login_wrong_email(self):
        """Test admin login fails with non-existent email"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": "nonexistent@email.com",
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 401
        print("Non-existent email correctly rejected")
    
    def test_admin_me_with_valid_token(self):
        """Test /api/admin/me returns admin info with valid token"""
        # First login to get token
        login_response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_response.json()["token"]
        
        # Get admin info
        response = requests.get(
            f"{BASE_URL}/api/admin/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert "email" in data
        assert "nom" in data
        assert "prenom" in data
        assert data["email"] == ADMIN_EMAIL
        print(f"Admin me endpoint working: {data['prenom']} {data['nom']}")
    
    def test_admin_me_without_token(self):
        """Test /api/admin/me fails without token"""
        response = requests.get(f"{BASE_URL}/api/admin/me")
        assert response.status_code == 401
        print("Admin me correctly requires authentication")
    
    def test_admin_me_with_invalid_token(self):
        """Test /api/admin/me fails with invalid token"""
        response = requests.get(
            f"{BASE_URL}/api/admin/me",
            headers={"Authorization": "Bearer invalid_token_here"}
        )
        assert response.status_code == 401
        print("Invalid token correctly rejected")


class TestAdminManagement:
    """Tests for admin management (CRUD operations)"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authentication headers"""
        login_response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_admin_list(self, auth_headers):
        """Test /api/admin/list returns list of admins"""
        response = requests.get(
            f"{BASE_URL}/api/admin/list",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) >= 1  # At least the default admin
        
        # Check admin structure (should not include password_hash)
        admin = data[0]
        assert "id" in admin
        assert "email" in admin
        assert "nom" in admin
        assert "prenom" in admin
        assert "password_hash" not in admin
        print(f"Admin list returned {len(data)} admin(s)")
    
    def test_admin_list_requires_auth(self):
        """Test /api/admin/list requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/list")
        assert response.status_code == 401
        print("Admin list correctly requires authentication")
    
    def test_create_admin(self, auth_headers):
        """Test creating a new admin"""
        unique_email = f"test_{uuid.uuid4().hex[:8]}@test.com"
        
        response = requests.post(
            f"{BASE_URL}/api/admin/create",
            headers=auth_headers,
            json={
                "email": unique_email,
                "nom": "Test",
                "prenom": "Admin",
                "password": "testpass123",
                "role": "admin"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["email"] == unique_email
        assert data["nom"] == "Test"
        assert data["prenom"] == "Admin"
        assert "id" in data
        assert "password_hash" not in data
        print(f"Created new admin: {data['email']}")
        
        # Cleanup - delete the test admin
        requests.delete(
            f"{BASE_URL}/api/admin/{data['id']}",
            headers=auth_headers
        )
        return data
    
    def test_create_admin_duplicate_email(self, auth_headers):
        """Test creating admin with duplicate email fails"""
        response = requests.post(
            f"{BASE_URL}/api/admin/create",
            headers=auth_headers,
            json={
                "email": ADMIN_EMAIL,  # Already exists
                "nom": "Duplicate",
                "prenom": "Test",
                "password": "testpass123",
                "role": "admin"
            }
        )
        assert response.status_code == 400
        print("Duplicate email correctly rejected")
    
    def test_delete_admin(self, auth_headers):
        """Test deleting an admin"""
        # First create an admin to delete
        unique_email = f"delete_test_{uuid.uuid4().hex[:8]}@test.com"
        create_response = requests.post(
            f"{BASE_URL}/api/admin/create",
            headers=auth_headers,
            json={
                "email": unique_email,
                "nom": "ToDelete",
                "prenom": "Admin",
                "password": "testpass123",
                "role": "admin"
            }
        )
        admin_id = create_response.json()["id"]
        
        # Delete the admin
        response = requests.delete(
            f"{BASE_URL}/api/admin/{admin_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        print(f"Admin {admin_id} deleted successfully")
        
        # Verify deletion - admin should not be in list
        list_response = requests.get(
            f"{BASE_URL}/api/admin/list",
            headers=auth_headers
        )
        admin_ids = [a["id"] for a in list_response.json()]
        assert admin_id not in admin_ids
        print("Deletion verified - admin no longer in list")
    
    def test_toggle_admin_active(self, auth_headers):
        """Test toggling admin active status"""
        # First create an admin to toggle
        unique_email = f"toggle_test_{uuid.uuid4().hex[:8]}@test.com"
        create_response = requests.post(
            f"{BASE_URL}/api/admin/create",
            headers=auth_headers,
            json={
                "email": unique_email,
                "nom": "ToToggle",
                "prenom": "Admin",
                "password": "testpass123",
                "role": "admin"
            }
        )
        admin_id = create_response.json()["id"]
        
        # Toggle active status
        response = requests.put(
            f"{BASE_URL}/api/admin/{admin_id}/toggle-active",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "is_active" in data
        print(f"Admin toggled: is_active = {data['is_active']}")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/admin/{admin_id}",
            headers=auth_headers
        )


class TestChauffeurAuthentication:
    """Tests for chauffeur authentication with access code"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get admin authentication headers"""
        login_response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_chauffeur_login_with_valid_code(self, auth_headers):
        """Test chauffeur login with valid access code"""
        # First, get list of chauffeurs to find one with a code
        chauffeurs_response = requests.get(f"{BASE_URL}/api/chauffeurs")
        chauffeurs = chauffeurs_response.json()
        
        # Find a chauffeur with a code or create one
        chauffeur_with_code = None
        for c in chauffeurs:
            if c.get("code_acces"):
                chauffeur_with_code = c
                break
        
        if not chauffeur_with_code:
            # Create a chauffeur with a known code
            create_response = requests.post(
                f"{BASE_URL}/api/chauffeurs",
                json={
                    "nom": "TestChauffeur",
                    "prenom": "Login",
                    "telephone": "0600000000",
                    "permis": "CE",
                    "code_acces": "TEST01"
                }
            )
            chauffeur_with_code = create_response.json()
            print(f"Created test chauffeur with code: {chauffeur_with_code['code_acces']}")
        
        # Test login
        code = chauffeur_with_code["code_acces"]
        response = requests.post(f"{BASE_URL}/api/chauffeur/login", json={
            "code_acces": code
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "chauffeur_id" in data
        assert "chauffeur_nom" in data
        assert "token" in data
        print(f"Chauffeur login successful: {data['chauffeur_nom']}")
    
    def test_chauffeur_login_with_invalid_code(self):
        """Test chauffeur login fails with invalid code"""
        response = requests.post(f"{BASE_URL}/api/chauffeur/login", json={
            "code_acces": "INVALID"
        })
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        print(f"Invalid code correctly rejected: {data['detail']}")
    
    def test_chauffeur_login_case_insensitive(self, auth_headers):
        """Test chauffeur login works with different case"""
        # Get a chauffeur with code
        chauffeurs_response = requests.get(f"{BASE_URL}/api/chauffeurs")
        chauffeurs = chauffeurs_response.json()
        
        chauffeur_with_code = None
        for c in chauffeurs:
            if c.get("code_acces"):
                chauffeur_with_code = c
                break
        
        if chauffeur_with_code:
            code = chauffeur_with_code["code_acces"]
            # Try lowercase
            response = requests.post(f"{BASE_URL}/api/chauffeur/login", json={
                "code_acces": code.lower()
            })
            # Note: The API may or may not be case-sensitive
            # This test documents the behavior
            if response.status_code == 200:
                print("Chauffeur login is case-insensitive")
            else:
                print("Chauffeur login is case-sensitive")


class TestChauffeurChantiers:
    """Tests for chauffeur-specific endpoints"""
    
    def test_get_chauffeur_chantiers(self):
        """Test getting chantiers for a specific chauffeur"""
        # First get a chauffeur
        chauffeurs_response = requests.get(f"{BASE_URL}/api/chauffeurs")
        chauffeurs = chauffeurs_response.json()
        
        if chauffeurs:
            chauffeur_id = chauffeurs[0]["id"]
            response = requests.get(f"{BASE_URL}/api/chauffeur/{chauffeur_id}/chantiers")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            print(f"Chauffeur {chauffeur_id} has {len(data)} chantier(s)")
        else:
            pytest.skip("No chauffeurs available for testing")


class TestRouteProtection:
    """Tests for route protection and redirects"""
    
    def test_protected_admin_endpoint_without_auth(self):
        """Test that protected admin endpoints require authentication"""
        endpoints = [
            "/api/admin/me",
            "/api/admin/list",
        ]
        
        for endpoint in endpoints:
            response = requests.get(f"{BASE_URL}{endpoint}")
            assert response.status_code == 401, f"Endpoint {endpoint} should require auth"
            print(f"Endpoint {endpoint} correctly protected")
    
    def test_protected_admin_create_without_auth(self):
        """Test that admin creation requires authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/create", json={
            "email": "test@test.com",
            "nom": "Test",
            "prenom": "User",
            "password": "testpass",
            "role": "admin"
        })
        assert response.status_code == 401
        print("Admin creation correctly requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
