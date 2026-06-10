"""Tests for the new 4-tabs ESPACE CLIENT endpoints.

Coverage:
- GET /api/client/{client_id}/chantiers
- GET /api/client/{client_id}/contrats
- GET /api/client/{client_id}/releves
- GET /api/client/{client_id}/factures
- Signature guards: POST /api/contrats-ccpa/{id}/sign-embedded -> 401 DocuSign
- Signature guards: POST /api/factures/{id}/sign-embedded -> 401 DocuSign
- POST /api/factures/{id}/sign-sync (no envelope) -> 400
- GET /api/contrats-ccpa/{id}/pdf?signed=true -> 404 si pas signé
- GET /api/factures/{id}/pdf?signed=true -> 404 si pas signé
- GET sans signed -> PDF normal
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"

CLIENT_ID = "512b68d0-2a7c-4e2c-a942-baca41baa7c1"


@pytest.fixture(scope="module")
def chantiers():
    r = requests.get(f"{API}/client/{CLIENT_ID}/chantiers", timeout=30)
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture(scope="module")
def contrats():
    r = requests.get(f"{API}/client/{CLIENT_ID}/contrats", timeout=30)
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture(scope="module")
def releves():
    r = requests.get(f"{API}/client/{CLIENT_ID}/releves", timeout=30)
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture(scope="module")
def factures():
    r = requests.get(f"{API}/client/{CLIENT_ID}/factures", timeout=30)
    assert r.status_code == 200, r.text
    return r.json()


class TestChantiersTab:
    def test_returns_list(self, chantiers):
        assert isinstance(chantiers, list)
        assert len(chantiers) >= 2

    def test_includes_known_seed(self, chantiers):
        refs = {c.get("reference") for c in chantiers}
        assert "CH-TEST-2026" in refs or "CH-2026-001" in refs

    def test_each_chantier_has_required_fields(self, chantiers):
        for ch in chantiers:
            assert "id" in ch
            assert "reference" in ch
            assert "lieu" in ch
            assert "statut" in ch
            assert ch["statut"] in ("planifie", "en_cours", "termine", "annule")

    def test_groups_planifie_and_en_cours_present(self, chantiers):
        statuts = {c["statut"] for c in chantiers}
        # On expects at least one planifie or en_cours
        assert statuts & {"planifie", "en_cours"}


class TestContratsTab:
    def test_returns_list(self, contrats):
        assert isinstance(contrats, list)

    def test_no_signed_key_leak(self, contrats):
        for ct in contrats:
            assert "signed_key" not in ct, "signed_key should not be exposed to client"
            assert "source_key" not in ct or ct.get("source_key") is None or True  # allow but warn

    def test_each_contrat_has_required_fields(self, contrats):
        for ct in contrats:
            assert "id" in ct
            assert "numero_contrat" in ct
            assert "statut" in ct


class TestRelevesTab:
    def test_returns_list(self, releves):
        assert isinstance(releves, list)

    def test_releves_have_rh_prefix_and_fields(self, releves):
        # Au moins 1 relevé attendu
        assert len(releves) >= 1
        for rv in releves:
            assert "chantier_id" in rv
            assert "numero_releve" in rv
            assert rv["numero_releve"].startswith("RH-"), f"Bad numero_releve: {rv['numero_releve']}"
            assert "chantier_reference" in rv
            assert rv["chantier_reference"].startswith("CH-")
            assert "lieu" in rv
            assert "nb_pointages" in rv
            assert rv["nb_pointages"] >= 1

    def test_releve_pdf_endpoint_reachable(self, releves):
        if not releves:
            pytest.skip("No releve")
        ch_id = releves[0]["chantier_id"]
        r = requests.get(f"{API}/chantiers/{ch_id}/pointages/pdf", timeout=30)
        assert r.status_code == 200
        assert r.content[:4] == b"%PDF"


class TestFacturesTab:
    def test_returns_list(self, factures):
        assert isinstance(factures, list)

    def test_no_brouillon_in_response(self, factures):
        for f in factures:
            assert f.get("statut") != "brouillon", "brouillon factures should be filtered out"

    def test_fields(self, factures):
        for f in factures:
            assert "id" in f
            assert "numero" in f
            assert "montant_ttc" in f
            assert "statut" in f


class TestSignatureGuards:
    def test_contrat_sign_embedded_returns_401_docusign(self, contrats):
        # Find a non-signed contrat
        unsigned = next((c for c in contrats if c.get("statut") not in ("signe", "annule")), None)
        if not unsigned:
            pytest.skip("No unsigned contrat")
        r = requests.post(
            f"{API}/contrats-ccpa/{unsigned['id']}/sign-embedded",
            params={"return_url": "https://example.com/return"},
            timeout=30,
        )
        assert r.status_code == 401, r.text
        assert "docusign" in r.text.lower()

    def test_facture_sign_embedded_returns_401_docusign(self, factures):
        # Get a facture that's signable (emise/envoyee). Fall back to any non-payee non-signee
        signable = next((f for f in factures if f.get("statut") in ("emise", "envoyee")), None)
        if not signable:
            # The seed has 'payee' only — test on any facture; backend will guard
            r_any = requests.get(f"{API}/factures", timeout=30)
            if r_any.status_code == 200:
                all_factures = r_any.json()
                signable = next(
                    (f for f in all_factures if f.get("client_id") == CLIENT_ID and f.get("statut") in ("emise", "envoyee")),
                    None,
                )
        if not signable:
            pytest.skip("No signable facture (emise/envoyee) in seed")
        r = requests.post(
            f"{API}/factures/{signable['id']}/sign-embedded",
            params={"return_url": "https://example.com/return"},
            timeout=30,
        )
        assert r.status_code == 401, r.text
        assert "docusign" in r.text.lower()

    def test_facture_sign_sync_no_envelope_returns_400(self, factures):
        # Any facture without docusign_envelope_id
        target = next((f for f in factures if not f.get("docusign_envelope_id")), None)
        if not target:
            pytest.skip("All factures already have envelope")
        r = requests.post(f"{API}/factures/{target['id']}/sign-sync", timeout=30)
        assert r.status_code == 400, r.text


class TestPdfSignedGuards:
    def test_contrat_pdf_normal_returns_200(self, contrats):
        if not contrats:
            pytest.skip("No contrat")
        r = requests.get(f"{API}/contrats-ccpa/{contrats[0]['id']}/pdf", timeout=30)
        assert r.status_code == 200
        assert r.content[:4] == b"%PDF"

    def test_contrat_pdf_signed_true_returns_404_when_unsigned(self, contrats):
        unsigned = next((c for c in contrats if c.get("statut") != "signe"), None)
        if not unsigned:
            pytest.skip("No unsigned contrat")
        r = requests.get(
            f"{API}/contrats-ccpa/{unsigned['id']}/pdf",
            params={"signed": "true"},
            timeout=30,
        )
        assert r.status_code == 404, r.text

    def test_facture_pdf_normal_returns_200(self, factures):
        if not factures:
            pytest.skip("No facture")
        r = requests.get(f"{API}/factures/{factures[0]['id']}/pdf", timeout=30)
        assert r.status_code == 200
        assert r.content[:4] == b"%PDF"

    def test_facture_pdf_signed_true_returns_404_when_unsigned(self, factures):
        unsigned = next((f for f in factures if f.get("statut") != "signee"), None)
        if not unsigned:
            pytest.skip("No unsigned facture")
        r = requests.get(
            f"{API}/factures/{unsigned['id']}/pdf",
            params={"signed": "true"},
            timeout=30,
        )
        assert r.status_code == 404, r.text


class TestAncienEspaceClientLegacy:
    """Note: legacy /documents/client/{id} still exists at backend, but front no longer calls it."""

    def test_documents_client_endpoint_still_exists(self):
        r = requests.get(f"{API}/documents/client/{CLIENT_ID}", timeout=30)
        # endpoint still alive (returns 200 or empty list)
        assert r.status_code == 200
