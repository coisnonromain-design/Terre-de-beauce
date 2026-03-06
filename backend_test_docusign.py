#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class DocuSignAPITester:
    def __init__(self, base_url="https://fleet-dispatch-sys.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []

    def log_result(self, test_name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            print(f"❌ {test_name} - FAILED: {details}")
        
        self.results.append({
            "test": test_name,
            "success": success,
            "details": details
        })

    def test_docusign_status(self):
        """Test DocuSign status endpoint"""
        try:
            response = requests.get(f"{self.base_url}/docusign/status", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if configured is true (API keys are set)
                if data.get("configured") == True:
                    self.log_result("DocuSign Status - Configured", True, f"Status: {data}")
                else:
                    self.log_result("DocuSign Status - Configured", False, f"Expected configured=true, got: {data}")
                
                # Check authenticated status (should be false initially)
                if data.get("authenticated") == False:
                    self.log_result("DocuSign Status - Not Authenticated Initially", True, "Correctly shows not authenticated")
                else:
                    self.log_result("DocuSign Status - Not Authenticated Initially", False, f"Expected authenticated=false, got: {data.get('authenticated')}")
                
                return True
            else:
                self.log_result("DocuSign Status Endpoint", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("DocuSign Status Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_docusign_auth_url(self):
        """Test DocuSign auth URL generation"""
        try:
            redirect_uri = "https://fleet-dispatch-sys.preview.emergentagent.com/docusign-callback"
            response = requests.get(
                f"{self.base_url}/docusign/auth-url",
                params={"redirect_uri": redirect_uri},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                auth_url = data.get("auth_url")
                
                if auth_url and "oauth/auth" in auth_url and "client_id=" in auth_url:
                    self.log_result("DocuSign Auth URL Generation", True, f"Generated valid auth URL")
                else:
                    self.log_result("DocuSign Auth URL Generation", False, f"Invalid auth URL: {auth_url}")
                
                return True
            else:
                self.log_result("DocuSign Auth URL Endpoint", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("DocuSign Auth URL Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_basic_endpoints_still_work(self):
        """Test that basic ERP endpoints still work after DocuSign integration"""
        endpoints_to_test = [
            ("/", "Root endpoint"),
            ("/dashboard/stats", "Dashboard stats"),
            ("/tracteurs", "Tracteurs list"),
            ("/equipements", "Equipements list"),
            ("/chauffeurs", "Chauffeurs list"),
            ("/clients", "Clients list"),
            ("/chantiers", "Chantiers list"),
            ("/factures", "Factures list"),
            ("/config/entreprise", "Enterprise config")
        ]
        
        for endpoint, description in endpoints_to_test:
            try:
                response = requests.get(f"{self.base_url}{endpoint}", timeout=10)
                
                if response.status_code == 200:
                    self.log_result(f"Basic Endpoint - {description}", True)
                else:
                    self.log_result(f"Basic Endpoint - {description}", False, f"HTTP {response.status_code}")
                    
            except Exception as e:
                self.log_result(f"Basic Endpoint - {description}", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all DocuSign integration tests"""
        print("🔍 Starting DocuSign Integration Tests...")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test DocuSign specific endpoints
        self.test_docusign_status()
        self.test_docusign_auth_url()
        
        # Test that existing functionality still works
        self.test_basic_endpoints_still_work()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed!")
            return 1

def main():
    tester = DocuSignAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())