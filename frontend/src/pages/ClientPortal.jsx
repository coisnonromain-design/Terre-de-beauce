import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Building2,
  LogOut,
  HardHat,
  FileSignature,
  FileText,
  ClipboardList,
  FileCheck2,
  Download,
  RefreshCw,
  MapPin,
  Calendar,
  Euro,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CHANTIER_STATUT = {
  planifie: { label: "Programmé", class: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  en_cours: { label: "En cours", class: "bg-amber-100 text-amber-700 border-amber-200" },
  termine: { label: "Terminé", class: "bg-green-100 text-green-700 border-green-200" },
  annule: { label: "Annulé", class: "bg-red-100 text-red-700 border-red-200" },
};

const FACTURE_STATUT = {
  emise: { label: "Émise", class: "bg-blue-100 text-blue-700 border-blue-200" },
  envoyee: { label: "À signer", class: "bg-amber-100 text-amber-700 border-amber-200" },
  signee: { label: "Signée", class: "bg-green-100 text-green-700 border-green-200" },
  payee: { label: "Payée", class: "bg-slate-100 text-slate-600 border-slate-200" },
};

export default function ClientPortal() {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [chantiers, setChantiers] = useState([]);
  const [contrats, setContrats] = useState([]);
  const [releves, setReleves] = useState([]);
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signingId, setSigningId] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("client_session");
    if (!saved) {
      navigate("/client/login");
      return;
    }
    const session = JSON.parse(saved);
    setClient(session);
    fetchAll(session.client_id);
    setLoading(false);

    const params = new URLSearchParams(window.location.search);
    if (params.get("docusign_return") === "1" && params.get("kind") && params.get("itemId")) {
      const kind = params.get("kind");
      const itemId = params.get("itemId");
      const event = params.get("event");
      window.history.replaceState({}, "", "/client/portal");
      handleDocusignReturn(kind, itemId, event, session.client_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const fetchAll = async (clientId) => {
    try {
      const [chRes, ctRes, rvRes, fcRes] = await Promise.all([
        axios.get(`${API}/client/${clientId}/chantiers`),
        axios.get(`${API}/client/${clientId}/contrats`),
        axios.get(`${API}/client/${clientId}/releves`),
        axios.get(`${API}/client/${clientId}/factures`),
      ]);
      setChantiers(chRes.data);
      setContrats(ctRes.data);
      setReleves(rvRes.data);
      setFactures(fcRes.data);
    } catch (error) {
      console.error("Erreur chargement données:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("client_session");
    toast.success("Déconnexion réussie");
    navigate("/");
  };

  const handleSign = async (kind, itemId) => {
    setSigningId(itemId);
    try {
      const base = kind === "contrat" ? `contrats-ccpa/${itemId}` : `factures/${itemId}`;
      const returnUrl = `${window.location.origin}/client/portal?docusign_return=1&kind=${kind}&itemId=${itemId}`;
      const res = await axios.post(`${API}/${base}/sign-embedded?return_url=${encodeURIComponent(returnUrl)}`);
      if (res.data.signing_url) {
        window.location.href = res.data.signing_url;
      } else {
        toast.error("Impossible d'ouvrir la signature");
        setSigningId(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'ouverture de la signature");
      setSigningId(null);
    }
  };

  const handleDocusignReturn = async (kind, itemId, event, clientId) => {
    try {
      const base = kind === "contrat" ? `contrats-ccpa/${itemId}` : `factures/${itemId}`;
      const res = await axios.post(`${API}/${base}/sign-sync`);
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
      fetchAll(clientId);
    }
  };

  const openPdf = (url) => window.open(url, "_blank");

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A4D2E]"></div>
      </div>
    );
  }

  const contratBuckets = {
    attente: contrats.filter((c) => !["signe", "annule"].includes(c.statut)),
    signes: contrats.filter((c) => c.statut === "signe"),
    visualiser: contrats.filter((c) => c.statut === "annule"),
  };
  const factureBuckets = {
    attente: factures.filter((f) => ["emise", "envoyee"].includes(f.statut)),
    signes: factures.filter((f) => f.statut === "signee"),
    visualiser: factures.filter((f) => f.statut === "payee"),
  };

  const chantierGroups = [
    { key: "planifie", label: "Programmés", items: chantiers.filter((c) => c.statut === "planifie") },
    { key: "en_cours", label: "En cours", items: chantiers.filter((c) => c.statut === "en_cours") },
    { key: "termine", label: "Terminés", items: chantiers.filter((c) => c.statut === "termine") },
  ];

  const EmptyState = ({ icon: Icon, text }) => (
    <Card>
      <CardContent className="p-10 text-center text-muted-foreground">
        <Icon className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p>{text}</p>
      </CardContent>
    </Card>
  );

  const renderSignableItem = (item, kind) => {
    const isContrat = kind === "contrat";
    const numero = isContrat ? item.numero_contrat : item.numero;
    const signed = isContrat ? item.statut === "signe" : item.statut === "signee";
    const canSign = isContrat
      ? !["signe", "annule"].includes(item.statut)
      : ["emise", "envoyee"].includes(item.statut);
    const pdfBase = isContrat ? `${API}/contrats-ccpa/${item.id}/pdf` : `${API}/factures/${item.id}/pdf`;
    return (
      <Card key={item.id} data-testid={`client-${kind}-${item.id}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium truncate">{numero}</p>
              {!isContrat && (
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge className={`text-xs border ${(FACTURE_STATUT[item.statut] || {}).class || ""}`}>
                    {(FACTURE_STATUT[item.statut] || {}).label || item.statut}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                    {(item.montant_ttc || 0).toFixed(2)} <Euro className="w-3 h-3" /> TTC
                  </span>
                </div>
              )}
              {isContrat && <span className="text-xs text-muted-foreground">Contrat CCPA</span>}
            </div>
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => openPdf(pdfBase)}>
              <Download className="w-4 h-4 mr-1" /> {signed ? "Original" : "Aperçu"}
            </Button>
            {signed && (
              <Button
                variant="outline"
                size="sm"
                className="text-green-700"
                onClick={() => openPdf(`${pdfBase}?signed=true`)}
                data-testid={`client-download-signed-${kind}-${item.id}`}
              >
                <FileCheck2 className="w-4 h-4 mr-1" /> Signé
              </Button>
            )}
            {canSign && (
              <Button
                size="sm"
                className="bg-[#1A4D2E] hover:bg-[#143d24] ml-auto"
                onClick={() => handleSign(kind, item.id)}
                disabled={signingId === item.id}
                data-testid={`client-sign-${kind}-${item.id}`}
              >
                {signingId === item.id ? (
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <FileSignature className="w-4 h-4 mr-1" />
                )}
                Signer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSignableTab = (buckets, kind, emptyText) => {
    const total = buckets.attente.length + buckets.signes.length + buckets.visualiser.length;
    if (total === 0) return <EmptyState icon={kind === "contrat" ? FileText : Euro} text={emptyText} />;
    return (
      <div className="space-y-6">
        {buckets.attente.length > 0 && (
          <div data-testid={`${kind}-section-attente`}>
            <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-2 flex items-center gap-2">
              <FileSignature className="w-4 h-4" /> En attente de signature
            </h3>
            <div className="space-y-3">{buckets.attente.map((it) => renderSignableItem(it, kind))}</div>
          </div>
        )}
        {buckets.signes.length > 0 && (
          <div data-testid={`${kind}-section-signes`}>
            <h3 className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-2 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4" /> Signés
            </h3>
            <div className="space-y-3">{buckets.signes.map((it) => renderSignableItem(it, kind))}</div>
          </div>
        )}
        {buckets.visualiser.length > 0 && (
          <div data-testid={`${kind}-section-visualiser`}>
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" /> À visualiser
            </h3>
            <div className="space-y-3">{buckets.visualiser.map((it) => renderSignableItem(it, kind))}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100" data-testid="client-portal">
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

      <div className="max-w-3xl mx-auto p-4">
        <Tabs defaultValue="chantiers" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="chantiers" data-testid="tab-chantiers">
              <HardHat className="w-4 h-4 mr-1 hidden sm:inline" /> Chantiers
            </TabsTrigger>
            <TabsTrigger value="contrats" data-testid="tab-contrats">
              <FileText className="w-4 h-4 mr-1 hidden sm:inline" /> Contrats
            </TabsTrigger>
            <TabsTrigger value="releves" data-testid="tab-releves">
              <ClipboardList className="w-4 h-4 mr-1 hidden sm:inline" /> Relevés
            </TabsTrigger>
            <TabsTrigger value="factures" data-testid="tab-factures">
              <Euro className="w-4 h-4 mr-1 hidden sm:inline" /> Factures
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chantiers" data-testid="content-chantiers">
            {chantiers.length === 0 ? (
              <EmptyState icon={HardHat} text="Aucun chantier" />
            ) : (
              <div className="space-y-6">
                {chantierGroups.map((g) =>
                  g.items.length > 0 ? (
                    <div key={g.key} data-testid={`chantier-group-${g.key}`}>
                      <h3 className="text-sm font-semibold uppercase tracking-wide mb-2 flex items-center gap-2">
                        <Badge className={`${(CHANTIER_STATUT[g.key] || {}).class} border`}>{g.label}</Badge>
                        <span className="text-muted-foreground">({g.items.length})</span>
                      </h3>
                      <div className="space-y-3">
                        {g.items.map((ch) => (
                          <Card key={ch.id} data-testid={`client-chantier-${ch.id}`}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-medium">{ch.reference}</p>
                                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                                    <MapPin className="w-3.5 h-3.5" /> {ch.lieu}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {ch.date_debut}
                                    {ch.date_fin ? ` → ${ch.date_fin}` : ""}
                                  </div>
                                </div>
                                <Badge className={`${(CHANTIER_STATUT[ch.statut] || {}).class} border shrink-0`}>
                                  {(CHANTIER_STATUT[ch.statut] || {}).label || ch.statut}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="contrats" data-testid="content-contrats">
            {renderSignableTab(contratBuckets, "contrat", "Aucun contrat")}
          </TabsContent>

          <TabsContent value="releves" data-testid="content-releves">
            {releves.length === 0 ? (
              <EmptyState icon={ClipboardList} text="Aucun relevé de pointages" />
            ) : (
              <div data-testid="releve-section-visualiser">
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> À visualiser
                </h3>
                <div className="space-y-3">
                  {releves.map((rv) => (
                    <Card key={rv.chantier_id} data-testid={`client-releve-${rv.chantier_id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium">{rv.numero_releve}</p>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                              <MapPin className="w-3.5 h-3.5" /> {rv.lieu}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Chantier {rv.chantier_reference} · {rv.nb_pointages} pointage(s)
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                            onClick={() => openPdf(`${API}/chantiers/${rv.chantier_id}/pointages/pdf`)}
                            data-testid={`client-download-releve-${rv.chantier_id}`}
                          >
                            <Download className="w-4 h-4 mr-1" /> Télécharger
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="factures" data-testid="content-factures">
            {renderSignableTab(factureBuckets, "facture", "Aucune facture")}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
