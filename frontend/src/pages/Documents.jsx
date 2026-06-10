import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  FolderArchive,
  Plus,
  Trash2,
  Search,
  Download,
  FileSignature,
  FileCheck2,
  Upload,
  Users,
  Building2,
  Truck,
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
  DialogDescription,
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
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

const TYPE_LABELS = {
  contrat_travail: "Contrat de travail",
  fiche_paie: "Fiche de paie",
  contrat_commissionnement: "Contrat de commissionnement",
  autre: "Autre",
};

const STATUT_CONFIG = {
  a_signer: { label: "À signer", class: "bg-amber-100 text-amber-700 border-amber-200" },
  en_cours: { label: "Signature en cours", class: "bg-blue-100 text-blue-700 border-blue-200" },
  signe: { label: "Signé", class: "bg-green-100 text-green-700 border-green-200" },
  disponible: { label: "Disponible", class: "bg-slate-100 text-slate-600 border-slate-200" },
};

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categorieFilter, setCategorieFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [form, setForm] = useState({
    titre: "",
    type_document: "contrat_travail",
    categorie: "a_signer",
    destinataire_type: "chauffeur",
    destinataire_ids: [],
    file: null,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [docsRes, chaufRes, clientsRes] = await Promise.all([
        axios.get(`${API}/documents`),
        axios.get(`${API}/chauffeurs`),
        axios.get(`${API}/clients`),
      ]);
      setDocuments(docsRes.data);
      setChauffeurs(chaufRes.data);
      setClients(clientsRes.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des documents");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      titre: "",
      type_document: "contrat_travail",
      categorie: "a_signer",
      destinataire_type: "chauffeur",
      destinataire_ids: [],
      file: null,
    });
  };

  const toggleDestinataire = (id) => {
    setForm((prev) => ({
      ...prev,
      destinataire_ids: prev.destinataire_ids.includes(id)
        ? prev.destinataire_ids.filter((c) => c !== id)
        : [...prev.destinataire_ids, id],
    }));
  };

  const handleUpload = async () => {
    if (!form.titre.trim()) return toast.error("Veuillez saisir un titre");
    if (!form.file) return toast.error("Veuillez sélectionner un fichier PDF");
    if (form.destinataire_ids.length === 0)
      return toast.error("Veuillez sélectionner au moins un destinataire");

    const data = new FormData();
    data.append("titre", form.titre);
    data.append("type_document", form.type_document);
    data.append("categorie", form.categorie);
    data.append("destinataire_type", form.destinataire_type);
    data.append("destinataire_ids", form.destinataire_ids.join(","));
    data.append("file", form.file);

    setUploading(true);
    try {
      const res = await axios.post(`${API}/documents`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(`Document déposé pour ${res.data.created} destinataire(s)`);
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors du téléversement");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`${API}/documents/${deleteTarget.id}`);
      toast.success("Document supprimé");
      fetchData();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteTarget(null);
    }
  };

  const downloadDoc = (doc, signed) => {
    window.open(`${API}/documents/${doc.id}/download${signed ? "?signed=true" : ""}`, "_blank");
  };

  const filtered = documents.filter((d) => {
    const matchSearch =
      d.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.destinataire_nom && d.destinataire_nom.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCat = categorieFilter === "all" || d.categorie === categorieFilter;
    return matchSearch && matchCat;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A4D2E]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="documents-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-['Barlow_Condensed'] tracking-tight">
            Espace Documents
          </h1>
          <p className="text-muted-foreground mt-1">
            {documents.length} document(s) •{" "}
            {documents.filter((d) => d.categorie === "a_signer").length} à signer •{" "}
            {documents.filter((d) => d.statut === "signe").length} signé(s)
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
              data-testid="search-document-input"
            />
          </div>
          <Select value={categorieFilter} onValueChange={setCategorieFilter}>
            <SelectTrigger className="w-40" data-testid="categorie-filter-select">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="a_signer">À signer</SelectItem>
              <SelectItem value="a_consulter">À consulter</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            className="bg-[#1A4D2E] hover:bg-[#143d24]"
            data-testid="add-document-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Déposer un document
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-xl font-['Barlow_Condensed'] flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-[#D9A520]" />
            Documents des chauffeurs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <FolderArchive className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun document</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Destinataire</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((doc) => (
                  <TableRow key={doc.id} data-testid={`document-row-${doc.id}`}>
                    <TableCell className="font-medium">{doc.titre}</TableCell>
                    <TableCell>{TYPE_LABELS[doc.type_document] || doc.type_document}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {doc.destinataire_type === "client" ? (
                          <Building2 className="w-3.5 h-3.5 text-[#D9A520]" />
                        ) : (
                          <Truck className="w-3.5 h-3.5 text-[#1A4D2E]" />
                        )}
                        {doc.destinataire_nom || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {doc.categorie === "a_signer" ? (
                          <><FileSignature className="w-3 h-3" /> À signer</>
                        ) : (
                          <><FileCheck2 className="w-3 h-3" /> À consulter</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${(STATUT_CONFIG[doc.statut] || {}).class || ""} border`}>
                        {(STATUT_CONFIG[doc.statut] || {}).label || doc.statut}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Télécharger l'original"
                          onClick={() => downloadDoc(doc, false)}
                          data-testid={`download-document-${doc.id}`}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        {doc.statut === "signe" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Télécharger le document signé"
                            onClick={() => downloadDoc(doc, true)}
                            data-testid={`download-signed-document-${doc.id}`}
                          >
                            <FileCheck2 className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Supprimer"
                          onClick={() => setDeleteTarget(doc)}
                          data-testid={`delete-document-${doc.id}`}
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

      {/* Upload Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-['Barlow_Condensed'] text-2xl">
              Déposer un document
            </DialogTitle>
            <DialogDescription>
              Téléversez un PDF et assignez-le à un ou plusieurs chauffeurs.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label htmlFor="titre">Titre du document *</Label>
              <Input
                id="titre"
                value={form.titre}
                onChange={(e) => setForm({ ...form, titre: e.target.value })}
                placeholder="Ex: Contrat de travail - Jean Dupont"
                data-testid="document-titre-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type de document</Label>
                <Select
                  value={form.type_document}
                  onValueChange={(v) => setForm({ ...form, type_document: v })}
                >
                  <SelectTrigger data-testid="document-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Catégorie</Label>
                <Select
                  value={form.categorie}
                  onValueChange={(v) => setForm({ ...form, categorie: v })}
                >
                  <SelectTrigger data-testid="document-categorie-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a_signer">À signer (DocuSign)</SelectItem>
                    <SelectItem value="a_consulter">À consulter seulement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Fichier PDF *</Label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => setForm({ ...form, file: e.target.files[0] || null })}
                data-testid="document-file-input"
              />
              {form.file && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Upload className="w-3 h-3" /> {form.file.name}
                </p>
              )}
            </div>
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4" /> Destinataires *
              </Label>
              <Select
                value={form.destinataire_type}
                onValueChange={(v) => setForm({ ...form, destinataire_type: v, destinataire_ids: [] })}
              >
                <SelectTrigger className="mb-2" data-testid="document-destinataire-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chauffeur">Chauffeurs</SelectItem>
                  <SelectItem value="client">Clients</SelectItem>
                </SelectContent>
              </Select>
              <ScrollArea className="h-40 border rounded-md p-2">
                {form.destinataire_type === "chauffeur" ? (
                  chauffeurs.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-2">Aucun chauffeur</p>
                  ) : (
                    chauffeurs.map((c) => (
                      <label
                        key={c.id}
                        className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer"
                      >
                        <Checkbox
                          checked={form.destinataire_ids.includes(c.id)}
                          onCheckedChange={() => toggleDestinataire(c.id)}
                          data-testid={`document-destinataire-checkbox-${c.id}`}
                        />
                        <span className="text-sm">
                          {c.prenom} {c.nom}
                          {!c.email && form.categorie === "a_signer" && (
                            <span className="text-xs text-orange-500 ml-1">(pas d&apos;email)</span>
                          )}
                        </span>
                      </label>
                    ))
                  )
                ) : clients.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">Aucun client</p>
                ) : (
                  clients.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer"
                    >
                      <Checkbox
                        checked={form.destinataire_ids.includes(c.id)}
                        onCheckedChange={() => toggleDestinataire(c.id)}
                        data-testid={`document-destinataire-checkbox-${c.id}`}
                      />
                      <span className="text-sm">
                        {c.raison_sociale}
                        {!c.email && form.categorie === "a_signer" && (
                          <span className="text-xs text-orange-500 ml-1">(pas d&apos;email)</span>
                        )}
                      </span>
                    </label>
                  ))
                )}
              </ScrollArea>
              {form.categorie === "a_signer" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Un email est requis pour la signature DocuSign de chaque destinataire.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="bg-[#1A4D2E] hover:bg-[#143d24]"
              data-testid="document-submit-btn"
            >
              {uploading ? "Téléversement..." : "Déposer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le document{" "}
              <strong>{deleteTarget?.titre}</strong> ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              data-testid="confirm-delete-document-btn"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
