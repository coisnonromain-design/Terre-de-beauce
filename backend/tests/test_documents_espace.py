"""Tests for Espace Documentaire (chauffeur documents) endpoints.

Coverage:
- POST /api/documents (upload with single + multiple chauffeurs)
- GET /api/documents (admin list, ensures source_key/signed_key are hidden)
- GET /api/documents/chauffeur/{id}
- GET /api/documents/{id}/download (and ?signed=true 404 path)
- DELETE /api/documents/{id}
- POST /api/documents/{id}/sign (expected 401 because DocuSign not connected)
- POST /api/documents/{id}/sync (400 when no envelope)
"""
import io
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://gestion-flotte-tdb.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

CHAUFFEUR_ID_1 = "de440edd-342d-424e-afb5-e90a85af416b"  # Jean Dupont (43FC7D)

# Minimal valid PDF
MIN_PDF = (
    b"%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
    b"2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n"
    b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\n"
    b"xref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000053 00000 n \n0000000099 00000 n \n"
    b"trailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%%EOF\n"
)


@pytest.fixture(scope="module")
def chauffeurs():
    r = requests.get(f"{API}/chauffeurs", timeout=30)
    assert r.status_code == 200, f"GET /chauffeurs failed: {r.status_code} {r.text}"
    return r.json()


@pytest.fixture(scope="module")
def second_chauffeur_id(chauffeurs):
    # pick a chauffeur different from CHAUFFEUR_ID_1
    for c in chauffeurs:
        if c.get("id") and c["id"] != CHAUFFEUR_ID_1:
            return c["id"]
    pytest.skip("No second chauffeur available")


@pytest.fixture(scope="module")
def uploaded_single_doc():
    files = {"file": ("TEST_single.pdf", io.BytesIO(MIN_PDF), "application/pdf")}
    data = {
        "titre": "TEST_Single_Doc",
        "type_document": "contrat_travail",
        "categorie": "a_consulter",
        "chauffeur_ids": CHAUFFEUR_ID_1,
    }
    r = requests.post(f"{API}/documents", data=data, files=files, timeout=60)
    assert r.status_code == 200, f"Upload failed: {r.status_code} {r.text}"
    js = r.json()
    assert js["created"] == 1
    doc_id = js["documents"][0]["id"]
    yield js["documents"][0]
    # cleanup
    requests.delete(f"{API}/documents/{doc_id}", timeout=30)


@pytest.fixture(scope="module")
def uploaded_multi_doc(second_chauffeur_id):
    files = {"file": ("TEST_multi.pdf", io.BytesIO(MIN_PDF), "application/pdf")}
    data = {
        "titre": "TEST_Multi_Doc",
        "type_document": "fiche_paie",
        "categorie": "a_signer",
        "chauffeur_ids": f"{CHAUFFEUR_ID_1},{second_chauffeur_id}",
    }
    r = requests.post(f"{API}/documents", data=data, files=files, timeout=60)
    assert r.status_code == 200, f"Upload multi failed: {r.status_code} {r.text}"
    js = r.json()
    assert js["created"] == 2
    yield js["documents"]
    for d in js["documents"]:
        requests.delete(f"{API}/documents/{d['id']}", timeout=30)


# ----- POST /api/documents -----
class TestUpload:
    def test_upload_single_chauffeur(self, uploaded_single_doc):
        assert uploaded_single_doc["chauffeur_id"] == CHAUFFEUR_ID_1
        assert uploaded_single_doc["categorie"] == "a_consulter"
        assert uploaded_single_doc["statut"] == "disponible"
        assert uploaded_single_doc["titre"] == "TEST_Single_Doc"

    def test_upload_multi_chauffeur(self, uploaded_multi_doc):
        assert len(uploaded_multi_doc) == 2
        ids = {d["chauffeur_id"] for d in uploaded_multi_doc}
        assert CHAUFFEUR_ID_1 in ids
        for d in uploaded_multi_doc:
            assert d["categorie"] == "a_signer"
            assert d["statut"] == "a_signer"

    def test_upload_invalid_categorie(self):
        files = {"file": ("x.pdf", io.BytesIO(MIN_PDF), "application/pdf")}
        data = {
            "titre": "TEST_bad",
            "type_document": "autre",
            "categorie": "invalid_cat",
            "chauffeur_ids": CHAUFFEUR_ID_1,
        }
        r = requests.post(f"{API}/documents", data=data, files=files, timeout=30)
        assert r.status_code == 400

    def test_upload_no_chauffeur(self):
        files = {"file": ("x.pdf", io.BytesIO(MIN_PDF), "application/pdf")}
        data = {
            "titre": "TEST_nochauf",
            "type_document": "autre",
            "categorie": "a_consulter",
            "chauffeur_ids": "",
        }
        r = requests.post(f"{API}/documents", data=data, files=files, timeout=30)
        # FastAPI 422 if empty Form(...) string considered missing, else 400
        assert r.status_code in (400, 422)


# ----- GET /api/documents -----
class TestList:
    def test_admin_list_hides_storage_keys(self, uploaded_single_doc):
        r = requests.get(f"{API}/documents", timeout=30)
        assert r.status_code == 200
        docs = r.json()
        assert isinstance(docs, list) and len(docs) > 0
        found = next((d for d in docs if d["id"] == uploaded_single_doc["id"]), None)
        assert found is not None, "Uploaded doc not in admin list"
        # source_key and signed_key must NOT be exposed
        for d in docs:
            assert "source_key" not in d, f"source_key leaked in doc {d.get('id')}"
            assert "signed_key" not in d, f"signed_key leaked in doc {d.get('id')}"

    def test_filter_by_categorie(self, uploaded_single_doc):
        r = requests.get(f"{API}/documents?categorie=a_consulter", timeout=30)
        assert r.status_code == 200
        docs = r.json()
        for d in docs:
            assert d["categorie"] == "a_consulter"

    def test_filter_by_chauffeur(self, uploaded_single_doc):
        r = requests.get(f"{API}/documents?chauffeur_id={CHAUFFEUR_ID_1}", timeout=30)
        assert r.status_code == 200
        for d in r.json():
            assert d["chauffeur_id"] == CHAUFFEUR_ID_1

    def test_chauffeur_list(self, uploaded_single_doc):
        r = requests.get(f"{API}/documents/chauffeur/{CHAUFFEUR_ID_1}", timeout=30)
        assert r.status_code == 200
        docs = r.json()
        assert any(d["id"] == uploaded_single_doc["id"] for d in docs)
        for d in docs:
            assert d["chauffeur_id"] == CHAUFFEUR_ID_1
            assert "source_key" not in d
            assert "signed_key" not in d


# ----- GET /api/documents/{id}/download -----
class TestDownload:
    def test_download_original_pdf(self, uploaded_single_doc):
        r = requests.get(f"{API}/documents/{uploaded_single_doc['id']}/download", timeout=60)
        assert r.status_code == 200
        assert "application/pdf" in r.headers.get("content-type", "").lower()
        assert r.content[:4] == b"%PDF", f"Content does not start with %PDF: {r.content[:10]}"

    def test_download_signed_not_available(self, uploaded_single_doc):
        r = requests.get(
            f"{API}/documents/{uploaded_single_doc['id']}/download?signed=true",
            timeout=30,
        )
        assert r.status_code == 404

    def test_download_unknown_doc(self):
        r = requests.get(f"{API}/documents/nonexistent-id/download", timeout=30)
        assert r.status_code == 404


# ----- POST /api/documents/{id}/sign (expected 401 in preview) -----
class TestSignGuards:
    def test_sign_a_consulter_returns_400(self, uploaded_single_doc):
        r = requests.post(
            f"{API}/documents/{uploaded_single_doc['id']}/sign",
            params={"return_url": "https://example.com/return"},
            timeout=30,
        )
        assert r.status_code == 400
        assert "signature" in r.text.lower() or "nécessite" in r.text.lower()

    def test_sign_a_signer_returns_401_docusign_not_auth(self, uploaded_multi_doc):
        # Use first a_signer doc
        doc = uploaded_multi_doc[0]
        r = requests.post(
            f"{API}/documents/{doc['id']}/sign",
            params={"return_url": "https://example.com/return"},
            timeout=30,
        )
        # Expected: 401 DocuSign non authentifié
        assert r.status_code == 401, f"Expected 401, got {r.status_code}: {r.text}"
        assert "docusign" in r.text.lower()


# ----- POST /api/documents/{id}/sync -----
class TestSync:
    def test_sync_no_envelope(self, uploaded_single_doc):
        r = requests.post(f"{API}/documents/{uploaded_single_doc['id']}/sync", timeout=30)
        assert r.status_code == 400
        assert "enveloppe" in r.text.lower()


# ----- DELETE /api/documents/{id} -----
class TestDelete:
    def test_delete_and_verify_404(self):
        # create then delete
        files = {"file": ("TEST_del.pdf", io.BytesIO(MIN_PDF), "application/pdf")}
        data = {
            "titre": "TEST_to_delete",
            "type_document": "autre",
            "categorie": "a_consulter",
            "chauffeur_ids": CHAUFFEUR_ID_1,
        }
        r = requests.post(f"{API}/documents", data=data, files=files, timeout=60)
        assert r.status_code == 200
        doc_id = r.json()["documents"][0]["id"]

        rd = requests.delete(f"{API}/documents/{doc_id}", timeout=30)
        assert rd.status_code == 200

        # verify GET download returns 404
        rg = requests.get(f"{API}/documents/{doc_id}/download", timeout=30)
        assert rg.status_code == 404

        # second delete -> 404
        rd2 = requests.delete(f"{API}/documents/{doc_id}", timeout=30)
        assert rd2.status_code == 404


# ----- REGRESSION: numerotation chantiers -----
class TestChantierNumerotation:
    def test_new_chantier_reference_format_2026(self):
        # Create minimal chantier - needs client, so first find one
        clients = requests.get(f"{API}/clients", timeout=30).json()
        if not clients:
            pytest.skip("No client to create chantier")
        client_id = clients[0]["id"]
        payload = {
            "reference": "TEMP",  # overridden by server with generate_numero_chantier
            "client_id": client_id,
            "lieu": "Test Site",
            "adresse_depart": "Test A",
            "adresse_arrivee": "Test B",
            "date_debut": "2026-01-15",
            "type_marchandise": "betterave",
            "tonnage_total": 100,
            "prix_unitaire": 10,
        }
        r = requests.post(f"{API}/chantiers", json=payload, timeout=30)
        if r.status_code != 200:
            pytest.skip(f"Could not create chantier: {r.status_code} {r.text}")
        chantier = r.json()
        ref = chantier.get("reference", "")
        try:
            assert ref.startswith("CH-"), f"Reference doesn't start with CH-: {ref}"
            parts = ref.split("-")
            assert len(parts) == 3, f"Bad format: {ref}"
            assert parts[1].isdigit() and len(parts[1]) == 4, f"Bad sequence: {ref}"
            assert parts[2] == "2026", f"Bad year: {ref}"
        finally:
            requests.delete(f"{API}/chantiers/{chantier['id']}", timeout=30)
