"""Tests for the new Espace Client feature.

Coverage:
- POST /api/clients/{id}/generate-credentials (renvoie email/password, marque acces_actif=true)
- POST /api/clients/{id}/revoke-credentials (acces_actif=false -> login 401)
- POST /api/client/login (succès + case insensitive + 401 mauvais mdp + 401 email inconnu)
- GET /api/clients ne doit pas exposer password_hash
- POST /api/documents avec destinataire_type='client' + destinataire_ids
- POST /api/documents avec destinataire_type='chauffeur' + destinataire_ids
- POST /api/documents legacy chauffeur_ids (rétro-compat)
- GET /api/documents/client/{id} (liste filtrée, source_key/signed_key cachés)
- GET /api/documents/chauffeur/{id} (idem)
- POST /api/documents/{id}/sign client -> 401 DocuSign / 400 a_consulter
"""
import io
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"

CLIENT_ID = "512b68d0-2a7c-4e2c-a942-baca41baa7c1"  # test@client.com
CHAUFFEUR_ID = "de440edd-342d-424e-afb5-e90a85af416b"  # Jean Dupont

MIN_PDF = (
    b"%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
    b"2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n"
    b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\n"
    b"xref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000053 00000 n \n0000000099 00000 n \n"
    b"trailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%%EOF\n"
)


# -------------------- AUTH CLIENT --------------------
class TestClientCredentials:
    def test_generate_credentials_returns_password(self):
        r = requests.post(f"{API}/clients/{CLIENT_ID}/generate-credentials", timeout=30)
        assert r.status_code == 200, r.text
        js = r.json()
        assert js.get("email")
        assert isinstance(js.get("password"), str) and len(js["password"]) >= 8
        assert js.get("acces_actif") is True
        # store for later tests
        pytest.client_email = js["email"]
        pytest.client_password = js["password"]

    def test_get_clients_does_not_expose_password_hash(self):
        r = requests.get(f"{API}/clients", timeout=30)
        assert r.status_code == 200
        clients = r.json()
        target = next((c for c in clients if c["id"] == CLIENT_ID), None)
        assert target is not None
        assert "password_hash" not in target, "password_hash leaked"
        assert target.get("acces_actif") is True

    def test_regenerate_returns_new_password(self):
        old = pytest.client_password
        r = requests.post(f"{API}/clients/{CLIENT_ID}/generate-credentials", timeout=30)
        assert r.status_code == 200
        new_pwd = r.json()["password"]
        assert new_pwd != old
        pytest.client_password = new_pwd

    def test_generate_credentials_client_without_email_400(self):
        # Find a client without email
        clients = requests.get(f"{API}/clients", timeout=30).json()
        no_email = next((c for c in clients if not c.get("email")), None)
        if not no_email:
            pytest.skip("No client without email")
        r = requests.post(f"{API}/clients/{no_email['id']}/generate-credentials", timeout=30)
        assert r.status_code == 400

    def test_generate_credentials_unknown_client_404(self):
        r = requests.post(f"{API}/clients/unknown-id-xxx/generate-credentials", timeout=30)
        assert r.status_code == 404


class TestClientLogin:
    def test_login_success(self):
        r = requests.post(
            f"{API}/client/login",
            json={"email": pytest.client_email, "password": pytest.client_password},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        js = r.json()
        assert js.get("client_id") == CLIENT_ID
        assert js.get("email") == pytest.client_email
        assert isinstance(js.get("token"), str) and len(js["token"]) > 20
        assert js.get("client_nom")
        pytest.client_token = js["token"]

    def test_login_case_insensitive(self):
        r = requests.post(
            f"{API}/client/login",
            json={"email": pytest.client_email.upper(), "password": pytest.client_password},
            timeout=30,
        )
        assert r.status_code == 200, r.text

    def test_login_wrong_password(self):
        r = requests.post(
            f"{API}/client/login",
            json={"email": pytest.client_email, "password": "WRONG_PASSWORD_xyz"},
            timeout=30,
        )
        assert r.status_code == 401

    def test_login_unknown_email(self):
        r = requests.post(
            f"{API}/client/login",
            json={"email": "nobody-xyz@example.com", "password": "whatever"},
            timeout=30,
        )
        assert r.status_code == 401


# -------------------- DOCUMENTS upload to CLIENT / CHAUFFEUR --------------------
@pytest.fixture(scope="module")
def doc_client_a_signer():
    files = {"file": ("TEST_client_sign.pdf", io.BytesIO(MIN_PDF), "application/pdf")}
    data = {
        "titre": "TEST_Client_ToSign",
        "type_document": "contrat_travail",
        "categorie": "a_signer",
        "destinataire_type": "client",
        "destinataire_ids": CLIENT_ID,
    }
    r = requests.post(f"{API}/documents", data=data, files=files, timeout=60)
    assert r.status_code == 200, r.text
    js = r.json()
    assert js["created"] == 1
    doc = js["documents"][0]
    yield doc
    requests.delete(f"{API}/documents/{doc['id']}", timeout=30)


@pytest.fixture(scope="module")
def doc_client_a_consulter():
    files = {"file": ("TEST_client_consult.pdf", io.BytesIO(MIN_PDF), "application/pdf")}
    data = {
        "titre": "TEST_Client_Consult",
        "type_document": "autre",
        "categorie": "a_consulter",
        "destinataire_type": "client",
        "destinataire_ids": CLIENT_ID,
    }
    r = requests.post(f"{API}/documents", data=data, files=files, timeout=60)
    assert r.status_code == 200, r.text
    doc = r.json()["documents"][0]
    yield doc
    requests.delete(f"{API}/documents/{doc['id']}", timeout=30)


@pytest.fixture(scope="module")
def doc_chauffeur_new_api():
    files = {"file": ("TEST_chauf_new.pdf", io.BytesIO(MIN_PDF), "application/pdf")}
    data = {
        "titre": "TEST_Chauf_NewAPI",
        "type_document": "autre",
        "categorie": "a_consulter",
        "destinataire_type": "chauffeur",
        "destinataire_ids": CHAUFFEUR_ID,
    }
    r = requests.post(f"{API}/documents", data=data, files=files, timeout=60)
    assert r.status_code == 200, r.text
    doc = r.json()["documents"][0]
    yield doc
    requests.delete(f"{API}/documents/{doc['id']}", timeout=30)


@pytest.fixture(scope="module")
def doc_chauffeur_legacy():
    """Test rétro-compatibilité avec champ legacy chauffeur_ids."""
    files = {"file": ("TEST_legacy.pdf", io.BytesIO(MIN_PDF), "application/pdf")}
    data = {
        "titre": "TEST_Legacy_Chauf",
        "type_document": "autre",
        "categorie": "a_consulter",
        "chauffeur_ids": CHAUFFEUR_ID,  # legacy field
    }
    r = requests.post(f"{API}/documents", data=data, files=files, timeout=60)
    assert r.status_code == 200, r.text
    doc = r.json()["documents"][0]
    yield doc
    requests.delete(f"{API}/documents/{doc['id']}", timeout=30)


class TestUploadDocuments:
    def test_upload_to_client_sets_destinataire_fields(self, doc_client_a_signer):
        assert doc_client_a_signer["destinataire_type"] == "client"
        assert doc_client_a_signer["destinataire_id"] == CLIENT_ID
        assert doc_client_a_signer["destinataire_nom"]  # raison_sociale
        assert doc_client_a_signer["categorie"] == "a_signer"
        assert doc_client_a_signer["statut"] == "a_signer"

    def test_upload_to_chauffeur_new_api(self, doc_chauffeur_new_api):
        assert doc_chauffeur_new_api["destinataire_type"] == "chauffeur"
        assert doc_chauffeur_new_api["destinataire_id"] == CHAUFFEUR_ID

    def test_upload_legacy_chauffeur_ids_still_works(self, doc_chauffeur_legacy):
        assert doc_chauffeur_legacy["destinataire_type"] == "chauffeur"
        assert doc_chauffeur_legacy["destinataire_id"] == CHAUFFEUR_ID


class TestClientDocumentsList:
    def test_list_client_documents(self, doc_client_a_signer, doc_client_a_consulter):
        r = requests.get(f"{API}/documents/client/{CLIENT_ID}", timeout=30)
        assert r.status_code == 200
        docs = r.json()
        ids = {d["id"] for d in docs}
        assert doc_client_a_signer["id"] in ids
        assert doc_client_a_consulter["id"] in ids
        for d in docs:
            assert d.get("destinataire_type") == "client"
            assert d.get("destinataire_id") == CLIENT_ID
            assert "source_key" not in d
            assert "signed_key" not in d

    def test_list_chauffeur_documents_no_leak(self, doc_chauffeur_new_api):
        r = requests.get(f"{API}/documents/chauffeur/{CHAUFFEUR_ID}", timeout=30)
        assert r.status_code == 200
        docs = r.json()
        ids = {d["id"] for d in docs}
        assert doc_chauffeur_new_api["id"] in ids
        for d in docs:
            assert "source_key" not in d
            assert "signed_key" not in d


class TestClientSignGuards:
    def test_sign_client_a_consulter_returns_400(self, doc_client_a_consulter):
        r = requests.post(
            f"{API}/documents/{doc_client_a_consulter['id']}/sign",
            params={"return_url": "https://example.com/return"},
            timeout=30,
        )
        assert r.status_code == 400

    def test_sign_client_a_signer_returns_401_docusign(self, doc_client_a_signer):
        r = requests.post(
            f"{API}/documents/{doc_client_a_signer['id']}/sign",
            params={"return_url": "https://example.com/return"},
            timeout=30,
        )
        assert r.status_code == 401
        assert "docusign" in r.text.lower()


# -------------------- REVOKE last (will lock login) --------------------
class TestRevoke:
    def test_revoke_then_login_401(self):
        r = requests.post(f"{API}/clients/{CLIENT_ID}/revoke-credentials", timeout=30)
        assert r.status_code == 200
        assert r.json().get("acces_actif") is False

        # Login should fail now
        r2 = requests.post(
            f"{API}/client/login",
            json={"email": pytest.client_email, "password": pytest.client_password},
            timeout=30,
        )
        assert r2.status_code == 401

    def test_get_clients_shows_acces_actif_false(self):
        r = requests.get(f"{API}/clients", timeout=30)
        target = next((c for c in r.json() if c["id"] == CLIENT_ID), None)
        assert target is not None
        assert target.get("acces_actif") is False

    def test_regenerate_credentials_reactivates(self):
        """Restore client access for subsequent frontend tests."""
        r = requests.post(f"{API}/clients/{CLIENT_ID}/generate-credentials", timeout=30)
        assert r.status_code == 200
        assert r.json().get("acces_actif") is True
        # store final credentials for frontend test reuse via file
        with open("/tmp/client_creds.txt", "w") as f:
            f.write(f"{r.json()['email']}\n{r.json()['password']}\n")
