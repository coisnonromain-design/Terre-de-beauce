import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Eye,
  Send,
  Check,
  Search,
  Download,
  Euro,
  Calendar,
  Building2,
  Trash2,
  Pen,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  FileDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusConfig = {
  brouillon: { label: "Brouillon", class: "bg-slate-100 text-slate-600 border-slate-200", icon: FileText },
  emise: { label: "Émise", class: "bg-blue-100 text-blue-700 border-blue-200", icon: FileText },
  envoyee: { label: "Envoyée", class: "bg-indigo-100 text-indigo-700 border-indigo-200", icon: Send },
  signee: { label: "Signée", class: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
  payee: { label: "Payée", class: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: Check },
  annulee: { label: "Annulée", class: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
};

const docusignStatusConfig = {
  sent: { label: "Envoyé", class: "bg-blue-50 text-blue-600", icon: Mail },
  delivered: { label: "Reçu", class: "bg-indigo-50 text-indigo-600", icon: Mail },
  completed: { label: "Signé", class: "bg-green-50 text-green-600", icon: CheckCircle },
  declined: { label: "Refusé", class: "bg-red-50 text-red-600", icon: XCircle },
  voided: { label: "Annulé", class: "bg-gray-50 text-gray-600", icon: XCircle },
};

export default function Factures() {
  const [factures, setFactures] = useState([]);
  const [chantiers, setChantiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [viewingFacture, setViewingFacture] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [factureToDelete, setFactureToDelete] = useState(null);
  const [entrepriseConfig, setEntrepriseConfig] = useState(null);
  const [docusignStatus, setDocusignStatus] = useState(null);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [signatureForm, setSignatureForm] = useState({ email: "", name: "" });
  const [sendingSignature, setSendingSignature] = useState(false);
  const [syncingStatus, setSyncingStatus] = useState(false);

  const [form, setForm] = useState({
    chantier_id: "",
    date_echeance: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
    checkDocusignStatus();
  }, []);

  const fetchData = async () => {
    try {
      const [facturesRes, chantiersRes, configRes] = await Promise.all([
        axios.get(`${API}/factures`),
        axios.get(`${API}/chantiers`),
        axios.get(`${API}/config/entreprise`),
      ]);
      setFactures(facturesRes.data);
      // Filtrer les chantiers terminés ou en cours
      setChantiers(chantiersRes.data.filter(c => c.statut === "en_cours" || c.statut === "termine"));
      setEntrepriseConfig(configRes.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const checkDocusignStatus = async () => {
    try {
      const res = await axios.get(`${API}/docusign/status`);
      setDocusignStatus(res.data);
    } catch (error) {
      setDocusignStatus({ configured: false, authenticated: false });
    }
  };

  const handleDocusignAuth = async () => {
    try {
      const redirectUri = `${window.location.origin}/docusign-callback`;
      const res = await axios.get(`${API}/docusign/auth-url?redirect_uri=${encodeURIComponent(redirectUri)}`);
      window.open(res.data.auth_url, "_blank", "width=600,height=700");
    } catch (error) {
      toast.error("Erreur lors de la connexion DocuSign");
    }
  };

  const handleSendForSignature = async () => {
    if (!signatureForm.email || !signatureForm.name) {
      toast.error("Veuillez remplir l'email et le nom du signataire");
      return;
    }

    setSendingSignature(true);
    try {
      const res = await axios.post(
        `${API}/docusign/send-facture/${viewingFacture.id}?signer_email=${encodeURIComponent(signatureForm.email)}&signer_name=${encodeURIComponent(signatureForm.name)}`
      );
      toast.success(res.data.message);
      setSignatureDialogOpen(false);
      setSignatureForm({ email: "", name: "" });
      fetchData();
      // Update viewing facture
      setViewingFacture({ ...viewingFacture, statut: "envoyee", docusign_envelope_id: res.data.envelope_id });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'envoi");
    } finally {
      setSendingSignature(false);
    }
  };

  const syncDocuSignStatus = async (factureId) => {
    setSyncingStatus(true);
    try {
      const res = await axios.post(`${API}/docusign/sync-status/facture/${factureId}`);
      toast.success(`Statut mis à jour: ${docusignStatusConfig[res.data.docusign_status]?.label || res.data.docusign_status}`);
      fetchData();
      if (viewingFacture?.id === factureId) {
        setViewingFacture(res.data.document);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la synchronisation");
    } finally {
      setSyncingStatus(false);
    }
  };

  const syncAllStatuses = async () => {
    setSyncingStatus(true);
    try {
      const res = await axios.post(`${API}/docusign/sync-all`);
      const totalSynced = res.data.factures.length + res.data.contrats.length;
      toast.success(`${totalSynced} documents synchronisés`);
      fetchData();
    } catch (error) {
      toast.error("Erreur lors de la synchronisation");
    } finally {
      setSyncingStatus(false);
    }
  };

  const handleGenerateFacture = async () => {
    if (!form.chantier_id || !form.date_echeance) {
      toast.error("Veuillez sélectionner un chantier et une date d'échéance");
      return;
    }

    try {
      await axios.post(`${API}/factures/generer`, form);
      toast.success("Facture générée avec succès");
      setDialogOpen(false);
      setForm({ chantier_id: "", date_echeance: "", notes: "" });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la génération");
    }
  };

  const handleUpdateStatut = async (factureId, newStatut) => {
    try {
      await axios.put(`${API}/factures/${factureId}/statut?statut=${newStatut}`);
      toast.success("Statut mis à jour");
      fetchData();
      if (viewingFacture?.id === factureId) {
        setViewingFacture({ ...viewingFacture, statut: newStatut });
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async () => {
    if (!factureToDelete) return;
    try {
      await axios.delete(`${API}/factures/${factureToDelete.id}`);
      toast.success("Facture supprimée");
      fetchData();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteDialogOpen(false);
      setFactureToDelete(null);
    }
  };

  const filteredFactures = factures.filter((f) => {
    const matchesSearch =
      f.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.client_raison_sociale && f.client_raison_sociale.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || f.statut === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalEnAttente = factures
    .filter(f => ["brouillon", "emise", "envoyee"].includes(f.statut))
    .reduce((sum, f) => sum + (f.montant_ttc || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A4D2E]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="factures-page">
      {/* DocuSign Status Banner */}
      {docusignStatus && !docusignStatus.authenticated && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">Signature électronique DocuSign</p>
                <p className="text-sm text-amber-700">
                  Connectez-vous pour envoyer des factures en signature électronique
                </p>
              </div>
            </div>
            <Button
              onClick={handleDocusignAuth}
              variant="outline"
              className="border-amber-400 text-amber-700 hover:bg-amber-100"
              data-testid="docusign-connect-btn"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Connecter DocuSign
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-['Barlow_Condensed'] tracking-tight">
            Facturation
          </h1>
          <p className="text-muted-foreground mt-1">
            {factures.length} facture(s) • {totalEnAttente.toLocaleString('fr-FR')} € en attente
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-48"
              data-testid="search-facture-input"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36" data-testid="status-filter">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="brouillon">Brouillon</SelectItem>
              <SelectItem value="emise">Émise</SelectItem>
              <SelectItem value="envoyee">Envoyée</SelectItem>
              <SelectItem value="signee">Signée</SelectItem>
              <SelectItem value="payee">Payée</SelectItem>
              <SelectItem value="annulee">Annulée</SelectItem>
            </SelectContent>
          </Select>
          {docusignStatus?.authenticated && (
            <Button
              variant="outline"
              onClick={syncAllStatuses}
              disabled={syncingStatus}
              data-testid="sync-all-docusign-btn"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncingStatus ? 'animate-spin' : ''}`} />
              Sync DocuSign
            </Button>
          )}
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-[#1A4D2E] hover:bg-[#143d24]"
            data-testid="generate-facture-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Générer facture
          </Button>
        </div>
      </div>

      {/* Factures Table */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-xl font-['Barlow_Condensed'] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#D9A520]" />
            Liste des factures
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredFactures.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucune facture trouvée</p>
              <p className="text-sm">Générez une facture à partir d'un chantier terminé</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Facture</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Chantier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Montant TTC</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Signature DocuSign</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFactures.map((facture) => {
                  const StatusIcon = statusConfig[facture.statut]?.icon || FileText;
                  const docuStatus = facture.docusign_status ? docusignStatusConfig[facture.docusign_status] : null;
                  const DocuIcon = docuStatus?.icon || Clock;
                  
                  return (
                  <TableRow key={facture.id} data-testid={`facture-row-${facture.id}`}>
                    <TableCell className="font-mono font-medium text-[#1A4D2E]">
                      {facture.numero}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        {facture.client_raison_sociale}
                      </div>
                    </TableCell>
                    <TableCell>{facture.chantier_reference}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {new Date(facture.date_emission).toLocaleDateString("fr-FR")}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {facture.montant_ttc?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusConfig[facture.statut]?.class} border`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig[facture.statut]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {facture.docusign_envelope_id ? (
                        <div className="flex flex-col gap-1">
                          <Badge className={`${docuStatus?.class || 'bg-gray-50 text-gray-600'} text-xs`}>
                            <DocuIcon className="w-3 h-3 mr-1" />
                            {docuStatus?.label || facture.docusign_status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => syncDocuSignStatus(facture.id)}
                            disabled={syncingStatus}
                          >
                            <RefreshCw className={`w-3 h-3 mr-1 ${syncingStatus ? 'animate-spin' : ''}`} />
                            Actualiser
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setViewingFacture(facture);
                            setDetailDialogOpen(true);
                          }}
                          data-testid={`view-facture-${facture.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          title="Voir le PDF"
                          data-testid={`view-pdf-facture-${facture.id}`}
                        >
                          <a href={`${API}/factures/${facture.id}/pdf`} target="_blank" rel="noopener noreferrer">
                            <FileDown className="w-4 h-4 text-red-600" />
                          </a>
                        </Button>
                        {facture.statut === "brouillon" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUpdateStatut(facture.id, "emise")}
                            data-testid={`emit-facture-${facture.id}`}
                          >
                            <Check className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                        {(facture.statut === "emise" || facture.statut === "brouillon") && docusignStatus?.authenticated && !facture.docusign_envelope_id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setViewingFacture(facture);
                              setSignatureForm({ email: facture.client_email || "", name: facture.client_raison_sociale || "" });
                              setSignatureDialogOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-700"
                            data-testid={`send-docusign-facture-${facture.id}`}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                        {facture.statut === "brouillon" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setFactureToDelete(facture);
                              setDeleteDialogOpen(true);
                            }}
                            data-testid={`delete-facture-${facture.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Generate Facture Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Barlow_Condensed'] text-2xl">
              Générer une facture
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Chantier *</Label>
              <Select
                value={form.chantier_id}
                onValueChange={(value) => setForm({ ...form, chantier_id: value })}
              >
                <SelectTrigger data-testid="select-chantier">
                  <SelectValue placeholder="Sélectionner un chantier" />
                </SelectTrigger>
                <SelectContent>
                  {chantiers.map((chantier) => (
                    <SelectItem key={chantier.id} value={chantier.id}>
                      {chantier.reference} - {chantier.client_nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                La facture sera générée à partir des pointages du chantier
              </p>
            </div>
            <div>
              <Label>Date d'échéance *</Label>
              <Input
                type="date"
                value={form.date_echeance}
                onChange={(e) => setForm({ ...form, date_echeance: e.target.value })}
                data-testid="date-echeance-input"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notes additionnelles..."
                data-testid="notes-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleGenerateFacture}
              className="bg-[#1A4D2E] hover:bg-[#143d24]"
              data-testid="confirm-generate-btn"
            >
              Générer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Facture Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Barlow_Condensed'] text-2xl flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#D9A520]" />
              Facture {viewingFacture?.numero}
            </DialogTitle>
          </DialogHeader>
          {viewingFacture && (
            <div className="space-y-6">
              {/* En-tête facture */}
              <div className="grid grid-cols-2 gap-6 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Émetteur</p>
                  <p className="font-semibold">{entrepriseConfig?.raison_sociale}</p>
                  <p className="text-sm text-muted-foreground">
                    {entrepriseConfig?.adresse}<br />
                    {entrepriseConfig?.code_postal} {entrepriseConfig?.ville}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    SIRET: {entrepriseConfig?.siret}<br />
                    TVA: {entrepriseConfig?.tva_intracommunautaire}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Client</p>
                  <p className="font-semibold">{viewingFacture.client_raison_sociale}</p>
                  <p className="text-sm text-muted-foreground">{viewingFacture.client_adresse}</p>
                  {viewingFacture.client_siret && (
                    <p className="text-sm text-muted-foreground mt-1">
                      SIRET: {viewingFacture.client_siret}
                    </p>
                  )}
                  {viewingFacture.client_tva && (
                    <p className="text-sm text-muted-foreground">
                      TVA: {viewingFacture.client_tva}
                    </p>
                  )}
                </div>
              </div>

              {/* Infos facture */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Date émission</p>
                  <p className="font-medium">{new Date(viewingFacture.date_emission).toLocaleDateString("fr-FR")}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Échéance</p>
                  <p className="font-medium">{new Date(viewingFacture.date_echeance).toLocaleDateString("fr-FR")}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Statut</p>
                  <Badge className={`${statusConfig[viewingFacture.statut]?.class} border mt-1`}>
                    {statusConfig[viewingFacture.statut]?.label}
                  </Badge>
                </div>
              </div>

              {/* Référence chantier */}
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm">
                  <span className="text-muted-foreground">Chantier:</span>{" "}
                  <span className="font-medium">{viewingFacture.chantier_reference}</span>
                  {viewingFacture.chantier_lieu && (
                    <span className="text-muted-foreground"> - {viewingFacture.chantier_lieu}</span>
                  )}
                </p>
              </div>

              <Separator />

              {/* Lignes de facture */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-3">Détail</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qté</TableHead>
                      <TableHead className="text-right">P.U. HT</TableHead>
                      <TableHead className="text-right">Total HT</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewingFacture.lignes?.map((ligne, index) => (
                      <TableRow key={index}>
                        <TableCell>{ligne.description}</TableCell>
                        <TableCell className="text-right">
                          {ligne.quantite} {ligne.unite}
                        </TableCell>
                        <TableCell className="text-right">
                          {ligne.prix_unitaire?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {ligne.montant_ht?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totaux */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total HT</span>
                    <span className="font-medium">
                      {viewingFacture.montant_ht?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TVA ({viewingFacture.taux_tva}%)</span>
                    <span>
                      {viewingFacture.montant_tva?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total TTC</span>
                    <span className="text-[#1A4D2E]">
                      {viewingFacture.montant_ttc?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                {viewingFacture.statut === "brouillon" && (
                  <Button
                    onClick={() => handleUpdateStatut(viewingFacture.id, "emise")}
                    className="bg-[#1A4D2E] hover:bg-[#143d24]"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Valider et émettre
                  </Button>
                )}
                {viewingFacture.statut === "emise" && docusignStatus?.authenticated && (
                  <Button
                    onClick={() => {
                      setSignatureForm({
                        email: viewingFacture.client_email || "",
                        name: viewingFacture.client_raison_sociale || "",
                      });
                      setSignatureDialogOpen(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                    data-testid="send-signature-btn"
                  >
                    <Pen className="w-4 h-4 mr-2" />
                    Envoyer en signature
                  </Button>
                )}
                {viewingFacture.statut === "emise" && !docusignStatus?.authenticated && (
                  <Button
                    onClick={() => handleUpdateStatut(viewingFacture.id, "envoyee")}
                    variant="outline"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Marquer envoyée
                  </Button>
                )}
                {viewingFacture.statut === "envoyee" && (
                  <Button
                    onClick={() => handleUpdateStatut(viewingFacture.id, "signee")}
                    variant="outline"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Marquer signée
                  </Button>
                )}
                {viewingFacture.statut === "signee" && (
                  <Button
                    onClick={() => handleUpdateStatut(viewingFacture.id, "payee")}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Euro className="w-4 h-4 mr-2" />
                    Marquer payée
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Signature Dialog */}
      <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Barlow_Condensed'] text-2xl flex items-center gap-2">
              <Pen className="w-6 h-6 text-blue-600" />
              Envoyer en signature électronique
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              La facture <strong>{viewingFacture?.numero}</strong> sera envoyée via DocuSign pour signature électronique.
            </p>
            <div>
              <Label>Email du signataire *</Label>
              <Input
                type="email"
                value={signatureForm.email}
                onChange={(e) => setSignatureForm({ ...signatureForm, email: e.target.value })}
                placeholder="client@email.com"
                data-testid="signer-email-input"
              />
            </div>
            <div>
              <Label>Nom du signataire *</Label>
              <Input
                value={signatureForm.name}
                onChange={(e) => setSignatureForm({ ...signatureForm, name: e.target.value })}
                placeholder="Nom complet"
                data-testid="signer-name-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignatureDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSendForSignature}
              disabled={sendingSignature}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="confirm-send-signature-btn"
            >
              <Pen className="w-4 h-4 mr-2" />
              {sendingSignature ? "Envoi en cours..." : "Envoyer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la facture{" "}
              <strong>{factureToDelete?.numero}</strong> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
