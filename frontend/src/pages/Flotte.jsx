import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Truck,
  Container,
  Droplets,
  Box,
  Plus,
  Pencil,
  Trash2,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusConfig = {
  disponible: { label: "Disponible", class: "bg-green-100 text-green-700 border-green-200" },
  en_mission: { label: "En mission", class: "bg-blue-100 text-blue-700 border-blue-200" },
  maintenance: { label: "Maintenance", class: "bg-amber-100 text-amber-700 border-amber-200" },
};

const equipmentTypeConfig = {
  remorque: { label: "Remorque", icon: Container, color: "bg-[#1A4D2E]" },
  citerne: { label: "Citerne", icon: Droplets, color: "bg-blue-600" },
  benne: { label: "Benne TP", icon: Box, color: "bg-amber-600" },
};

export default function Flotte() {
  const [tracteurs, setTracteurs] = useState([]);
  const [equipements, setEquipements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("tracteurs");
  
  // Dialog states
  const [tracteurDialogOpen, setTracteurDialogOpen] = useState(false);
  const [equipementDialogOpen, setEquipementDialogOpen] = useState(false);
  const [editingTracteur, setEditingTracteur] = useState(null);
  const [editingEquipement, setEditingEquipement] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Form states
  const [tracteurForm, setTracteurForm] = useState({
    identifiant: "",
    marque: "",
    modele: "",
    immatriculation: "",
    annee: "",
    statut: "disponible",
    notes: "",
  });

  const [equipementForm, setEquipementForm] = useState({
    numero: "",
    type: "remorque",
    capacite: "",
    marque: "",
    immatriculation: "",
    statut: "disponible",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tracteursRes, equipementsRes] = await Promise.all([
        axios.get(`${API}/tracteurs`),
        axios.get(`${API}/equipements`),
      ]);
      setTracteurs(tracteursRes.data);
      setEquipements(equipementsRes.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  // Tracteur handlers
  const handleTracteurSubmit = async () => {
    try {
      const data = {
        ...tracteurForm,
        annee: tracteurForm.annee ? parseInt(tracteurForm.annee) : null,
      };
      
      if (editingTracteur) {
        await axios.put(`${API}/tracteurs/${editingTracteur.id}`, data);
        toast.success("Tracteur modifié avec succès");
      } else {
        await axios.post(`${API}/tracteurs`, data);
        toast.success("Tracteur ajouté avec succès");
      }
      setTracteurDialogOpen(false);
      resetTracteurForm();
      fetchData();
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const openEditTracteur = (tracteur) => {
    setEditingTracteur(tracteur);
    setTracteurForm({
      identifiant: tracteur.identifiant,
      marque: tracteur.marque,
      modele: tracteur.modele,
      immatriculation: tracteur.immatriculation,
      annee: tracteur.annee?.toString() || "",
      statut: tracteur.statut,
      notes: tracteur.notes || "",
    });
    setTracteurDialogOpen(true);
  };

  const resetTracteurForm = () => {
    setEditingTracteur(null);
    setTracteurForm({
      identifiant: "",
      marque: "",
      modele: "",
      immatriculation: "",
      annee: "",
      statut: "disponible",
      notes: "",
    });
  };

  // Equipement handlers
  const handleEquipementSubmit = async () => {
    try {
      if (editingEquipement) {
        await axios.put(`${API}/equipements/${editingEquipement.id}`, equipementForm);
        toast.success("Équipement modifié avec succès");
      } else {
        await axios.post(`${API}/equipements`, equipementForm);
        toast.success("Équipement ajouté avec succès");
      }
      setEquipementDialogOpen(false);
      resetEquipementForm();
      fetchData();
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const openEditEquipement = (equipement) => {
    setEditingEquipement(equipement);
    setEquipementForm({
      numero: equipement.numero,
      type: equipement.type,
      capacite: equipement.capacite || "",
      marque: equipement.marque || "",
      immatriculation: equipement.immatriculation || "",
      statut: equipement.statut,
      notes: equipement.notes || "",
    });
    setEquipementDialogOpen(true);
  };

  const resetEquipementForm = () => {
    setEditingEquipement(null);
    setEquipementForm({
      numero: "",
      type: "remorque",
      capacite: "",
      marque: "",
      immatriculation: "",
      statut: "disponible",
      notes: "",
    });
  };

  // Delete handler
  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === "tracteur") {
        await axios.delete(`${API}/tracteurs/${itemToDelete.id}`);
        toast.success("Tracteur supprimé");
      } else {
        await axios.delete(`${API}/equipements/${itemToDelete.id}`);
        toast.success("Équipement supprimé");
      }
      fetchData();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  // Filter data
  const filteredTracteurs = tracteurs.filter(
    (t) =>
      t.identifiant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.marque.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.immatriculation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFilteredEquipements = (type) =>
    equipements.filter(
      (e) =>
        e.type === type &&
        (e.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (e.marque && e.marque.toLowerCase().includes(searchTerm.toLowerCase())))
    );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A4D2E]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="flotte-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-['Barlow_Condensed'] tracking-tight">
            Gestion de la Flotte
          </h1>
          <p className="text-muted-foreground mt-1">
            Tracteurs, remorques, citernes et bennes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
              data-testid="search-input"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border">
          <TabsTrigger value="tracteurs" className="gap-2" data-testid="tab-tracteurs">
            <Truck className="w-4 h-4" />
            Tracteurs ({tracteurs.length})
          </TabsTrigger>
          <TabsTrigger value="remorques" className="gap-2" data-testid="tab-remorques">
            <Container className="w-4 h-4" />
            Remorques ({equipements.filter((e) => e.type === "remorque").length})
          </TabsTrigger>
          <TabsTrigger value="citernes" className="gap-2" data-testid="tab-citernes">
            <Droplets className="w-4 h-4" />
            Citernes ({equipements.filter((e) => e.type === "citerne").length})
          </TabsTrigger>
          <TabsTrigger value="bennes" className="gap-2" data-testid="tab-bennes">
            <Box className="w-4 h-4" />
            Bennes TP ({equipements.filter((e) => e.type === "benne").length})
          </TabsTrigger>
        </TabsList>

        {/* Tracteurs Tab */}
        <TabsContent value="tracteurs">
          <Card>
            <CardHeader className="border-b flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-['Barlow_Condensed']">
                Liste des tracteurs
              </CardTitle>
              <Button
                onClick={() => {
                  resetTracteurForm();
                  setTracteurDialogOpen(true);
                }}
                className="bg-[#1A4D2E] hover:bg-[#143d24]"
                data-testid="add-tracteur-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un tracteur
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {filteredTracteurs.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Aucun tracteur enregistré</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">ID</TableHead>
                      <TableHead>Marque / Modèle</TableHead>
                      <TableHead>Immatriculation</TableHead>
                      <TableHead>Année</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTracteurs.map((tracteur) => (
                      <TableRow key={tracteur.id} data-testid={`tracteur-row-${tracteur.id}`}>
                        <TableCell>
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#1A4D2E] text-white font-bold text-lg">
                            {tracteur.identifiant}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{tracteur.marque}</p>
                            <p className="text-sm text-muted-foreground">{tracteur.modele}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{tracteur.immatriculation}</TableCell>
                        <TableCell>{tracteur.annee || "-"}</TableCell>
                        <TableCell>
                          <Badge className={`${statusConfig[tracteur.statut].class} border`}>
                            {statusConfig[tracteur.statut].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditTracteur(tracteur)}
                              data-testid={`edit-tracteur-${tracteur.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setItemToDelete({ type: "tracteur", id: tracteur.id, name: tracteur.identifiant });
                                setDeleteDialogOpen(true);
                              }}
                              data-testid={`delete-tracteur-${tracteur.id}`}
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
        </TabsContent>

        {/* Equipment Tabs (Remorques, Citernes, Bennes) */}
        {["remorques", "citernes", "bennes"].map((tabType) => {
          const equipType = tabType === "remorques" ? "remorque" : tabType === "citernes" ? "citerne" : "benne";
          const config = equipmentTypeConfig[equipType];
          const filtered = getFilteredEquipements(equipType);

          return (
            <TabsContent key={tabType} value={tabType}>
              <Card>
                <CardHeader className="border-b flex flex-row items-center justify-between">
                  <CardTitle className="text-xl font-['Barlow_Condensed']">
                    Liste des {tabType}
                  </CardTitle>
                  <Button
                    onClick={() => {
                      resetEquipementForm();
                      setEquipementForm((prev) => ({ ...prev, type: equipType }));
                      setEquipementDialogOpen(true);
                    }}
                    className="bg-[#1A4D2E] hover:bg-[#143d24]"
                    data-testid={`add-${equipType}-btn`}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {filtered.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                      <config.icon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Aucun(e) {config.label.toLowerCase()} enregistré(e)</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">N°</TableHead>
                          <TableHead>Marque</TableHead>
                          <TableHead>Capacité</TableHead>
                          <TableHead>Immatriculation</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((equip) => (
                          <TableRow key={equip.id} data-testid={`${equipType}-row-${equip.id}`}>
                            <TableCell>
                              <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${config.color} text-white font-bold`}>
                                {equip.numero}
                              </span>
                            </TableCell>
                            <TableCell>{equip.marque || "-"}</TableCell>
                            <TableCell>{equip.capacite || "-"}</TableCell>
                            <TableCell className="font-mono">{equip.immatriculation || "-"}</TableCell>
                            <TableCell>
                              <Badge className={`${statusConfig[equip.statut].class} border`}>
                                {statusConfig[equip.statut].label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditEquipement(equip)}
                                  data-testid={`edit-${equipType}-${equip.id}`}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setItemToDelete({ type: "equipement", id: equip.id, name: equip.numero });
                                    setDeleteDialogOpen(true);
                                  }}
                                  data-testid={`delete-${equipType}-${equip.id}`}
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
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Tracteur Dialog */}
      <Dialog open={tracteurDialogOpen} onOpenChange={setTracteurDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Barlow_Condensed'] text-2xl">
              {editingTracteur ? "Modifier le tracteur" : "Ajouter un tracteur"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="identifiant">Identifiant (lettre)</Label>
                <Input
                  id="identifiant"
                  value={tracteurForm.identifiant}
                  onChange={(e) => setTracteurForm({ ...tracteurForm, identifiant: e.target.value.toUpperCase() })}
                  placeholder="A, B, C..."
                  maxLength={2}
                  data-testid="tracteur-identifiant-input"
                />
              </div>
              <div>
                <Label htmlFor="annee">Année</Label>
                <Input
                  id="annee"
                  type="number"
                  value={tracteurForm.annee}
                  onChange={(e) => setTracteurForm({ ...tracteurForm, annee: e.target.value })}
                  placeholder="2020"
                  data-testid="tracteur-annee-input"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="marque">Marque</Label>
              <Input
                id="marque"
                value={tracteurForm.marque}
                onChange={(e) => setTracteurForm({ ...tracteurForm, marque: e.target.value })}
                placeholder="John Deere, Fendt..."
                data-testid="tracteur-marque-input"
              />
            </div>
            <div>
              <Label htmlFor="modele">Modèle</Label>
              <Input
                id="modele"
                value={tracteurForm.modele}
                onChange={(e) => setTracteurForm({ ...tracteurForm, modele: e.target.value })}
                placeholder="6R 250"
                data-testid="tracteur-modele-input"
              />
            </div>
            <div>
              <Label htmlFor="immatriculation">Immatriculation</Label>
              <Input
                id="immatriculation"
                value={tracteurForm.immatriculation}
                onChange={(e) => setTracteurForm({ ...tracteurForm, immatriculation: e.target.value })}
                placeholder="AB-123-CD"
                data-testid="tracteur-immat-input"
              />
            </div>
            <div>
              <Label htmlFor="statut">Statut</Label>
              <Select
                value={tracteurForm.statut}
                onValueChange={(value) => setTracteurForm({ ...tracteurForm, statut: value })}
              >
                <SelectTrigger data-testid="tracteur-statut-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="en_mission">En mission</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={tracteurForm.notes}
                onChange={(e) => setTracteurForm({ ...tracteurForm, notes: e.target.value })}
                placeholder="Notes additionnelles..."
                data-testid="tracteur-notes-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTracteurDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleTracteurSubmit}
              className="bg-[#1A4D2E] hover:bg-[#143d24]"
              data-testid="tracteur-submit-btn"
            >
              {editingTracteur ? "Modifier" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Equipement Dialog */}
      <Dialog open={equipementDialogOpen} onOpenChange={setEquipementDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Barlow_Condensed'] text-2xl">
              {editingEquipement ? "Modifier l'équipement" : "Ajouter un équipement"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numero">Numéro</Label>
                <Input
                  id="numero"
                  value={equipementForm.numero}
                  onChange={(e) => setEquipementForm({ ...equipementForm, numero: e.target.value })}
                  placeholder="1, 2, 3..."
                  data-testid="equipement-numero-input"
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={equipementForm.type}
                  onValueChange={(value) => setEquipementForm({ ...equipementForm, type: value })}
                >
                  <SelectTrigger data-testid="equipement-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remorque">Remorque</SelectItem>
                    <SelectItem value="citerne">Citerne</SelectItem>
                    <SelectItem value="benne">Benne TP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="eq-marque">Marque</Label>
              <Input
                id="eq-marque"
                value={equipementForm.marque}
                onChange={(e) => setEquipementForm({ ...equipementForm, marque: e.target.value })}
                placeholder="Marque"
                data-testid="equipement-marque-input"
              />
            </div>
            <div>
              <Label htmlFor="capacite">Capacité</Label>
              <Input
                id="capacite"
                value={equipementForm.capacite}
                onChange={(e) => setEquipementForm({ ...equipementForm, capacite: e.target.value })}
                placeholder="25T, 30m³..."
                data-testid="equipement-capacite-input"
              />
            </div>
            <div>
              <Label htmlFor="eq-immat">Immatriculation</Label>
              <Input
                id="eq-immat"
                value={equipementForm.immatriculation}
                onChange={(e) => setEquipementForm({ ...equipementForm, immatriculation: e.target.value })}
                placeholder="AB-123-CD"
                data-testid="equipement-immat-input"
              />
            </div>
            <div>
              <Label htmlFor="eq-statut">Statut</Label>
              <Select
                value={equipementForm.statut}
                onValueChange={(value) => setEquipementForm({ ...equipementForm, statut: value })}
              >
                <SelectTrigger data-testid="equipement-statut-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="en_mission">En mission</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="eq-notes">Notes</Label>
              <Textarea
                id="eq-notes"
                value={equipementForm.notes}
                onChange={(e) => setEquipementForm({ ...equipementForm, notes: e.target.value })}
                placeholder="Notes additionnelles..."
                data-testid="equipement-notes-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEquipementDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleEquipementSubmit}
              className="bg-[#1A4D2E] hover:bg-[#143d24]"
              data-testid="equipement-submit-btn"
            >
              {editingEquipement ? "Modifier" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer {itemToDelete?.type === "tracteur" ? "le tracteur" : "l'équipement"}{" "}
              <strong>{itemToDelete?.name}</strong> ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              data-testid="confirm-delete-btn"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
