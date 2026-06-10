import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Building2, LogOut, FileText, Clock, CheckCircle,
  Download, ExternalLink, RefreshCw, Truck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const typeLabels = {
  contrat: "Contrat",
  facture: "Facture",
  autre: "Document",
};

const typeColors = {
  contrat: "bg-indigo-100 text-indigo-700 border-indigo-200",
  facture: "bg-blue-100 text-blue-700 border-blue-200",
  autre: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function ClientPortal() {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [docsEnAttente, setDocsEnAttente] = useState([]);
  const [docsSignes, setDocsSignes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem("client_session");
    if (!session) {
      navigate("/client/login");
      return;
    }
    fetchData();
  }, [navigate]);

  const getHeaders = () => {
    const session = JSON.parse(localStorage.getItem("client_session") || "{}");
    return { Authorization: `Bearer ${session.token}` };
  };

  const fetchData = async () => {
    try {
      const [meRes, attenteRes, signesRes] = await Promise.all([
        axios.get(`${API}/client/me`, { headers: getHeaders() }),
        axios.get(`${API}/client/documents/en-attente`, { headers: getHeaders() }),
        axios.get(`${API}/client/documents/signes`, { headers: getHeaders() }),
      ]);
      setClient(meRes.data);
      setDocsEnAttente(attenteRes.data);
      setDocsSignes(signesRes.data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("client_session");
        navigate("/client/login");
      } else {
        toast.error("Erreur lors du chargement des données");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleLogout = () => {
    localStorage.removeItem("client_session");
    toast.success("Déconnexion réussie");
    navigate("/");
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1A4D2E] to-[#0d2818] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#D9A520] mx-auto mb-4"></div>
          <p className="text-white/70">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-[#1A4D2E] shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D9A520] rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-[#1A4D2E]" />
            </div>
            <div>
              <h1 className="font-bold text-white font-['Barlow_Condensed'] text-lg tracking-wide">
                TERRE DE BEAUCE
              </h1>
              <p className="text-white/60 text-xs">Espace Client</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-white font-medium text-sm">{client?.raison_sociale}</p>
              <p className="text-white/60 text-xs">{client?.ville}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-300" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">En attente</p>
                  <p className="text-3xl font-bold font-['Barlow_Condensed'] text-amber-600">
                    {docsEnAttente.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">document(s) à signer</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Signés</p>
                  <p className="text-3xl font-bold font-['Barlow_Condensed'] text-green-600">
                    {docsSignes.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">document(s) disponibles</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2 md:col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total documents</p>
                  <p className="text-3xl font-bold font-['Barlow_Condensed']">
                    {docsEnAttente.length + docsSignes.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">dans votre espace</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-slate-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-['Barlow_Condensed']">
              Mes documents
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="attente">
              <TabsList className="mb-4">
                <TabsTrigger value="attente" className="gap-2">
                  <Clock className="w-4 h-4" />
                  En attente de signature
                  {docsEnAttente.length > 0 && (
                    <Badge className="bg-amber-100 text-amber-700 ml-1 text-xs">
                      {docsEnAttente.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="signes" className="gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Documents signés
                  {docsSignes.length > 0 && (
                    <Badge className="bg-green-100 text-green-700 ml-1 text-xs">
                      {docsSignes.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* EN ATTENTE */}
              <TabsContent value="attente">
                {docsEnAttente.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-400" />
                    <p className="font-medium">Aucun document en attente</p>
                    <p className="text-sm mt-1">Tous vos documents ont été traités</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Référence</TableHead>
                        <TableHead>Envoyé le</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {docsEnAttente.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">{doc.nom}</TableCell>
                          <TableCell>
                            <Badge className={typeColors[doc.type_document] || typeColors.autre}>
                              {typeLabels[doc.type_document] || "Document"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {doc.reference_liee || "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(doc.created_at)}
                          </TableCell>
                          <TableCell>
                            {doc.docusign_envelope_id ? (
                              <Button size="sm" className="bg-[#1A4D2E] hover:bg-[#14402a]">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Signer
                              </Button>
                            ) : (
                              <Badge variant="outline" className="text-amber-600 border-amber-300">
                                En préparation
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              {/* SIGNÉS */}
              <TabsContent value="signes">
                {docsSignes.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium">Aucun document signé</p>
                    <p className="text-sm mt-1">Vos documents signés apparaîtront ici</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Référence</TableHead>
                        <TableHead>Signé le</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {docsSignes.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">{doc.nom}</TableCell>
                          <TableCell>
                            <Badge className={typeColors[doc.type_document] || typeColors.autre}>
                              {typeLabels[doc.type_document] || "Document"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {doc.reference_liee || "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(doc.signed_at)}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-2" />
                              Télécharger
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
