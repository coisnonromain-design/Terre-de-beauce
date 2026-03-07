import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  ShieldCheck,
  Plus,
  Trash2,
  Mail,
  User,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

export default function Administrateurs() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  
  const [formData, setFormData] = useState({
    email: "",
    nom: "",
    prenom: "",
    password: "",
    confirmPassword: "",
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem("admin_token");
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    const adminInfo = localStorage.getItem("admin_info");
    if (adminInfo) {
      setCurrentAdmin(JSON.parse(adminInfo));
    }
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await axios.get(`${API}/admin/list`, { headers: getAuthHeaders() });
      setAdmins(res.data);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expirée");
        navigate("/admin/login");
      } else {
        toast.error("Erreur lors du chargement");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.email || !formData.nom || !formData.prenom || !formData.password) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    try {
      await axios.post(`${API}/admin/create`, {
        email: formData.email,
        nom: formData.nom,
        prenom: formData.prenom,
        password: formData.password,
        role: "admin"
      }, { headers: getAuthHeaders() });
      
      toast.success("Administrateur créé avec succès");
      setDialogOpen(false);
      setFormData({ email: "", nom: "", prenom: "", password: "", confirmPassword: "" });
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la création");
    }
  };

  const handleDelete = async () => {
    if (!selectedAdmin) return;
    
    try {
      await axios.delete(`${API}/admin/${selectedAdmin.id}`, { headers: getAuthHeaders() });
      toast.success("Administrateur supprimé");
      setDeleteDialogOpen(false);
      setSelectedAdmin(null);
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la suppression");
    }
  };

  const handleToggleActive = async (admin) => {
    try {
      const res = await axios.put(`${API}/admin/${admin.id}/toggle-active`, {}, { headers: getAuthHeaders() });
      toast.success(res.data.message);
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
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
    <div className="space-y-6" data-testid="administrateurs-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-['Barlow_Condensed'] tracking-tight">
            Administrateurs
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestion des comptes administrateurs
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-[#1A4D2E] hover:bg-[#143d24]"
          data-testid="add-admin-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvel administrateur
        </Button>
      </div>

      {/* Liste des admins */}
      <div className="grid gap-4">
        {admins.map((admin) => (
          <Card key={admin.id} className="hover:shadow-md transition-shadow" data-testid={`admin-card-${admin.id}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#1A4D2E]/10 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-[#1A4D2E]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">
                        {admin.prenom} {admin.nom}
                      </p>
                      {currentAdmin?.id === admin.id && (
                        <Badge className="bg-[#D9A520] text-[#1A4D2E]">Vous</Badge>
                      )}
                      {!admin.is_active && (
                        <Badge variant="secondary" className="bg-red-100 text-red-700">Désactivé</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {admin.email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Créé le {new Date(admin.date_creation).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {currentAdmin?.id !== admin.id && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(admin)}
                        title={admin.is_active ? "Désactiver" : "Activer"}
                      >
                        {admin.is_active ? (
                          <ToggleRight className="w-5 h-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedAdmin(admin);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog création */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvel administrateur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom *</Label>
                <Input
                  id="prenom"
                  value={formData.prenom}
                  onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                  placeholder="Jean"
                  data-testid="admin-prenom-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  placeholder="Dupont"
                  data-testid="admin-nom-input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="jean.dupont@email.com"
                data-testid="admin-email-create-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Minimum 6 caractères"
                data-testid="admin-password-create-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                placeholder="Répétez le mot de passe"
                data-testid="admin-confirm-password-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} className="bg-[#1A4D2E] hover:bg-[#143d24]">
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet administrateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'administrateur {selectedAdmin?.prenom} {selectedAdmin?.nom} ne pourra plus se connecter.
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
