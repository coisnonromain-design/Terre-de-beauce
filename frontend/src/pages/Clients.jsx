import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Search,
  Phone,
  Mail,
  MapPin,
  FileText,
  Euro,
  KeyRound,
  Copy,
  CheckCircle2,
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

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const methodeLabels = {
  heure: "À l'heure (€/h)",
  tonne: "Au tonnage (€/T)",
  journee: "Forfait journalier (€/jour)",
};

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [credModal, setCredModal] = useState(null); // {raison_sociale, email, password}
  const [genLoadingId, setGenLoadingId] = useState(null);

  const [form, setForm] = useState({
    raison_sociale: "",
    siren: "",
    siret: "",
    tva_intracommunautaire: "",
    adresse: "",
    code_postal: "",
    ville: "",
    pays: "France",
    telephone: "",
    email: "",
    contact_nom: "",
    contact_telephone: "",
    tarifs: [],
    notes: "",
  });

  const [newTarif, setNewTarif] = useState({
    methode: "",
    prix_unitaire: "",
    description: "",
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await axios.get(`${API}/clients`);
      setClients(res.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des clients");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingClient) {
        await axios.put(`${API}/clients/${editingClient.id}`, form);
        toast.success("Client modifié avec succès");
      } else {
        await axios.post(`${API}/clients`, form);
        toast.success("Client ajouté avec succès");
      }
      setDialogOpen(false);
      resetForm();
      fetchClients();
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    }
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

  const openEditDialog = (client) => {
    setEditingClient(client);
    setForm({
      raison_sociale: client.raison_sociale,
      siren: client.siren || "",
      siret: client.siret || "",
      tva_intracommunautaire: client.tva_intracommunautaire || "",
      adresse: client.adresse,
      code_postal: client.code_postal,
      ville: client.ville,
      pays: client.pays || "France",
      telephone: client.telephone || "",
      email: client.email || "",
      contact_nom: client.contact_nom || "",
      contact_telephone: client.contact_telephone || "",
      tarifs: client.tarifs || [],
      notes: client.notes || "",
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingClient(null);
    setForm({
      raison_sociale: "",
      siren: "",
      siret: "",
      tva_intracommunautaire: "",
      adresse: "",
      code_postal: "",
      ville: "",
      pays: "France",
      telephone: "",
      email: "",
      contact_nom: "",
      contact_telephone: "",
      tarifs: [],
      notes: "",
    });
    setNewTarif({ methode: "", prix_unitaire: "", description: "" });
  };

  const handleDelete = async () => {
    if (!clientToDelete) return;
    try {
      await axios.delete(`${API}/clients/${clientToDelete.id}`);
      toast.success("Client supprimé");
      fetchClients();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };

  const handleGenerateCredentials = async (client) => {
    setGenLoadingId(client.id);
    try {
      const res = await axios.post(`${API}/clients/${client.id}/generate-credentials`);
      setCredModal({
        raison_sociale: client.raison_sociale,
        email: res.data.email,
        password: res.data.password,
        regenerated: client.acces_actif,
      });
      fetchClients();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la génération de l'accès");
    } finally {
      setGenLoadingId(null);
    }
  };

  const copyCredentials = () => {
    if (!credModal) return;
    navigator.clipboard.writeText(
      `Espace Client Terre de Beauce\nEmail: ${credModal.email}\nMot de passe: ${credModal.password}`
    );
    toast.success("Identifiants copiés");
  };

  const filteredClients = clients.filter(
    (c) =>
      c.raison_sociale.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.ville.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.siret && c.siret.includes(searchTerm))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A4D2E]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="clients-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-['Barlow_Condensed'] tracking-tight">
            Gestion des Clients
          </h1>
          <p className="text-muted-foreground mt-1">
            {clients.length} client(s) enregistré(s)
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
              data-testid="search-client-input"
            />
          </div>
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            className="bg-[#1A4D2E] hover:bg-[#143d24]"
            data-testid="add-client-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Clients Table */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-xl font-['Barlow_Condensed'] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#D9A520]" />
            Liste des clients
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredClients.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun client enregistré</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Raison sociale</TableHead>
                  <TableHead>SIRET</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead>Tarification</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id} data-testid={`client-row-${client.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-medium">
                          {client.raison_sociale.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{client.raison_sociale}</p>
                          {client.tva_intracommunautaire && (
                            <p className="text-xs text-muted-foreground">
                              TVA: {client.tva_intracommunautaire}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        {client.siret && (
                          <div className="flex items-center gap-1.5 text-sm">
                            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="font-mono text-xs">{client.siret}</span>
                          </div>
                        )}
                        {client.siren && (
                          <p className="text-xs text-muted-foreground">
                            SIREN: {client.siren}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-1.5 text-sm">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                        <div>
                          <p>{client.adresse}</p>
                          <p className="text-muted-foreground">
                            {client.code_postal} {client.ville}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.tarifs && client.tarifs.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {client.tarifs.map((tarif, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tarif.prix_unitaire}€/{tarif.methode === "heure" ? "h" : tarif.methode === "tonne" ? "T" : "j"}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Non définie</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {client.telephone && (
                          <div className="flex items-center gap-1.5 text-sm">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                            {client.telephone}
                          </div>
                        )}
                        {client.email && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Mail className="w-3.5 h-3.5" />
                            {client.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {client.acces_actif && (
                          <Badge className="bg-green-100 text-green-700 border-green-200 border text-xs mr-1">
                            Accès actif
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          title={client.acces_actif ? "Régénérer le mot de passe" : "Générer un accès client"}
                          onClick={() => handleGenerateCredentials(client)}
                          disabled={genLoadingId === client.id || !client.email}
                          data-testid={`generate-client-access-${client.id}`}
                        >
                          <KeyRound className={`w-4 h-4 ${client.acces_actif ? "text-green-600" : "text-[#D9A520]"}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(client)}
                          data-testid={`edit-client-${client.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setClientToDelete(client);
                            setDeleteDialogOpen(true);
                          }}
                          data-testid={`delete-client-${client.id}`}
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

      {/* Client Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="font-['Barlow_Condensed'] text-2xl">
              {editingClient ? "Modifier le client" : "Ajouter un client"}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="grid gap-4 py-4">
              {/* Informations générales */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Informations générales
                </h3>
                <div>
                  <Label htmlFor="raison_sociale">Raison sociale *</Label>
                  <Input
                    id="raison_sociale"
                    value={form.raison_sociale}
                    onChange={(e) => setForm({ ...form, raison_sociale: e.target.value })}
                    placeholder="Nom de l'entreprise"
                    data-testid="client-raison-sociale-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="siren">SIREN</Label>
                    <Input
                      id="siren"
                      value={form.siren}
                      onChange={(e) => setForm({ ...form, siren: e.target.value })}
                      placeholder="123 456 789"
                      maxLength={11}
                      data-testid="client-siren-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="siret">SIRET</Label>
                    <Input
                      id="siret"
                      value={form.siret}
                      onChange={(e) => setForm({ ...form, siret: e.target.value })}
                      placeholder="123 456 789 00012"
                      maxLength={17}
                      data-testid="client-siret-input"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="tva">N° TVA Intracommunautaire</Label>
                  <Input
                    id="tva"
                    value={form.tva_intracommunautaire}
                    onChange={(e) => setForm({ ...form, tva_intracommunautaire: e.target.value })}
                    placeholder="FR 12 345678901"
                    data-testid="client-tva-input"
                  />
                </div>
              </div>

              {/* Adresse */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Adresse
                </h3>
                <div>
                  <Label htmlFor="adresse">Adresse *</Label>
                  <Input
                    id="adresse"
                    value={form.adresse}
                    onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                    placeholder="Numéro et nom de rue"
                    data-testid="client-adresse-input"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="code_postal">Code postal *</Label>
                    <Input
                      id="code_postal"
                      value={form.code_postal}
                      onChange={(e) => setForm({ ...form, code_postal: e.target.value })}
                      placeholder="45000"
                      maxLength={5}
                      data-testid="client-cp-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ville">Ville *</Label>
                    <Input
                      id="ville"
                      value={form.ville}
                      onChange={(e) => setForm({ ...form, ville: e.target.value })}
                      placeholder="Orléans"
                      data-testid="client-ville-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pays">Pays</Label>
                    <Input
                      id="pays"
                      value={form.pays}
                      onChange={(e) => setForm({ ...form, pays: e.target.value })}
                      placeholder="France"
                      data-testid="client-pays-input"
                    />
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Contact
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="telephone">Téléphone</Label>
                    <Input
                      id="telephone"
                      value={form.telephone}
                      onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                      placeholder="02 38 00 00 00"
                      data-testid="client-telephone-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="contact@entreprise.fr"
                      data-testid="client-email-input"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_nom">Nom du contact</Label>
                    <Input
                      id="contact_nom"
                      value={form.contact_nom}
                      onChange={(e) => setForm({ ...form, contact_nom: e.target.value })}
                      placeholder="M. Dupont"
                      data-testid="client-contact-nom-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_telephone">Tél. du contact</Label>
                    <Input
                      id="contact_telephone"
                      value={form.contact_telephone}
                      onChange={(e) => setForm({ ...form, contact_telephone: e.target.value })}
                      placeholder="06 00 00 00 00"
                      data-testid="client-contact-tel-input"
                    />
                  </div>
                </div>
              </div>

              {/* Tarification */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Euro className="w-4 h-4" />
                  Tarification par défaut
                </h3>
                
                {/* Tarifs existants */}
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

                {/* Ajouter un tarif */}
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
                        <SelectItem value="heure">À l'heure</SelectItem>
                        <SelectItem value="tonne">Au tonnage</SelectItem>
                        <SelectItem value="journee">Forfait jour</SelectItem>
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
                      data-testid="tarif-description-input"
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
                <p className="text-xs text-muted-foreground">
                  Ces tarifs seront appliqués par défaut aux nouveaux chantiers pour ce client
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Notes additionnelles sur le client..."
                    rows={3}
                    data-testid="client-notes-input"
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
              onClick={handleSubmit}
              className="bg-[#1A4D2E] hover:bg-[#143d24]"
              data-testid="client-submit-btn"
            >
              {editingClient ? "Modifier" : "Ajouter"}
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
              Êtes-vous sûr de vouloir supprimer le client{" "}
              <strong>{clientToDelete?.raison_sociale}</strong> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              data-testid="confirm-delete-client-btn"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modale identifiants client générés */}
      <Dialog open={!!credModal} onOpenChange={(open) => !open && setCredModal(null)}>
        <DialogContent className="sm:max-w-md" data-testid="client-credentials-modal">
          <DialogHeader>
            <DialogTitle className="font-['Barlow_Condensed'] text-2xl flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              Accès client {credModal?.regenerated ? "régénéré" : "créé"}
            </DialogTitle>
          </DialogHeader>
          {credModal && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Communiquez ces identifiants à <strong>{credModal.raison_sociale}</strong>. Le mot de passe
                ne sera <strong>plus affiché</strong> ensuite.
              </p>
              <div className="space-y-2 bg-muted/50 rounded-lg p-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-mono text-sm">{credModal.email}</p>
                </div>
                <Separator />
                <div>
                  <Label className="text-xs text-muted-foreground">Mot de passe</Label>
                  <p className="font-mono text-lg font-bold tracking-wide" data-testid="client-generated-password">
                    {credModal.password}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Connexion sur l'espace client : <strong>/client/login</strong>
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={copyCredentials}>
              <Copy className="w-4 h-4 mr-2" /> Copier
            </Button>
            <Button
              className="bg-[#1A4D2E] hover:bg-[#143d24]"
              onClick={() => setCredModal(null)}
              data-testid="close-credentials-modal-btn"
            >
              J'ai noté
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
