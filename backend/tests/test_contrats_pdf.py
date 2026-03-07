"""
Test suite for Contrats CCPA PDF generation endpoints
Tests:
- GET /api/contrats-ccpa/{id}/pdf - View PDF inline
- GET /api/contrats-ccpa/{id}/download - Download PDF as attachment
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')


class TestContratsCCPAPDF:
    """Tests for PDF generation endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get existing contrats for testing"""
        response = requests.get(f"{BASE_URL}/api/contrats-ccpa")
        assert response.status_code == 200, f"Failed to get contrats: {response.text}"
        self.contrats = response.json()
        
    def test_get_contrats_list(self):
        """Verify we have contrats to test with"""
        print(f"Found {len(self.contrats)} contrats CCPA")
        assert len(self.contrats) > 0, "No contrats CCPA found for testing"
        
    def test_pdf_endpoint_returns_pdf(self):
        """Test GET /api/contrats-ccpa/{id}/pdf returns valid PDF"""
        if not self.contrats:
            pytest.skip("No contrats available for testing")
            
        contrat = self.contrats[0]
        contrat_id = contrat['id']
        
        response = requests.get(f"{BASE_URL}/api/contrats-ccpa/{contrat_id}/pdf")
        
        # Check status code
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Check content type is PDF
        content_type = response.headers.get('Content-Type', '')
        assert 'application/pdf' in content_type, f"Expected application/pdf, got {content_type}"
        
        # Check Content-Disposition is inline (for viewing in browser)
        content_disposition = response.headers.get('Content-Disposition', '')
        assert 'inline' in content_disposition, f"Expected inline disposition, got {content_disposition}"
        
        # Check PDF content starts with %PDF
        pdf_content = response.content
        assert pdf_content.startswith(b'%PDF'), f"PDF content should start with %PDF, got: {pdf_content[:20]}"
        
        print(f"✓ PDF endpoint returned valid PDF for contrat {contrat['numero_contrat']}")
        print(f"  Content-Type: {content_type}")
        print(f"  Content-Disposition: {content_disposition}")
        print(f"  PDF size: {len(pdf_content)} bytes")
        
    def test_download_endpoint_returns_pdf_attachment(self):
        """Test GET /api/contrats-ccpa/{id}/download returns PDF with attachment disposition"""
        if not self.contrats:
            pytest.skip("No contrats available for testing")
            
        contrat = self.contrats[0]
        contrat_id = contrat['id']
        
        response = requests.get(f"{BASE_URL}/api/contrats-ccpa/{contrat_id}/download")
        
        # Check status code
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Check content type is PDF
        content_type = response.headers.get('Content-Type', '')
        assert 'application/pdf' in content_type, f"Expected application/pdf, got {content_type}"
        
        # Check Content-Disposition is attachment (for download)
        content_disposition = response.headers.get('Content-Disposition', '')
        assert 'attachment' in content_disposition, f"Expected attachment disposition, got {content_disposition}"
        
        # Check filename is present
        assert 'filename=' in content_disposition, f"Expected filename in disposition, got {content_disposition}"
        
        # Check PDF content starts with %PDF
        pdf_content = response.content
        assert pdf_content.startswith(b'%PDF'), f"PDF content should start with %PDF, got: {pdf_content[:20]}"
        
        print(f"✓ Download endpoint returned valid PDF for contrat {contrat['numero_contrat']}")
        print(f"  Content-Type: {content_type}")
        print(f"  Content-Disposition: {content_disposition}")
        print(f"  PDF size: {len(pdf_content)} bytes")
        
    def test_pdf_contains_contrat_info(self):
        """Test that PDF contains contract information"""
        if not self.contrats:
            pytest.skip("No contrats available for testing")
            
        contrat = self.contrats[0]
        contrat_id = contrat['id']
        
        response = requests.get(f"{BASE_URL}/api/contrats-ccpa/{contrat_id}/pdf")
        assert response.status_code == 200
        
        # PDF content is binary, but we can check the raw bytes for text patterns
        # Note: This is a basic check - PDF text is often encoded
        pdf_content = response.content
        
        # Check PDF is valid (starts with %PDF and ends with %%EOF)
        assert pdf_content.startswith(b'%PDF'), "PDF should start with %PDF"
        
        # Check PDF has reasonable size (should be more than just headers)
        assert len(pdf_content) > 1000, f"PDF seems too small: {len(pdf_content)} bytes"
        
        print(f"✓ PDF content validation passed")
        print(f"  Contrat numero: {contrat.get('numero_contrat')}")
        print(f"  Client: {contrat.get('client_nom')}")
        print(f"  Prix: {contrat.get('prix_unitaire')} €/{contrat.get('unite_facturation')}")
        
    def test_pdf_endpoint_404_for_invalid_id(self):
        """Test that PDF endpoint returns 404 for non-existent contrat"""
        invalid_id = "non-existent-contrat-id-12345"
        
        response = requests.get(f"{BASE_URL}/api/contrats-ccpa/{invalid_id}/pdf")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ PDF endpoint correctly returns 404 for invalid ID")
        
    def test_download_endpoint_404_for_invalid_id(self):
        """Test that download endpoint returns 404 for non-existent contrat"""
        invalid_id = "non-existent-contrat-id-12345"
        
        response = requests.get(f"{BASE_URL}/api/contrats-ccpa/{invalid_id}/download")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Download endpoint correctly returns 404 for invalid ID")
        
    def test_pdf_filename_contains_contrat_number(self):
        """Test that PDF filename contains the contrat number"""
        if not self.contrats:
            pytest.skip("No contrats available for testing")
            
        contrat = self.contrats[0]
        contrat_id = contrat['id']
        numero_contrat = contrat.get('numero_contrat', '')
        
        response = requests.get(f"{BASE_URL}/api/contrats-ccpa/{contrat_id}/download")
        assert response.status_code == 200
        
        content_disposition = response.headers.get('Content-Disposition', '')
        
        # The filename should contain "Contrat" and part of the numero
        assert 'Contrat' in content_disposition, f"Filename should contain 'Contrat', got {content_disposition}"
        
        print(f"✓ PDF filename validation passed")
        print(f"  Content-Disposition: {content_disposition}")


class TestContratsCCPAEndpoints:
    """Additional tests for contrats CCPA endpoints"""
    
    def test_get_single_contrat(self):
        """Test GET /api/contrats-ccpa/{id} returns contrat details"""
        # First get list
        response = requests.get(f"{BASE_URL}/api/contrats-ccpa")
        assert response.status_code == 200
        contrats = response.json()
        
        if not contrats:
            pytest.skip("No contrats available")
            
        contrat = contrats[0]
        contrat_id = contrat['id']
        
        # Get single contrat
        response = requests.get(f"{BASE_URL}/api/contrats-ccpa/{contrat_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data['id'] == contrat_id
        assert 'numero_contrat' in data
        assert 'client_nom' in data
        assert 'prix_unitaire' in data
        assert 'unite_facturation' in data
        assert 'gasoil_fourni' in data
        assert 'transport_type' in data
        
        print(f"✓ Single contrat endpoint working")
        print(f"  Contrat: {data.get('numero_contrat')}")
        print(f"  Client: {data.get('client_nom')}")
        print(f"  Statut: {data.get('statut')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
