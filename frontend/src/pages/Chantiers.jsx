import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  HardHat,
  Plus,
  Pencil,
  Trash2,
  Search,
  MapPin,
  Calendar,
  Users,
  Truck,
  Container,
  Eye,
  Euro,
  FileText,
  Droplets,
  Box,
  Fuel,
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
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusConfig = {
  planifie: { label: "Planifié", class: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  en_cours: { label: "En cours", class: "bg-green-100 text-green-700 border-green-200" },
  termine: { label: "Terminé", class: "bg-slate-100 text-slate-600 border-slate-200" },
  annule: { label: "Annulé", class: "bg-red-100 text-red-700 border-red-200" },
};

const methodeLabels = {
  heure: "À l'heure",
  tonne: "Au tonnage",
  journee: "Forfait jour",
};

export default function Chantiers() {
  const [chantiers, setChantiers] = useState([]);
  const [clients, setClients] = useState([]);
  const [tracteurs, setTracteurs] = useState([]);
  const [equipements, setEquipements] = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editingChantier, setEditingChantier] = useState(null);
  const [viewingChantier, setViewingChantier] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chantierToDelete, setChantierToDelete] = useState(null);
  const [recapData, setRecapData] = useState(null);

  const [form, setForm] = useState({
    reference: "",
    client_id: "",
    lieu: "",
    description: "",
    date_debut: "",
    date_fin: "",
    statut: "planifie",
    affectations: [],
    tarifs: [],
    transport_type: "solide",
    avec_gasoil: true,
    notes: "",
  });

  const [newAffectation, setNewAffectation] = useState({
    tracteur_id: "",
    equipement_id: "",
    chauffeur_id: "",
  });

  const [newTarif, setNewTarif] = useState({
    methode: "",
    prix_unitaire: "",
    description: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [chantiersRes, clientsRes, tracteursRes, equipementsRes, chauffeursRes] = await Promise.all([
        axios.get(`${API}/chantiers`),
        axios.get(`${API}/clients`),
        axios.get(`${API}/tracteurs`),
        axios.get(`${API}/equipements`),
        axios.get(`${API}/chauffeurs`),
      ]);
      setChantiers(chantiersRes.data);
      setClients(clientsRes.data);
      setTracteurs(tracteursRes.data);
      setEquipements(equipementsRes.data);
      setChauffeurs(chauffeursRes.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingChantier) {
        await axios.put(`${API}/chantiers/${editingChantier.id}`, form);
        toast.success("Chantier modifié avec succès");
      } else {
        await axios.post(`${API}/chantiers`, form);
        toast.success("Chantier créé avec succès");
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleClientChange = (clientId) => {
    setForm({ ...form, client_id: clientId });
    // Auto-fill tarifs from client
    const client = clients.find(c => c.id === clientId);
    if (client?.tarifs && client.tarifs.length > 0 && form.tarifs.length === 0) {
      setForm(prev => ({ ...prev, client_id: clientId, tarifs: client.tarifs }));
    }
  };

  const addAffectation = () => {
    if (!newAffectation.tracteur_id || !newAffectation.equipement_id || !newAffectation.chauffeur_id) {
      toast.error("Veuillez sélectionner un tracteur, un équipement et un chauffeur");
      return;
    }
    
    const tracteur = tracteurs.find(t => t.id === newAffectation.tracteur_id);
    const equipement = equipements.find(e => e.id === newAffectation.equipement_id);
    const chauffeur = chauffeurs.find(c => c.id === newAffectation.chauffeur_id);
    
    setForm({
      ...form,
      affectations: [
        ...form.affectations,
        {
          ...newAffectation,
          tracteur_identifiant: tracteur?.identifiant,
          equipement_numero: equipement?.numero,
          equipement_type: equipement?.type,
          chauffeur_nom: `${chauffeur?.prenom} ${chauffeur?.nom}`,
        },
      ],
    });
    setNewAffectation({ tracteur_id: "", equipement_id: "", chauffeur_id: "" });
  };

  const removeAffectation = (index) => {
    setForm({
      ...form,
      affectations: form.affectations.filter((_, i) => i !== index),
    });
  };

  const addTarif = () => {
    if (!newTarif.methode || !newTarif.prix_unitaire) {
      toast.error("Veuillez sélectionner une méthode et un prix");
      return;
    }
    setForm({
      ...form,
      tarifs: [
        ...form.tarifs,
        {
          methode: newTarif.methode,
          prix_unitaire: parseFloat(newTarif.prix_unitaire),
          description: newTarif.description,
        },
      ],
    });
    setNewTarif({ methode: "", prix_unitaire: "", description: "" });
  };

  const removeTarif = (index) => {
    setForm({
      ...form,
      tarifs: form.tarifs.filter((_, i) => i !== index),
    });
  };

  const openEditDialog = (chantier) => {
    setEditingChantier(chantier);
    setForm({
      reference: chantier.reference,
      client_id: chantier.client_id,
      lieu: chantier.lieu,
      description: chantier.description || "",
      date_debut: chantier.date_debut,
      date_fin: chantier.date_fin || "",
      statut: chantier.statut,
      affectations: chantier.affectations || [],
      tarifs: chantier.tarifs || [],
      transport_type: chantier.transport_type || "solide",
      avec_gasoil: chantier.avec_gasoil !== undefined ? chantier.avec_gasoil : true,
      notes: chantier.notes || "",
    });
    setDialogOpen(true);
  };

  const openDetailDialog = async (chantier) => {
    setViewingChantier(chantier);
    // Fetch recap data
    try {
      const res = await axios.get(`${API}/chantiers/${chantier.id}/recap`);
      setRecapData(res.data);
    } catch (error) {
      setRecapData(null);
    }
    setDetailDialogOpen(true);
  };

  const resetForm = () => {
    setEditingChantier(null);
    setForm({
      reference: "",
      client_id: "",
      lieu: "",
      description: "",
      date_debut: "",
      date_fin: "",
      statut: "planifie",
      affectations: [],
      tarifs: [],
      transport_type: "solide",
      avec_gasoil: true,
      notes: "",
    });
    setNewAffectation({ tracteur_id: "", equipement_id: "", chauffeur_id: "" });
    setNewTarif({ methode: "", prix_unitaire: "", description: "" });
  };

  const handleDelete = async () => {
    if (!chantierToDelete) return;
    try {
      await axios.delete(`${API}/chantiers/${chantierToDelete.id}`);
      toast.success("Chantier supprimé");
      fetchData();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteDialogOpen(false);
      setChantierToDelete(null);
    }
  };

  const filteredChantiers = chantiers.filter((c) => {
    const matchesSearch =
      c.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.lieu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.client_nom && c.client_nom.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || c.statut === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getEquipmentIcon = (type) => {
    switch (type) {
      case "citerne": return <Droplets className="w-4 h-4 text-blue-600" />;
      case "benne": return <Box className="w-4 h-4 text-amber-600" />;
      default: return <Container className="w-4 h-4 text-[#D9A520]" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A4D2E]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="chantiers-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-['Barlow_Condensed'] tracking-tight">
            Gestion des Chantiers
          </h1>
          <p className="text-muted-foreground mt-1">
            {chantiers.filter((c) => c.statut === "en_cours").length} en cours •{" "}
            {chantiers.filter((c) => c.statut === "planifie").length} planifiés
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
              data-testid="search-chantier-input"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36" data-testid="status-filter-select">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="planifie">Planifiés</SelectItem>
              <SelectItem value="en_cours">En cours</SelectItem>
              <SelectItem value="termine">Terminés</SelectItem>
              <SelectItem value="annule">Annulés</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            className="bg-[#1A4D2E] hover:bg-[#143d24]"
            data-testid="add-chantier-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau chantier
          </Button>
        </div>
      </div>

      {/* Chantiers Table */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-xl font-['Barlow_Condensed'] flex items-center gap-2">
            <HardHat className="w-5 h-5 text-[#D9A520]" />
            Liste des chantiers
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredChantiers.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <HardHat className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun chantier trouvé</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Lieu</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Affectation</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChantiers.map((chantier) => (
                  <TableRow key={chantier.id} data-testid={`chantier-row-${chantier.id}`}>
                    <TableCell>
                      <span className="font-medium">{chantier.reference}</span>
                    </TableCell>
                    <TableCell>{chantier.client_nom || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                        {chantier.lieu}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="capitalize w-fit">
                          {chantier.transport_type === "liquide" ? (
                            <><Droplets className="w-3 h-3 mr-1" /> Liquide</>
                          ) : (
                            <><Container className="w-3 h-3 mr-1" /> Solide</>
                          )}
                        </Badge>
                        <span className={`text-xs flex items-center gap-1 ${chantier.avec_gasoil !== false ? 'text-green-600' : 'text-orange-600'}`}>
                          <Fuel className="w-3 h-3" />
                          {chantier.avec_gasoil !== false ? "Gasoil fourni" : "Sans gasoil"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {new Date(chantier.date_debut).toLocaleDateString("fr-FR")}
                      </div>
                    </TableCell>
                    <TableCell>
                      {chantier.affectations?.length > 0 ? (
                        <div className="flex items-center gap-1">
                          {chantier.affectations.slice(0, 1).map((aff, idx) => (
                            <div key={idx} className="flex items-center gap-1 text-xs">
                              <Badge variant="outline" className="gap-1">
                                <Truck className="w-3 h-3" />
                                {aff.tracteur_identifiant}
                              </Badge>
                              <span>+</span>
                              <Badge variant="outline" className="gap-1">
                                {getEquipmentIcon(aff.equipement_type)}
                                {aff.equipement_numero}
                              </Badge>
                            </div>
                          ))}
                          {chantier.affectations.length > 1 && (
                            <span className="text-xs text-muted-foreground">
                              +{chantier.affectations.length - 1}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusConfig[chantier.statut].class} border`}>
                        {statusConfig[chantier.statut].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDetailDialog(chantier)}
                          data-testid={`view-chantier-${chantier.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(chantier)}
                          data-testid={`edit-chantier-${chantier.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setChantierToDelete(chantier);
                            setDeleteDialogOpen(true);
                          }}
                          data-testid={`delete-chantier-${chantier.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Chantier Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="font-['Barlow_Condensed'] text-2xl">
              {editingChantier ? "Modifier le chantier" : "Nouveau chantier"}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="grid gap-4 py-4">
              {/* Informations générales */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reference">Référence *</Label>
                  <Input
                    id="reference"
                    value={form.reference}
                    onChange={(e) => setForm({ ...form, reference: e.target.value })}
                    placeholder="CH-2024-001"
                    data-testid="chantier-reference-input"
                  />
                </div>
                <div>
                  <Label htmlFor="client">Client *</Label>
                  <Select
                    value={form.client_id}
                    onValueChange={handleClientChange}
                  >
                    <SelectTrigger data-testid="chantier-client-select">
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.raison_sociale}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lieu">Lieu du chantier *</Label>
                  <Input
                    id="lieu"
                    value={form.lieu}
                    onChange={(e) => setForm({ ...form, lieu: e.target.value })}
                    placeholder="Adresse ou lieu-dit"
                    data-testid="chantier-lieu-input"
                  />
                </div>
                <div>
                  <Label>Type de transport</Label>
                  <Select
                    value={form.transport_type}
                    onValueChange={(value) => setForm({ ...form, transport_type: value })}
                  >
                    <SelectTrigger data-testid="chantier-transport-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solide">
                        <div className="flex items-center gap-2">
                          <Container className="w-4 h-4" /> Solide (remorque/benne)
                        </div>
                      </SelectItem>
                      <SelectItem value="liquide">
                        <div className="flex items-center gap-2">
                          <Droplets className="w-4 h-4" /> Liquide (citerne)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Option Gasoil */}
              <div className="flex items-center space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <Checkbox
                  id="avec_gasoil"
                  checked={form.avec_gasoil}
                  onCheckedChange={(checked) => setForm({ ...form, avec_gasoil: checked })}
                  data-testid="chantier-gasoil-checkbox"
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="avec_gasoil"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                  >
                    <Fuel className="w-4 h-4 text-amber-600" />
                    Gasoil fourni par l'entreprise
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {form.avec_gasoil 
                      ? "Le barème 'avec gasoil' sera utilisé pour la facturation" 
                      : "Le barème 'sans gasoil' sera utilisé pour la facturation"}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description du chantier..."
                  data-testid="chantier-description-input"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="date_debut">Date début *</Label>
                  <Input
                    id="date_debut"
                    type="date"
                    value={form.date_debut}
                    onChange={(e) => setForm({ ...form, date_debut: e.target.value })}
                    data-testid="chantier-date-debut-input"
                  />
                </div>
                <div>
                  <Label htmlFor="date_fin">Date fin</Label>
                  <Input
                    id="date_fin"
                    type="date"
                    value={form.date_fin}
                    onChange={(e) => setForm({ ...form, date_fin: e.target.value })}
                    data-testid="chantier-date-fin-input"
                  />
                </div>
                <div>
                  <Label htmlFor="statut">Statut</Label>
                  <Select
                    value={form.statut}
                    onValueChange={(value) => setForm({ ...form, statut: value })}
                  >
                    <SelectTrigger data-testid="chantier-statut-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planifie">Planifié</SelectItem>
                      <SelectItem value="en_cours">En cours</SelectItem>
                      <SelectItem value="termine">Terminé</SelectItem>
                      <SelectItem value="annule">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Affectation */}
              <Separator className="my-2" />
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Affectation (Tracteur + Équipement + Chauffeur)
                </h3>

                {form.affectations.length > 0 && (
                  <div className="space-y-2">
                    {form.affectations.map((aff, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <Truck className="w-4 h-4 text-[#1A4D2E]" />
                            <span className="font-medium">{aff.tracteur_identifiant}</span>
                          </div>
                          <span className="text-muted-foreground">+</span>
                          <div className="flex items-center gap-1.5">
                            {getEquipmentIcon(aff.equipement_type)}
                            <span className="font-medium">{aff.equipement_numero}</span>
                          </div>
                          <span className="text-muted-foreground">+</span>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-slate-600" />
                            <span className="font-medium">{aff.chauffeur_nom}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAffectation(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <Label>Tracteur</Label>
                    <Select
                      value={newAffectation.tracteur_id}
                      onValueChange={(value) =>
                        setNewAffectation({ ...newAffectation, tracteur_id: value })
                      }
                    >
                      <SelectTrigger data-testid="affectation-tracteur-select">
                        <SelectValue placeholder="Tracteur" />
                      </SelectTrigger>
                      <SelectContent>
                        {tracteurs.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.identifiant} - {t.marque}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Équipement</Label>
                    <Select
                      value={newAffectation.equipement_id}
                      onValueChange={(value) =>
                        setNewAffectation({ ...newAffectation, equipement_id: value })
                      }
                    >
                      <SelectTrigger data-testid="affectation-equipement-select">
                        <SelectValue placeholder="Équipement" />
                      </SelectTrigger>
                      <SelectContent>
                        {equipements.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.numero} - {e.type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Chauffeur</Label>
                    <Select
                      value={newAffectation.chauffeur_id}
                      onValueChange={(value) =>
                        setNewAffectation({ ...newAffectation, chauffeur_id: value })
                      }
                    >
                      <SelectTrigger data-testid="affectation-chauffeur-select">
                        <SelectValue placeholder="Chauffeur" />
                      </SelectTrigger>
                      <SelectContent>
                        {chauffeurs.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.prenom} {c.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={addAffectation}
                    data-testid="add-affectation-btn"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Tarification */}
              <Separator className="my-2" />
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Euro className="w-4 h-4" />
                  Tarification du chantier
                </h3>

                {form.tarifs.length > 0 && (
                  <div className="space-y-2">
                    {form.tarifs.map((tarif, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div>
                          <span className="font-medium">{methodeLabels[tarif.methode]}</span>
                          <span className="mx-2">•</span>
                          <span className="text-[#1A4D2E] font-bold">{tarif.prix_unitaire} €</span>
                          {tarif.description && (
                            <span className="text-muted-foreground text-sm ml-2">
                              ({tarif.description})
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTarif(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <Label>Méthode</Label>
                    <Select
                      value={newTarif.methode}
                      onValueChange={(value) => setNewTarif({ ...newTarif, methode: value })}
                    >
                      <SelectTrigger data-testid="tarif-methode-select">
                        <SelectValue placeholder="Méthode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="heure">À l'heure (€/h)</SelectItem>
                        <SelectItem value="tonne">Au tonnage (€/T)</SelectItem>
                        <SelectItem value="journee">Forfait jour (€/j)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Prix (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newTarif.prix_unitaire}
                      onChange={(e) => setNewTarif({ ...newTarif, prix_unitaire: e.target.value })}
                      placeholder="0.00"
                      data-testid="tarif-prix-input"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={newTarif.description}
                      onChange={(e) => setNewTarif({ ...newTarif, description: e.target.value })}
                      placeholder="Optionnel"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={addTarif}
                    data-testid="add-tarif-btn"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Notes additionnelles..."
                  data-testid="chantier-notes-input"
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-[#1A4D2E] hover:bg-[#143d24]"
              data-testid="chantier-submit-btn"
            >
              {editingChantier ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chantier Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="font-['Barlow_Condensed'] text-2xl">
              {viewingChantier?.reference}
            </DialogTitle>
          </DialogHeader>
          {viewingChantier && (
            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Détails</TabsTrigger>
                <TabsTrigger value="recap">Récapitulatif</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground text-sm">Client</span>
                    <p className="font-medium">{viewingChantier.client_nom || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Lieu</span>
                    <p className="font-medium">{viewingChantier.lieu}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Dates</span>
                    <p className="font-medium">
                      {new Date(viewingChantier.date_debut).toLocaleDateString("fr-FR")}
                      {viewingChantier.date_fin &&
                        ` → ${new Date(viewingChantier.date_fin).toLocaleDateString("fr-FR")}`}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Statut</span>
                    <div className="mt-1">
                      <Badge className={`${statusConfig[viewingChantier.statut].class} border`}>
                        {statusConfig[viewingChantier.statut].label}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Type de transport et option gasoil */}
                <div className="flex gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">Type:</span>
                    <Badge variant="outline">
                      {viewingChantier.transport_type === "liquide" ? (
                        <><Droplets className="w-3 h-3 mr-1" /> Liquide</>
                      ) : (
                        <><Container className="w-3 h-3 mr-1" /> Solide</>
                      )}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">Gasoil:</span>
                    <Badge 
                      variant="outline" 
                      className={viewingChantier.avec_gasoil !== false ? "border-green-500 text-green-700" : "border-orange-500 text-orange-700"}
                    >
                      <Fuel className="w-3 h-3 mr-1" />
                      {viewingChantier.avec_gasoil !== false ? "Fourni" : "Non fourni"}
                    </Badge>
                  </div>
                </div>

                {viewingChantier.tarifs?.length > 0 && (
                  <div>
                    <span className="text-muted-foreground text-sm block mb-2">Tarification</span>
                    <div className="flex flex-wrap gap-2">
                      {viewingChantier.tarifs.map((tarif, idx) => (
                        <Badge key={idx} variant="outline" className="text-sm">
                          {methodeLabels[tarif.methode]}: {tarif.prix_unitaire}€
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {viewingChantier.affectations?.length > 0 && (
                  <div>
                    <span className="text-muted-foreground text-sm block mb-2">Affectations</span>
                    <div className="space-y-2">
                      {viewingChantier.affectations.map((aff, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-2 bg-muted/50 rounded"
                        >
                          <div className="flex items-center gap-1">
                            <Truck className="w-4 h-4 text-[#1A4D2E]" />
                            <span className="font-medium">{aff.tracteur_identifiant}</span>
                          </div>
                          <span className="text-muted-foreground">+</span>
                          <div className="flex items-center gap-1">
                            {getEquipmentIcon(aff.equipement_type)}
                            <span className="font-medium">{aff.equipement_numero}</span>
                          </div>
                          <span className="text-muted-foreground">+</span>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-slate-600" />
                            <span className="font-medium">{aff.chauffeur_nom}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="recap" className="space-y-4 mt-4">
                {recapData ? (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold font-['Barlow_Condensed']">
                            {recapData.total_heures?.toFixed(1)}h
                          </p>
                          <p className="text-sm text-muted-foreground">Heures</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold font-['Barlow_Condensed']">
                            {recapData.total_tonnage?.toFixed(1)}T
                          </p>
                          <p className="text-sm text-muted-foreground">Tonnage</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold font-['Barlow_Condensed']">
                            {recapData.nombre_jours}
                          </p>
                          <p className="text-sm text-muted-foreground">Jours</p>
                        </CardContent>
                      </Card>
                    </div>

                    {recapData.lignes_facture?.length > 0 && (
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Estimation facturation
                        </h4>
                        <div className="space-y-2">
                          {recapData.lignes_facture.map((ligne, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span>{ligne.description}</span>
                              <span className="font-medium">{ligne.montant_ht?.toFixed(2)} €</span>
                            </div>
                          ))}
                          <Separator />
                          <div className="flex justify-between font-bold">
                            <span>Total HT</span>
                            <span className="text-[#1A4D2E]">{recapData.montant_ht?.toFixed(2)} €</span>
                          </div>
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>TVA (20%)</span>
                            <span>{recapData.montant_tva?.toFixed(2)} €</span>
                          </div>
                          <div className="flex justify-between font-bold text-lg">
                            <span>Total TTC</span>
                            <span className="text-[#1A4D2E]">{recapData.montant_ttc?.toFixed(2)} €</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {recapData.pointages?.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        <p>Aucun pointage enregistré pour ce chantier</p>
                        <p className="text-sm">Les chauffeurs peuvent saisir leurs heures via le portail chauffeur</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Chargement du récapitulatif...
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le chantier{" "}
              <strong>{chantierToDelete?.reference}</strong> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              data-testid="confirm-delete-chantier-btn"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
