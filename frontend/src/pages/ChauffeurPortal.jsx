import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Truck,
  LogIn,
  Clock,
  Weight,
  RotateCcw,
  HardHat,
  Calendar,
  Save,
  LogOut,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ChauffeurPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [chauffeur, setChauffeur] = useState(null);
  const [codeAcces, setCodeAcces] = useState("");
  const [loading, setLoading] = useState(false);
  const [chantiers, setChantiers] = useState([]);
  const [pointages, setPointages] = useState([]);

  const [form, setForm] = useState({
    chantier_id: "",
    date: new Date().toISOString().split("T")[0],
    heures_travaillees: "",
    tonnage_transporte: "",
    nombre_rotations: "",
    commentaire: "",
  });

  useEffect(() => {
    // Check if already logged in
    const savedChauffeur = localStorage.getItem("chauffeur_session");
    if (savedChauffeur) {
      const session = JSON.parse(savedChauffeur);
      setChauffeur(session);
      setIsLoggedIn(true);
      fetchChauffeurData(session.chauffeur_id);
    }
  }, []);

  const handleLogin = async () => {
    if (!codeAcces.trim()) {
      toast.error("Veuillez entrer votre code d'accès");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/chauffeur/login`, { code_acces: codeAcces });
      const session = res.data;
      localStorage.setItem("chauffeur_session", JSON.stringify(session));
      setChauffeur(session);
      setIsLoggedIn(true);
      fetchChauffeurData(session.chauffeur_id);
      toast.success(`Bienvenue ${session.chauffeur_nom}`);
    } catch (error) {
      toast.error("Code d'accès invalide");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("chauffeur_session");
    setChauffeur(null);
    setIsLoggedIn(false);
    setChantiers([]);
    setPointages([]);
    setCodeAcces("");
  };

  const fetchChauffeurData = async (chauffeurId) => {
    try {
      const [chantiersRes, pointagesRes] = await Promise.all([
        axios.get(`${API}/chauffeur/${chauffeurId}/chantiers`),
        axios.get(`${API}/pointages?chauffeur_id=${chauffeurId}`),
      ]);
      setChantiers(chantiersRes.data);
      setPointages(pointagesRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSubmitPointage = async () => {
    if (!form.chantier_id) {
      toast.error("Veuillez sélectionner un chantier");
      return;
    }

    if (!form.heures_travaillees && !form.tonnage_transporte) {
      toast.error("Veuillez saisir au moins les heures ou le tonnage");
      return;
    }

    try {
      await axios.post(`${API}/pointages`, {
        chantier_id: form.chantier_id,
        chauffeur_id: chauffeur.chauffeur_id,
        date: form.date,
        heures_travaillees: parseFloat(form.heures_travaillees) || 0,
        tonnage_transporte: parseFloat(form.tonnage_transporte) || 0,
        nombre_rotations: parseInt(form.nombre_rotations) || 0,
        commentaire: form.commentaire,
      });

      toast.success("Pointage enregistré avec succès");
      
      // Reset form but keep date
      setForm({
        chantier_id: "",
        date: form.date,
        heures_travaillees: "",
        tonnage_transporte: "",
        nombre_rotations: "",
        commentaire: "",
      });

      // Refresh pointages
      fetchChauffeurData(chauffeur.chauffeur_id);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'enregistrement");
    }
  };

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 rounded-xl bg-[#D9A520] flex items-center justify-center mx-auto mb-4">
              <Truck className="w-10 h-10 text-[#1A1D1F]" />
            </div>
            <CardTitle className="text-3xl font-['Barlow_Condensed'] tracking-tight">
              TERRE DE BEAUCE
            </CardTitle>
            <p className="text-muted-foreground">Portail Chauffeur</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="code">Code d'accès</Label>
              <Input
                id="code"
                type="text"
                value={codeAcces}
                onChange={(e) => setCodeAcces(e.target.value.toUpperCase())}
                placeholder="Entrez votre code"
                className="text-center text-2xl font-mono tracking-widest"
                maxLength={6}
                data-testid="code-acces-input"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Code fourni par votre responsable
              </p>
            </div>
            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-[#1A4D2E] hover:bg-[#143d24]"
              data-testid="login-btn"
            >
              <LogIn className="w-4 h-4 mr-2" />
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main Portal
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <header className="bg-[#1A1D1F] text-white p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#D9A520] flex items-center justify-center">
              <Truck className="w-6 h-6 text-[#1A1D1F]" />
            </div>
            <div>
              <h1 className="font-bold font-['Barlow_Condensed'] tracking-wide">
                TERRE DE BEAUCE
              </h1>
              <p className="text-xs text-gray-400">Portail Chauffeur</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm">{chauffeur?.chauffeur_nom}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-300 hover:text-white hover:bg-white/10"
              data-testid="logout-btn"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Saisie pointage */}
        <Card data-testid="pointage-form-card">
          <CardHeader className="border-b">
            <CardTitle className="text-xl font-['Barlow_Condensed'] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#D9A520]" />
              Saisir un pointage
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {chantiers.length === 0 ? (
                      <SelectItem value="none" disabled>
                        Aucun chantier assigné
                      </SelectItem>
                    ) : (
                      chantiers.map((chantier) => (
                        <SelectItem key={chantier.id} value={chantier.id}>
                          {chantier.reference} - {chantier.client_nom}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  data-testid="date-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Heures travaillées
                </Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={form.heures_travaillees}
                  onChange={(e) => setForm({ ...form, heures_travaillees: e.target.value })}
                  placeholder="Ex: 8.5"
                  data-testid="heures-input"
                />
              </div>
              <div>
                <Label className="flex items-center gap-1">
                  <Weight className="w-4 h-4" />
                  Tonnage transporté
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.tonnage_transporte}
                  onChange={(e) => setForm({ ...form, tonnage_transporte: e.target.value })}
                  placeholder="Ex: 25.5"
                  data-testid="tonnage-input"
                />
              </div>
              <div>
                <Label className="flex items-center gap-1">
                  <RotateCcw className="w-4 h-4" />
                  Nombre de rotations
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={form.nombre_rotations}
                  onChange={(e) => setForm({ ...form, nombre_rotations: e.target.value })}
                  placeholder="Ex: 5"
                  data-testid="rotations-input"
                />
              </div>
            </div>

            <div>
              <Label>Commentaire (optionnel)</Label>
              <Textarea
                value={form.commentaire}
                onChange={(e) => setForm({ ...form, commentaire: e.target.value })}
                placeholder="Observations, problèmes rencontrés..."
                rows={2}
                data-testid="commentaire-input"
              />
            </div>

            <Button
              onClick={handleSubmitPointage}
              className="w-full bg-[#1A4D2E] hover:bg-[#143d24]"
              data-testid="submit-pointage-btn"
            >
              <Save className="w-4 h-4 mr-2" />
              Enregistrer le pointage
            </Button>
          </CardContent>
        </Card>

        {/* Mes chantiers */}
        <Card data-testid="mes-chantiers-card">
          <CardHeader className="border-b">
            <CardTitle className="text-xl font-['Barlow_Condensed'] flex items-center gap-2">
              <HardHat className="w-5 h-5 text-[#1A4D2E]" />
              Mes chantiers ({chantiers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {chantiers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <HardHat className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Aucun chantier assigné pour le moment</p>
              </div>
            ) : (
              <div className="divide-y">
                {chantiers.map((chantier) => (
                  <div key={chantier.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{chantier.reference}</p>
                        <p className="text-sm text-muted-foreground">
                          {chantier.client_nom} • {chantier.lieu}
                        </p>
                      </div>
                      <Badge
                        className={
                          chantier.statut === "en_cours"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-indigo-100 text-indigo-700 border-indigo-200"
                        }
                      >
                        {chantier.statut === "en_cours" ? "En cours" : "Planifié"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mes derniers pointages */}
        <Card data-testid="mes-pointages-card">
          <CardHeader className="border-b">
            <CardTitle className="text-xl font-['Barlow_Condensed'] flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#D9A520]" />
              Mes derniers pointages
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {pointages.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Aucun pointage enregistré</p>
              </div>
            ) : (
              <div className="divide-y">
                {pointages.slice(0, 10).map((pointage) => (
                  <div key={pointage.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {new Date(pointage.date).toLocaleDateString("fr-FR")}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {pointage.chantier_reference}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {pointage.client_nom}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        {pointage.heures_travaillees > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            {pointage.heures_travaillees}h
                          </span>
                        )}
                        {pointage.tonnage_transporte > 0 && (
                          <span className="flex items-center gap-1">
                            <Weight className="w-3.5 h-3.5 text-amber-600" />
                            {pointage.tonnage_transporte}T
                          </span>
                        )}
                        {pointage.nombre_rotations > 0 && (
                          <span className="flex items-center gap-1">
                            <RotateCcw className="w-3.5 h-3.5 text-green-600" />
                            {pointage.nombre_rotations}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
