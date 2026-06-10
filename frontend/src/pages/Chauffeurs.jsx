import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  Phone,
  Mail,
  IdCard,
  Check,
  X,
  Key,
  Copy,
  Folder,
  Clock,
  CheckCircle,
  FileText,
  Download,
  ExternalLink,
  Plus,
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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

export default function Chauffeurs() {
  const [chauffeurs, setChauffeurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChauffeur, setEditingChauffeur] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chauffeurToDelete, setChauffeurToDelete] = useState(null);
  const [docsDialogOpen, setDocsDialogOpen] = useState(false);
  const [selectedChauffeurDocs, setSelectedChauffeurDocs] = useState(null);
  const [docsChauffeur, setDocsChauffeur] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [newDocForm, setNewDocForm] = useState({ nom: "", type_document: "contrat_travail", notes: "" });
  const [addingDoc, setAddingDoc] = useState(false);

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    permis: "",
    date_embauche: "",
    disponible: true,
    notes: "",
  });

  useEffect(() => {
    fetchChauffeurs();
  }, []);

  const fetchChauffeurs = async () => {
    try {
      const res = await axios.get(`${API}/chauffeurs`);
      setChauffeurs(res.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des chauffeurs");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingChauffeur) {
        await axios.put(`${API}/chauffeurs/${editingChauffeur.id}`, form);
        toast.success("Chauffeur modifié avec succès");
      } else {
        await axios.post(`${API}/chauffeurs`, form);
        toast.success("Chauffeur ajouté avec succès");
      }
      setDialogOpen(false);
      resetForm();
      fetchChauffeurs();
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const openEditDialog = (chauffeur) => {
    setEditingChauffeur(chauffeur);
    setForm({
      nom: chauffeur.nom,
      prenom: chauffeur.prenom,
      telephone: chauffeur.telephone,
      email: chauffeur.email || "",
      permis: chauffeur.permis,
      date_embauche: chauffeur.date_embauche || "",
      disponible: chauffeur.disponible,
      notes: chauffeur.notes || "",
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingChauffeur(null);
    setForm({
      nom: "",
      prenom: "",
      telephone: "",
      email: "",
      permis: "",
      date_embauche: "",
      disponible: true,
      notes: "",
    });
  };

  const handleDelete = async () => {
    if (!chauffeurToDelete) return;
    try {
      await axios.delete(`${API}/chauffeurs/${chauffeurToDelete.id}`);
      toast.success("Chauffeur supprimé");
      fetchChauffeurs();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteDialogOpen(false);
      setChauffeurToDelete(null);
    }
  };

  const filteredChauffeurs = chauffeurs.filter(
    (c) =>
      c.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.telephone.includes(searchTerm)
  );

  const openDocsDialog = async (chauffeur) => {
    setSelectedChauffeurDocs(chauffeur);
    setDocsDialogOpen(true);
    setDocsLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await axios.get(`${API}/admin/chauffeurs/${chauffeur.id}/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocsChauffeur(res.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des documents");
    } finally {
      setDocsLoading(false);
    }
  };

  const handleAddDoc = async () => {
    if (!newDocForm.nom) { toast.error("Veuillez saisir un nom de document"); return; }
    setAddingDoc(true);
    try {
      const token = localStorage.getItem("admin_token");
      await axios.post(`${API}/admin/documents-chauffeur`, {
        chauffeur_id: selectedChauffeurDocs.id,
        ...newDocForm
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Document ajouté");
      setNewDocForm({ nom: "", type_document: "contrat_travail", notes: "" });
      // Recharger
      const res = await axios.get(`${API}/admin/chauffeurs/${selectedChauffeurDocs.id}/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocsChauffeur(res.data);
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
    } finally {
      setAddingDoc(false);
    }
  };

  const handleUpdateDocStatut = async (docId, statut) => {
    try {
      const token = localStorage.getItem("admin_token");
      await axios.put(`${API}/admin/documents-chauffeur/${docId}?statut=${statut}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Statut mis à jour");
      const res = await axios.get(`${API}/admin/chauffeurs/${selectedChauffeurDocs.id}/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocsChauffeur(res.data);
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
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
    <div className="space-y-6" data-testid="chauffeurs-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-['Barlow_Condensed'] tracking-tight">
            Gestion des Chauffeurs
          </h1>
          <p className="text-muted-foreground mt-1">
            {chauffeurs.length} chauffeur(s) • {chauffeurs.filter((c) => c.disponible).length} disponible(s)
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
              data-testid="search-chauffeur-input"
            />
          </div>
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            className="bg-[#1A4D2E] hover:bg-[#143d24]"
            data-testid="add-chauffeur-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Chauffeurs Table */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-xl font-['Barlow_Condensed'] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#D9A520]" />
            Liste des chauffeurs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredChauffeurs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun chauffeur enregistré</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chauffeur</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Permis</TableHead>
                  <TableHead>Embauche</TableHead>
                  <TableHead>Code accès</TableHead>
                  <TableHead>Disponibilité</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChauffeurs.map((chauffeur) => (
                  <TableRow key={chauffeur.id} data-testid={`chauffeur-row-${chauffeur.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-medium">
                          {chauffeur.prenom[0]}{chauffeur.nom[0]}
                        </div>
                        <div>
                          <p className="font-medium">{chauffeur.prenom} {chauffeur.nom}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                          {chauffeur.telephone}
                        </div>
                        {chauffeur.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-3.5 h-3.5" />
                            {chauffeur.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <IdCard className="w-4 h-4 text-muted-foreground" />
                        {chauffeur.permis}
                      </div>
                    </TableCell>
                    <TableCell>
                      {chauffeur.date_embauche
                        ? new Date(chauffeur.date_embauche).toLocaleDateString("fr-FR")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {chauffeur.code_acces && (
                        <div className="flex items-center gap-1">
                          <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                            {chauffeur.code_acces}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              navigator.clipboard.writeText(chauffeur.code_acces);
                              toast.success("Code copié !");
                            }}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`border ${
                          chauffeur.disponible
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-red-100 text-red-700 border-red-200"
                        }`}
                      >
                        {chauffeur.disponible ? (
                          <><Check className="w-3 h-3 mr-1" /> Disponible</>
                        ) : (
                          <><X className="w-3 h-3 mr-1" /> Indisponible</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Espace documents"
                          onClick={() => openDocsDialog(chauffeur)}
                        >
                          <Folder className="w-4 h-4 text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(chauffeur)}
                          data-testid={`edit-chauffeur-${chauffeur.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setChauffeurToDelete(chauffeur);
                            setDeleteDialogOpen(true);
                          }}
                          data-testid={`delete-chauffeur-${chauffeur.id}`}
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

      {/* Chauffeur Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Barlow_Condensed'] text-2xl">
              {editingChauffeur ? "Modifier le chauffeur" : "Ajouter un chauffeur"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prenom">Prénom</Label>
                <Input
                  id="prenom"
                  value={form.prenom}
                  onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                  placeholder="Jean"
                  data-testid="chauffeur-prenom-input"
                />
              </div>
              <div>
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  placeholder="Dupont"
                  data-testid="chauffeur-nom-input"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                value={form.telephone}
                onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                placeholder="06 12 34 56 78"
                data-testid="chauffeur-telephone-input"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jean.dupont@email.com"
                data-testid="chauffeur-email-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="permis">Permis</Label>
                <Input
                  id="permis"
                  value={form.permis}
                  onChange={(e) => setForm({ ...form, permis: e.target.value })}
                  placeholder="C, CE, EC..."
                  data-testid="chauffeur-permis-input"
                />
              </div>
              <div>
                <Label htmlFor="date_embauche">Date d'embauche</Label>
                <Input
                  id="date_embauche"
                  type="date"
                  value={form.date_embauche}
                  onChange={(e) => setForm({ ...form, date_embauche: e.target.value })}
                  data-testid="chauffeur-embauche-input"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="disponible">Disponible</Label>
              <Switch
                id="disponible"
                checked={form.disponible}
                onCheckedChange={(checked) => setForm({ ...form, disponible: checked })}
                data-testid="chauffeur-disponible-switch"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notes additionnelles..."
                data-testid="chauffeur-notes-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-[#1A4D2E] hover:bg-[#143d24]"
              data-testid="chauffeur-submit-btn"
            >
              {editingChauffeur ? "Modifier" : "Ajouter"}
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
              Êtes-vous sûr de vouloir supprimer le chauffeur{" "}
              <strong>{chauffeurToDelete?.prenom} {chauffeurToDelete?.nom}</strong> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              data-testid="confirm-delete-chauffeur-btn"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    {/* Dialog Espace Documents Chauffeur */}
      <Dialog open={docsDialogOpen} onOpenChange={setDocsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Barlow_Condensed'] text-2xl flex items-center gap-2">
              <Folder className="w-5 h-5 text-blue-500" />
              Documents — {selectedChauffeurDocs?.prenom} {selectedChauffeurDocs?.nom}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="attente">
            <TabsList>
              <TabsTrigger value="attente">
                <Clock className="w-4 h-4 mr-2" />
                En attente ({docsChauffeur.filter(d => d.statut === "en_attente").length})
              </TabsTrigger>
              <TabsTrigger value="signes">
                <CheckCircle className="w-4 h-4 mr-2" />
                Signés ({docsChauffeur.filter(d => d.statut === "signe").length})
              </TabsTrigger>
              <TabsTrigger value="ajouter">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </TabsTrigger>
            </TabsList>

            <TabsContent value="attente" className="mt-4">
              {docsLoading ? (
                <p className="text-center text-muted-foreground py-6">Chargement...</p>
              ) : docsChauffeur.filter(d => d.statut === "en_attente").length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-400" />
                  <p>Aucun document en attente</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Envoyé le</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {docsChauffeur.filter(d => d.statut === "en_attente").map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.nom}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {doc.type_document === "contrat_travail" ? "Contrat" :
                             doc.type_document === "fiche_paie" ? "Fiche de paie" :
                             doc.type_document === "commissionnement" ? "Commissionnement" : "Autre"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {doc.created_at ? new Date(doc.created_at).toLocaleDateString("fr-FR") : "—"}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline"
                            onClick={() => handleUpdateDocStatut(doc.id, "signe")}
                            className="text-green-600 border-green-300 hover:bg-green-50"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" /> Marquer signé
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="signes" className="mt-4">
              {docsChauffeur.filter(d => d.statut === "signe").length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p>Aucun document signé</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Signé le</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {docsChauffeur.filter(d => d.statut === "signe").map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.nom}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {doc.type_document === "contrat_travail" ? "Contrat" :
                             doc.type_document === "fiche_paie" ? "Fiche de paie" :
                             doc.type_document === "commissionnement" ? "Commissionnement" : "Autre"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {doc.signed_at ? new Date(doc.signed_at).toLocaleDateString("fr-FR") : "—"}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            <Download className="w-3 h-3 mr-1" /> Télécharger
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="ajouter" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Nom du document *</Label>
                <input
                  className="w-full border border-input rounded-md px-3 py-2 text-sm"
                  placeholder="ex: Contrat de travail CDI"
                  value={newDocForm.nom}
                  onChange={(e) => setNewDocForm({ ...newDocForm, nom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Type de document</Label>
                <Select value={newDocForm.type_document} onValueChange={(v) => setNewDocForm({ ...newDocForm, type_document: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contrat_travail">Contrat de travail</SelectItem>
                    <SelectItem value="fiche_paie">Fiche de paie</SelectItem>
                    <SelectItem value="commissionnement">Contrat de commissionnement</SelectItem>
                    <SelectItem value="autre">Autre document</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes (optionnel)</Label>
                <input
                  className="w-full border border-input rounded-md px-3 py-2 text-sm"
                  placeholder="Remarques éventuelles"
                  value={newDocForm.notes}
                  onChange={(e) => setNewDocForm({ ...newDocForm, notes: e.target.value })}
                />
              </div>
              <Button
                className="w-full bg-[#1A4D2E] hover:bg-[#143d24]"
                onClick={handleAddDoc}
                disabled={addingDoc}
              >
                {addingDoc ? "Ajout en cours..." : "Ajouter le document"}
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

    </div>
  );
}
