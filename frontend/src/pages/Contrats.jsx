import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  FileSignature,
  Plus,
  Pencil,
  Trash2,
  Search,
  Eye,
  Send,
  CheckCircle,
  Clock,
  FileText,
  Building2,
  Fuel,
  Calendar,
  RefreshCw,
  Mail,
  XCircle,
  Loader2,
  Download,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusConfig = {
  brouillon: { label: "Brouillon", class: "bg-slate-100 text-slate-700 border-slate-200", icon: FileText },
  envoye: { label: "Envoyé", class: "bg-blue-100 text-blue-700 border-blue-200", icon: Send },
  signe: { label: "Signé", class: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
  annule: { label: "Annulé", class: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
};

const docusignStatusConfig = {
  sent: { label: "Envoyé", class: "bg-blue-50 text-blue-600", icon: Mail },
  delivered: { label: "Reçu", class: "bg-indigo-50 text-indigo-600", icon: Mail },
  completed: { label: "Signé", class: "bg-green-50 text-green-600", icon: CheckCircle },
  declined: { label: "Refusé", class: "bg-red-50 text-red-600", icon: XCircle },
  voided: { label: "Annulé", class: "bg-gray-50 text-gray-600", icon: XCircle },
};

export default function Contrats() {
  const [contrats, setContrats] = useState([]);
  const [chantiers, setChantiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingContrat, setEditingContrat] = useState(null);
  const [viewingContrat, setViewingContrat] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contratToDelete, setContratToDelete] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedChantierId, setSelectedChantierId] = useState("");
  
  // DocuSign states
  const [docusignDialogOpen, setDocusignDialogOpen] = useState(false);
  const [docusignContrat, setDocusignContrat] = useState(null);
  const [signerEmail, setSignerEmail] = useState("");
  const [signerName, setSignerName] = useState("");
  const [sendingDocusign, setSendingDocusign] = useState(false);
  const [docusignStatus, setDocusignStatus] = useState(null);
  const [syncingStatus, setSyncingStatus] = useState(false);

  const [form, setForm] = useState({
    client_nom: "",
    client_interlocuteur: "",
    client_adresse: "",
    client_email: "",
    client_telephone: "",
    prix_unitaire: 0,
    unite_facturation: "",
    date_signature: "",
  });

  useEffect(() => {
    fetchData();
    checkDocuSignStatus();
  }, []);

  const fetchData = async () => {
    try {
      const [contratsRes, chantiersRes] = await Promise.all([
        axios.get(`${API}/contrats-ccpa`),
        axios.get(`${API}/chantiers`),
      ]);
      setContrats(contratsRes.data);
      setChantiers(chantiersRes.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const checkDocuSignStatus = async () => {
    try {
      const res = await axios.get(`${API}/docusign/status`);
      setDocusignStatus(res.data);
    } catch (error) {
      console.error("Erreur vérification DocuSign:", error);
    }
  };

  const handleCreateContrat = async () => {
    if (!selectedChantierId) {
      toast.error("Veuillez sélectionner un chantier");
      return;
    }
    try {
      await axios.post(`${API}/contrats-ccpa`, { chantier_id: selectedChantierId });
      toast.success("Contrat CCPA créé avec succès");
      setCreateDialogOpen(false);
      setSelectedChantierId("");
      fetchData();
    } catch (error) {
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error("Erreur lors de la création du contrat");
      }
    }
  };

  const handleUpdateContrat = async () => {
    if (!editingContrat) return;
    try {
      await axios.put(`${API}/contrats-ccpa/${editingContrat.id}`, form);
      toast.success("Contrat modifié avec succès");
      setDialogOpen(false);
      setEditingContrat(null);
      fetchData();
    } catch (error) {
      toast.error("Erreur lors de la modification");
    }
  };

  const openEditDialog = (contrat) => {
    setEditingContrat(contrat);
    setForm({
      client_nom: contrat.client_nom || "",
      client_interlocuteur: contrat.client_interlocuteur || "",
      client_adresse: contrat.client_adresse || "",
      client_email: contrat.client_email || "",
      client_telephone: contrat.client_telephone || "",
      prix_unitaire: contrat.prix_unitaire || 0,
      unite_facturation: contrat.unite_facturation || "",
      date_signature: contrat.date_signature || "",
    });
    setDialogOpen(true);
  };

  const openViewDialog = (contrat) => {
    setViewingContrat(contrat);
    setViewDialogOpen(true);
  };

  const openDocuSignDialog = (contrat) => {
    setDocusignContrat(contrat);
    setSignerEmail(contrat.client_email || "");
    setSignerName(contrat.client_interlocuteur || contrat.client_nom || "");
    setDocusignDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!contratToDelete) return;
    try {
      await axios.delete(`${API}/contrats-ccpa/${contratToDelete.id}`);
      toast.success("Contrat supprimé");
      fetchData();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteDialogOpen(false);
      setContratToDelete(null);
    }
  };

  const updateStatut = async (contratId, newStatut) => {
    try {
      await axios.put(`${API}/contrats-ccpa/${contratId}`, { statut: newStatut });
      toast.success("Statut mis à jour");
      fetchData();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };

  const handleSendDocuSign = async () => {
    if (!docusignContrat || !signerEmail || !signerName) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setSendingDocusign(true);
    try {
      const res = await axios.post(
        `${API}/docusign/send-contrat/${docusignContrat.id}?signer_email=${encodeURIComponent(signerEmail)}&signer_name=${encodeURIComponent(signerName)}`
      );
      toast.success(res.data.message || "Contrat envoyé pour signature");
      setDocusignDialogOpen(false);
      fetchData();
    } catch (error) {
      const msg = error.response?.data?.detail || "Erreur lors de l'envoi DocuSign";
      toast.error(msg);
    } finally {
      setSendingDocusign(false);
    }
  };

  const syncDocuSignStatus = async (contratId) => {
    setSyncingStatus(true);
    try {
      const res = await axios.post(`${API}/docusign/sync-status/contrat/${contratId}`);
      toast.success(`Statut mis à jour: ${res.data.docusign_status}`);
      fetchData();
    } catch (error) {
      toast.error("Erreur lors de la synchronisation");
    } finally {
      setSyncingStatus(false);
    }
  };

  const syncAllStatuses = async () => {
    setSyncingStatus(true);
    try {
      const res = await axios.post(`${API}/docusign/sync-all`);
      const totalSynced = res.data.contrats.length + res.data.factures.length;
      toast.success(`${totalSynced} documents synchronisés`);
      fetchData();
    } catch (error) {
      toast.error("Erreur lors de la synchronisation");
    } finally {
      setSyncingStatus(false);
    }
  };

  // Chantiers sans contrat
  const chantiersWithoutContract = chantiers.filter(
    (ch) => !contrats.some((c) => c.chantier_id === ch.id)
  );

  const getChantierReference = (chantierId) => {
    const chantier = chantiers.find((c) => c.id === chantierId);
    return chantier?.reference || "-";
  };

  const filteredContrats = contrats.filter((c) => {
    const chantierRef = getChantierReference(c.chantier_id);
    const matchesSearch =
      c.numero_contrat?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.client_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chantierRef.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.statut === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A4D2E]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="contrats-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-['Barlow_Condensed'] tracking-tight">
            Contrats CCPA
          </h1>
          <p className="text-muted-foreground mt-1">
            {contrats.filter((c) => c.statut === "signe").length} signés •{" "}
            {contrats.filter((c) => c.statut === "envoye").length} en attente de signature •{" "}
            {contrats.filter((c) => c.statut === "brouillon").length} brouillons
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
              data-testid="search-contrat-input"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36" data-testid="status-filter-select">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="brouillon">Brouillons</SelectItem>
              <SelectItem value="envoye">Envoyés</SelectItem>
              <SelectItem value="signe">Signés</SelectItem>
              <SelectItem value="annule">Annulés</SelectItem>
            </SelectContent>
          </Select>
          {docusignStatus?.authenticated && (
            <Button
              variant="outline"
              onClick={syncAllStatuses}
              disabled={syncingStatus}
              data-testid="sync-all-btn"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncingStatus ? 'animate-spin' : ''}`} />
              Sync DocuSign
            </Button>
          )}
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-[#1A4D2E] hover:bg-[#143d24]"
            data-testid="add-contrat-btn"
            disabled={chantiersWithoutContract.length === 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau contrat
          </Button>
        </div>
      </div>

      {/* DocuSign Status Alert */}
      {docusignStatus && !docusignStatus.authenticated && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-center justify-between">
            <p className="text-amber-800">
              <strong>DocuSign non connecté :</strong> Connectez-vous à DocuSign dans la page Configuration pour envoyer des contrats pour signature.
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href="/configuration">Configuration</a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Info card if no chantiers available */}
      {chantiersWithoutContract.length === 0 && contrats.length === 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <p className="text-amber-800">
              <strong>Info :</strong> Créez d'abord un chantier pour pouvoir générer un contrat CCPA.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Contrats Table */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-xl font-['Barlow_Condensed'] flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-[#D9A520]" />
            Liste des contrats
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredContrats.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <FileSignature className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun contrat trouvé</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Contrat</TableHead>
                  <TableHead>Chantier</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Tarif</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Signature DocuSign</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContrats.map((contrat) => {
                  const StatusIcon = statusConfig[contrat.statut]?.icon || FileText;
                  const docuStatus = contrat.docusign_status ? docusignStatusConfig[contrat.docusign_status] : null;
                  const DocuIcon = docuStatus?.icon || Clock;
                  
                  return (
                    <TableRow key={contrat.id} data-testid={`contrat-row-${contrat.id}`}>
                      <TableCell>
                        <span className="font-mono font-medium text-[#1A4D2E]">
                          {contrat.numero_contrat}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {getChantierReference(contrat.chantier_id)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                            {contrat.client_nom || "-"}
                          </div>
                          {contrat.client_email && (
                            <span className="text-xs text-muted-foreground">{contrat.client_email}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {contrat.prix_unitaire > 0 ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-[#1A4D2E]">
                              {contrat.prix_unitaire}€/{contrat.unite_facturation?.split(" ")[0] || "unité"}
                            </span>
                            <span className={`text-xs flex items-center gap-1 ${contrat.gasoil_fourni ? 'text-green-600' : 'text-orange-600'}`}>
                              <Fuel className="w-3 h-3" />
                              {contrat.gasoil_fourni ? "Gasoil fourni" : "Sans gasoil"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusConfig[contrat.statut]?.class} border`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[contrat.statut]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {contrat.docusign_envelope_id ? (
                          <div className="flex flex-col gap-1">
                            <Badge className={`${docuStatus?.class || 'bg-gray-50 text-gray-600'} text-xs`}>
                              <DocuIcon className="w-3 h-3 mr-1" />
                              {docuStatus?.label || contrat.docusign_status}
                            </Badge>
                            {contrat.docusign_signer_email && (
                              <span className="text-xs text-muted-foreground">{contrat.docusign_signer_email}</span>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => syncDocuSignStatus(contrat.id)}
                              disabled={syncingStatus}
                            >
                              <RefreshCw className={`w-3 h-3 mr-1 ${syncingStatus ? 'animate-spin' : ''}`} />
                              Actualiser
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Non envoyé</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openViewDialog(contrat)}
                            data-testid={`view-contrat-${contrat.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(`${API}/contrats-ccpa/${contrat.id}/pdf`, '_blank')}
                            title="Voir le PDF"
                            data-testid={`view-pdf-${contrat.id}`}
                          >
                            <FileDown className="w-4 h-4 text-red-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(contrat)}
                            data-testid={`edit-contrat-${contrat.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          {contrat.statut === "brouillon" && docusignStatus?.authenticated && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDocuSignDialog(contrat)}
                              className="text-blue-600 hover:text-blue-700"
                              data-testid={`send-docusign-${contrat.id}`}
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setContratToDelete(contrat);
                              setDeleteDialogOpen(true);
                            }}
                            data-testid={`delete-contrat-${contrat.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
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

      {/* Create Contract Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Barlow_Condensed'] text-2xl">
              Créer un contrat CCPA
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Sélectionnez un chantier pour créer un contrat CCPA. Les informations du client 
              et les tarifs seront automatiquement pré-remplis.
            </p>
            <div>
              <Label>Chantier *</Label>
              <Select value={selectedChantierId} onValueChange={setSelectedChantierId}>
                <SelectTrigger data-testid="select-chantier-for-contrat">
                  <SelectValue placeholder="Sélectionner un chantier" />
                </SelectTrigger>
                <SelectContent>
                  {chantiersWithoutContract.map((chantier) => (
                    <SelectItem key={chantier.id} value={chantier.id}>
                      {chantier.reference} - {chantier.client_nom || "Client"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreateContrat}
              className="bg-[#1A4D2E] hover:bg-[#143d24]"
              disabled={!selectedChantierId}
              data-testid="confirm-create-contrat-btn"
            >
              Créer le contrat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DocuSign Send Dialog */}
      <Dialog open={docusignDialogOpen} onOpenChange={setDocusignDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Barlow_Condensed'] text-2xl flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" />
              Envoyer pour signature
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Le contrat <strong>{docusignContrat?.numero_contrat}</strong> sera envoyé par DocuSign 
              pour signature électronique.
            </p>
            <div>
              <Label>Email du signataire *</Label>
              <Input
                type="email"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                placeholder="client@email.fr"
                data-testid="docusign-signer-email"
              />
            </div>
            <div>
              <Label>Nom du signataire *</Label>
              <Input
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Nom complet"
                data-testid="docusign-signer-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocusignDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSendDocuSign}
              disabled={sendingDocusign || !signerEmail || !signerName}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="confirm-send-docusign-btn"
            >
              {sendingDocusign ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contract Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="font-['Barlow_Condensed'] text-2xl">
              Modifier le contrat {editingContrat?.numero_contrat}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="grid gap-4 py-4">
              {/* Informations client */}
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Informations du client (Donneuse d'ordres)
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom du client *</Label>
                  <Input
                    value={form.client_nom}
                    onChange={(e) => setForm({ ...form, client_nom: e.target.value })}
                    placeholder="Raison sociale"
                    data-testid="contrat-client-nom-input"
                  />
                </div>
                <div>
                  <Label>Interlocuteur</Label>
                  <Input
                    value={form.client_interlocuteur}
                    onChange={(e) => setForm({ ...form, client_interlocuteur: e.target.value })}
                    placeholder="Nom du contact"
                    data-testid="contrat-interlocuteur-input"
                  />
                </div>
              </div>

              <div>
                <Label>Adresse</Label>
                <Input
                  value={form.client_adresse}
                  onChange={(e) => setForm({ ...form, client_adresse: e.target.value })}
                  placeholder="Adresse complète"
                  data-testid="contrat-adresse-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.client_email}
                    onChange={(e) => setForm({ ...form, client_email: e.target.value })}
                    placeholder="email@client.fr"
                    data-testid="contrat-email-input"
                  />
                </div>
                <div>
                  <Label>Téléphone</Label>
                  <Input
                    value={form.client_telephone}
                    onChange={(e) => setForm({ ...form, client_telephone: e.target.value })}
                    placeholder="01 23 45 67 89"
                    data-testid="contrat-telephone-input"
                  />
                </div>
              </div>

              <Separator className="my-2" />

              {/* Tarification */}
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Tarification
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Prix unitaire (€HT)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.prix_unitaire}
                    onChange={(e) => setForm({ ...form, prix_unitaire: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    data-testid="contrat-prix-input"
                  />
                </div>
                <div>
                  <Label>Unité de facturation</Label>
                  <Select
                    value={form.unite_facturation}
                    onValueChange={(value) => setForm({ ...form, unite_facturation: value })}
                  >
                    <SelectTrigger data-testid="contrat-unite-select">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="heure effectuée">heure effectuée</SelectItem>
                      <SelectItem value="tonne transportée">tonne transportée</SelectItem>
                      <SelectItem value="m³ transporté">m³ transporté</SelectItem>
                      <SelectItem value="journée effectuée">journée effectuée</SelectItem>
                      <SelectItem value="rotation effectuée">rotation effectuée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="my-2" />

              {/* Date signature */}
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Signature
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date de signature</Label>
                  <Input
                    type="date"
                    value={form.date_signature}
                    onChange={(e) => setForm({ ...form, date_signature: e.target.value })}
                    data-testid="contrat-date-signature-input"
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleUpdateContrat}
              className="bg-[#1A4D2E] hover:bg-[#143d24]"
              data-testid="contrat-submit-btn"
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Contract Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="font-['Barlow_Condensed'] text-2xl flex items-center gap-2">
              <FileSignature className="w-6 h-6 text-[#D9A520]" />
              Contrat {viewingContrat?.numero_contrat}
            </DialogTitle>
          </DialogHeader>
          {viewingContrat && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-6 pr-4">
                {/* En-tête du contrat */}
                <div className="text-center border-b pb-4">
                  <h2 className="text-xl font-bold text-[#1A4D2E]">
                    CONTRAT CADRE DE PRESTATIONS AGRICOLES
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    N° {viewingContrat.numero_contrat}
                  </p>
                </div>

                {/* DocuSign Status */}
                {viewingContrat.docusign_envelope_id && (
                  <div className={`p-3 rounded-lg flex items-center justify-between ${
                    viewingContrat.docusign_status === 'completed' ? 'bg-green-50 border border-green-200' :
                    viewingContrat.docusign_status === 'declined' ? 'bg-red-50 border border-red-200' :
                    'bg-blue-50 border border-blue-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        DocuSign: {docusignStatusConfig[viewingContrat.docusign_status]?.label || viewingContrat.docusign_status}
                      </span>
                      {viewingContrat.docusign_signer_email && (
                        <span className="text-sm text-muted-foreground">
                          ({viewingContrat.docusign_signer_email})
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => syncDocuSignStatus(viewingContrat.id)}
                      disabled={syncingStatus}
                    >
                      <RefreshCw className={`w-4 h-4 mr-1 ${syncingStatus ? 'animate-spin' : ''}`} />
                      Actualiser
                    </Button>
                  </div>
                )}

                {/* Info entreprise et client */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-[#1A4D2E]/5 p-4 rounded-lg">
                    <h4 className="font-semibold text-sm text-[#1A4D2E] mb-2">PRESTATAIRE DE SERVICES</h4>
                    <p className="font-medium">TERRE DE BEAUCE LOCATION (SASU)</p>
                    <p className="text-sm text-muted-foreground">Ferme de Mennessard</p>
                    <p className="text-sm text-muted-foreground">91660 Le Mérévillois</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-sm text-amber-800 mb-2">DONNEUSE D'ORDRES</h4>
                    <p className="font-medium">{viewingContrat.client_nom || "-"}</p>
                    {viewingContrat.client_interlocuteur && (
                      <p className="text-sm">Contact: {viewingContrat.client_interlocuteur}</p>
                    )}
                    <p className="text-sm text-muted-foreground">{viewingContrat.client_adresse || "-"}</p>
                    {viewingContrat.client_email && (
                      <p className="text-sm text-muted-foreground">{viewingContrat.client_email}</p>
                    )}
                    {viewingContrat.client_telephone && (
                      <p className="text-sm text-muted-foreground">{viewingContrat.client_telephone}</p>
                    )}
                  </div>
                </div>

                {/* Conditions */}
                <div className="space-y-4">
                  <h4 className="font-semibold border-b pb-1">Prestations</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Type de transport:</span>
                      <p className="font-medium capitalize">{viewingContrat.transport_type}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Carburant:</span>
                      <p className={`font-medium ${viewingContrat.gasoil_fourni ? 'text-green-600' : 'text-orange-600'}`}>
                        {viewingContrat.gasoil_fourni 
                          ? "Fourni par la Donneuse d'ordres" 
                          : "Non fourni (à charge du Prestataire)"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Prix */}
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Prix</h4>
                  <p>
                    Toutes les prestations seront facturées au tarif de{" "}
                    <span className="font-bold text-[#1A4D2E] text-lg">
                      {viewingContrat.prix_unitaire || "..."} €HT
                    </span>{" "}
                    par{" "}
                    <span className="font-medium">
                      {viewingContrat.unite_facturation || "..."}
                    </span>
                  </p>
                </div>

                {/* Modalités */}
                <div className="text-sm text-muted-foreground space-y-2">
                  <h4 className="font-semibold text-foreground">Modalités de paiement</h4>
                  <p>Les factures sont payables sous 30 jours à compter de la date d'envoi de la facture par mail.</p>
                </div>

                {/* Statut et dates */}
                <div className="flex items-center justify-between border-t pt-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Statut:</span>
                    <Badge className={`ml-2 ${statusConfig[viewingContrat.statut]?.class} border`}>
                      {statusConfig[viewingContrat.statut]?.label}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Créé le {viewingContrat.date_creation ? new Date(viewingContrat.date_creation).toLocaleDateString("fr-FR") : "-"}
                    {viewingContrat.date_signature && (
                      <> • Signé le {new Date(viewingContrat.date_signature).toLocaleDateString("fr-FR")}</>
                    )}
                  </div>
                </div>

                {/* Actions rapides */}
                <div className="flex gap-2 border-t pt-4">
                  {viewingContrat.statut === "brouillon" && !viewingContrat.docusign_envelope_id && docusignStatus?.authenticated && (
                    <Button
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        setViewDialogOpen(false);
                        openDocuSignDialog(viewingContrat);
                      }}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Envoyer pour signature
                    </Button>
                  )}
                  {viewingContrat.statut === "brouillon" && !docusignStatus?.authenticated && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        updateStatut(viewingContrat.id, "envoye");
                        setViewDialogOpen(false);
                      }}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Marquer comme envoyé
                    </Button>
                  )}
                  {viewingContrat.statut === "envoye" && (
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        updateStatut(viewingContrat.id, "signe");
                        setViewDialogOpen(false);
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Marquer comme signé
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setViewDialogOpen(false);
                      openEditDialog(viewingContrat);
                    }}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le contrat{" "}
              <strong>{contratToDelete?.numero_contrat}</strong> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              data-testid="confirm-delete-contrat-btn"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
