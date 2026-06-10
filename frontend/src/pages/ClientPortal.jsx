import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Building2,
  LogOut,
  FolderArchive,
  FileSignature,
  FileCheck2,
  Download,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ClientPortal() {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signingDocId, setSigningDocId] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("client_session");
    if (!saved) {
      navigate("/client/login");
      return;
    }
    const session = JSON.parse(saved);
    setClient(session);
    fetchDocs(session.client_id);
    setLoading(false);

    const params = new URLSearchParams(window.location.search);
    if (params.get("docusign_return") === "1" && params.get("documentId")) {
      const docId = params.get("documentId");
      const event = params.get("event");
      window.history.replaceState({}, "", "/client/portal");
      handleDocusignReturn(docId, event, session.client_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const fetchDocs = async (clientId) => {
    try {
      const res = await axios.get(`${API}/documents/client/${clientId}`);
      setDocuments(res.data);
    } catch (error) {
      console.error("Erreur chargement documents:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("client_session");
    toast.success("Déconnexion réussie");
    navigate("/");
  };

  const handleSign = async (documentId) => {
    setSigningDocId(documentId);
    try {
      const returnUrl = `${window.location.origin}/client/portal?docusign_return=1&documentId=${documentId}`;
      const res = await axios.post(
        `${API}/documents/${documentId}/sign?return_url=${encodeURIComponent(returnUrl)}`
      );
      if (res.data.signing_url) {
        window.location.href = res.data.signing_url;
      } else {
        toast.error("Impossible d'ouvrir la signature");
        setSigningDocId(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'ouverture de la signature");
      setSigningDocId(null);
    }
  };

  const handleDocusignReturn = async (documentId, event, clientId) => {
    try {
      const res = await axios.post(`${API}/documents/${documentId}/sync`);
      if (res.data.signe) {
        toast.success("Document signé avec succès !");
      } else if (event === "signing_complete") {
        toast.info("Signature en cours de traitement, veuillez patienter...");
      } else {
        toast.info("Signature non finalisée");
      }
    } catch (e) {
      console.error("Erreur sync DocuSign:", e);
    } finally {
      fetchDocs(clientId);
    }
  };

  const downloadDoc = (doc, signed) => {
    window.open(`${API}/documents/${doc.id}/download${signed ? "?signed=true" : ""}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A4D2E]"></div>
      </div>
    );
  }

  const enAttente = documents.filter((d) => d.categorie === "a_signer" && d.statut !== "signe");
  const disponibles = documents.filter((d) => d.statut === "signe" || d.categorie === "a_consulter");

  return (
    <div className="min-h-screen bg-slate-100" data-testid="client-portal">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#1A4D2E] text-white px-4 py-3 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D9A520] flex items-center justify-center">
              <Building2 className="w-6 h-6 text-[#1A4D2E]" />
            </div>
            <div>
              <p className="font-bold text-sm">{client?.nom}</p>
              <p className="text-xs text-white/70">Espace Client • Terre de Beauce</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-white h-8"
            onClick={handleLogout}
            data-testid="client-logout-btn"
          >
            <LogOut className="w-4 h-4 mr-1" /> Déconnexion
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-2">
          <FolderArchive className="w-6 h-6 text-[#D9A520]" />
          <h1 className="text-3xl font-bold font-['Barlow_Condensed']">Mes documents</h1>
        </div>

        {documents.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <FolderArchive className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun document pour le moment</p>
            </CardContent>
          </Card>
        )}

        {/* En attente de signature */}
        {enAttente.length > 0 && (
          <div data-testid="client-section-pending">
            <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <FileSignature className="w-4 h-4" /> En attente de signature
            </h2>
            <div className="space-y-3">
              {enAttente.map((doc) => (
                <Card key={doc.id} data-testid={`client-doc-${doc.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{doc.titre}</p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {doc.statut === "en_cours" ? "Signature commencée" : "À signer"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => downloadDoc(doc, false)}
                      >
                        <Download className="w-4 h-4 mr-1" /> Aperçu
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-[#1A4D2E] hover:bg-[#143d24]"
                        onClick={() => handleSign(doc.id)}
                        disabled={signingDocId === doc.id}
                        data-testid={`client-sign-document-${doc.id}`}
                      >
                        {signingDocId === doc.id ? (
                          <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <FileSignature className="w-4 h-4 mr-1" />
                        )}
                        {doc.statut === "en_cours" ? "Continuer" : "Signer"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Documents signés / disponibles */}
        {disponibles.length > 0 && (
          <div data-testid="client-section-available">
            <h2 className="text-sm font-semibold text-[#1A4D2E] uppercase tracking-wide mb-3 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4" /> Documents signés &amp; disponibles
            </h2>
            <div className="space-y-3">
              {disponibles.map((doc) => (
                <Card key={doc.id} data-testid={`client-doc-${doc.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{doc.titre}</p>
                        {doc.statut === "signe" ? (
                          <Badge className="mt-1 text-xs bg-green-100 text-green-700 border-green-200 border">
                            Signé
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="mt-1 text-xs">À consulter</Badge>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadDoc(doc, false)}
                          title="Télécharger l'original"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        {doc.statut === "signe" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-700"
                            onClick={() => downloadDoc(doc, true)}
                            title="Télécharger le document signé"
                            data-testid={`client-download-signed-${doc.id}`}
                          >
                            <FileCheck2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
