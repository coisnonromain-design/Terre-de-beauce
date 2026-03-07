"""
Test suite for Factures PDF generation endpoints
Tests:
- GET /api/factures/{id}/pdf - View PDF inline
- GET /api/factures/{id}/download - Download PDF as attachment
- PDF content validation
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test facture ID created by main agent
TEST_FACTURE_ID = "8223eaa7-00c9-46b0-8363-4dee0f1d3c37"
TEST_FACTURE_NUMERO = "FAC-2026-03-TEST01"


class TestFacturesPDFEndpoints:
    """Test Factures PDF generation endpoints"""
    
    def test_get_factures_list(self):
        """Test GET /api/factures returns list of factures"""
        response = requests.get(f"{BASE_URL}/api/factures")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Found {len(data)} factures")
        
        # Verify test facture exists
        test_facture = next((f for f in data if f['id'] == TEST_FACTURE_ID), None)
        assert test_facture is not None, f"Test facture {TEST_FACTURE_ID} not found"
        print(f"✓ Test facture found: {test_facture['numero']}")
    
    def test_get_facture_pdf_returns_valid_pdf(self):
        """Test GET /api/factures/{id}/pdf returns valid PDF"""
        response = requests.get(f"{BASE_URL}/api/factures/{TEST_FACTURE_ID}/pdf")
        
        # Status code assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ Status code: {response.status_code}")
        
        # Content-Type assertion
        content_type = response.headers.get('Content-Type', '')
        assert 'application/pdf' in content_type, f"Expected application/pdf, got {content_type}"
        print(f"✓ Content-Type: {content_type}")
        
        # PDF magic bytes assertion
        assert response.content[:4] == b'%PDF', "Response does not start with PDF magic bytes"
        print(f"✓ PDF magic bytes verified")
    
    def test_get_facture_pdf_content_disposition_inline(self):
        """Test GET /api/factures/{id}/pdf returns Content-Disposition: inline"""
        response = requests.get(f"{BASE_URL}/api/factures/{TEST_FACTURE_ID}/pdf")
        
        assert response.status_code == 200
        
        content_disposition = response.headers.get('Content-Disposition', '')
        assert 'inline' in content_disposition, f"Expected 'inline' in Content-Disposition, got {content_disposition}"
        print(f"✓ Content-Disposition: {content_disposition}")
        
        # Verify filename is included
        assert 'filename=' in content_disposition, "Filename not found in Content-Disposition"
        assert TEST_FACTURE_NUMERO.replace('/', '-') in content_disposition or 'Facture_' in content_disposition
        print(f"✓ Filename included in Content-Disposition")
    
    def test_get_facture_download_returns_valid_pdf(self):
        """Test GET /api/factures/{id}/download returns valid PDF"""
        response = requests.get(f"{BASE_URL}/api/factures/{TEST_FACTURE_ID}/download")
        
        # Status code assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ Status code: {response.status_code}")
        
        # Content-Type assertion
        content_type = response.headers.get('Content-Type', '')
        assert 'application/pdf' in content_type, f"Expected application/pdf, got {content_type}"
        print(f"✓ Content-Type: {content_type}")
        
        # PDF magic bytes assertion
        assert response.content[:4] == b'%PDF', "Response does not start with PDF magic bytes"
        print(f"✓ PDF magic bytes verified")
    
    def test_get_facture_download_content_disposition_attachment(self):
        """Test GET /api/factures/{id}/download returns Content-Disposition: attachment"""
        response = requests.get(f"{BASE_URL}/api/factures/{TEST_FACTURE_ID}/download")
        
        assert response.status_code == 200
        
        content_disposition = response.headers.get('Content-Disposition', '')
        assert 'attachment' in content_disposition, f"Expected 'attachment' in Content-Disposition, got {content_disposition}"
        print(f"✓ Content-Disposition: {content_disposition}")
        
        # Verify filename is included
        assert 'filename=' in content_disposition, "Filename not found in Content-Disposition"
        print(f"✓ Filename included in Content-Disposition")
    
    def test_get_facture_pdf_404_for_nonexistent(self):
        """Test GET /api/factures/{id}/pdf returns 404 for non-existent facture"""
        response = requests.get(f"{BASE_URL}/api/factures/nonexistent-id-12345/pdf")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Returns 404 for non-existent facture")
    
    def test_get_facture_download_404_for_nonexistent(self):
        """Test GET /api/factures/{id}/download returns 404 for non-existent facture"""
        response = requests.get(f"{BASE_URL}/api/factures/nonexistent-id-12345/download")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Returns 404 for non-existent facture")


class TestFacturePDFContent:
    """Test PDF content contains required information"""
    
    def test_pdf_contains_facture_numero(self):
        """Test PDF contains facture number"""
        response = requests.get(f"{BASE_URL}/api/factures/{TEST_FACTURE_ID}/pdf")
        assert response.status_code == 200
        
        # PDF content should contain the facture number
        # Note: PDF is binary, but text content is often readable
        pdf_content = response.content.decode('latin-1', errors='ignore')
        assert 'FAC-2026-03-TEST01' in pdf_content or 'FACTURE' in pdf_content.upper()
        print(f"✓ PDF contains facture reference")
    
    def test_pdf_size_reasonable(self):
        """Test PDF size is reasonable (not empty, not too large)"""
        response = requests.get(f"{BASE_URL}/api/factures/{TEST_FACTURE_ID}/pdf")
        assert response.status_code == 200
        
        pdf_size = len(response.content)
        assert pdf_size > 1000, f"PDF too small: {pdf_size} bytes"
        assert pdf_size < 1000000, f"PDF too large: {pdf_size} bytes"
        print(f"✓ PDF size: {pdf_size} bytes")


class TestFactureDetails:
    """Test facture details endpoint"""
    
    def test_get_facture_details(self):
        """Test GET /api/factures/{id} returns facture details"""
        response = requests.get(f"{BASE_URL}/api/factures/{TEST_FACTURE_ID}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify required fields
        assert 'id' in data
        assert 'numero' in data
        assert 'lignes' in data
        assert 'montant_ht' in data
        assert 'montant_tva' in data
        assert 'montant_ttc' in data
        assert 'client_raison_sociale' in data
        
        print(f"✓ Facture details: {data['numero']}")
        print(f"  - Client: {data['client_raison_sociale']}")
        print(f"  - Montant TTC: {data['montant_ttc']}€")
        print(f"  - Lignes: {len(data['lignes'])}")
        
        # Verify lignes structure
        for ligne in data['lignes']:
            assert 'description' in ligne
            assert 'quantite' in ligne
            assert 'prix_unitaire' in ligne
            assert 'montant_ht' in ligne
            print(f"    - {ligne['description']}: {ligne['quantite']} x {ligne['prix_unitaire']}€ = {ligne['montant_ht']}€")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
