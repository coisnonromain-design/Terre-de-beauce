import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Truck,
  LogIn,
  Clock,
  Weight,
  MapPin,
  HardHat,
  Calendar,
  Save,
  LogOut,
  CheckCircle,
  Plus,
  Trash2,
  Route,
  Fuel,
  ArrowLeft,
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
import { Separator } from "@/components/ui/separator";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ChauffeurPortal() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [chauffeur, setChauffeur] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chantiers, setChantiers] = useState([]);
  const [pointages, setPointages] = useState([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    chantier_id: "",
    date: new Date().toISOString().split("T")[0],
    heures_travaillees: "",
    commentaire: "",
  });

  // Tours (trajets) avec volume et distance
  const [tours, setTours] = useState([]);

  useEffect(() => {
    // Vérifier si connecté
    const savedChauffeur = localStorage.getItem("chauffeur_session");
    if (!savedChauffeur) {
      navigate("/chauffeur/login");
      return;
    }
    
    const session = JSON.parse(savedChauffeur);
    setChauffeur(session);
    setIsLoggedIn(true);
    fetchChauffeurData(session.chauffeur_id);
    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("chauffeur_session");
    toast.success("Déconnexion réussie");
    navigate("/");
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

  // Ajouter un tour
  const addTour = () => {
    setTours([...tours, { volume: "", distance: "" }]);
  };

  // Supprimer un tour
  const removeTour = (index) => {
    setTours(tours.filter((_, i) => i !== index));
  };

  // Mettre à jour un tour
  const updateTour = (index, field, value) => {
    const newTours = [...tours];
    newTours[index][field] = value;
    setTours(newTours);
  };

  // Calculer les totaux
  const totalVolume = tours.reduce((sum, t) => sum + (parseFloat(t.volume) || 0), 0);
  const totalDistance = tours.reduce((sum, t) => sum + (parseFloat(t.distance) || 0), 0);

  // Obtenir les infos du chantier sélectionné
  const selectedChantier = chantiers.find(c => c.id === form.chantier_id);
  const transportType = selectedChantier?.transport_type || "solide";
  const avecGasoil = selectedChantier?.avec_gasoil !== false;
  const uniteVolume = transportType === "liquide" ? "m³" : "tonnes";

  const handleSubmitPointage = async () => {
    if (!form.chantier_id) {
      toast.error("Veuillez sélectionner un chantier");
      return;
    }

    if (!form.heures_travaillees && tours.length === 0) {
      toast.error("Veuillez saisir les heures ou au moins un tour");
      return;
    }

    // Valider les tours
    const toursValides = tours.filter(t => t.volume && t.distance);
    if (tours.length > 0 && toursValides.length !== tours.length) {
      toast.error("Veuillez remplir le volume et la distance pour chaque tour");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        chantier_id: form.chantier_id,
        chauffeur_id: chauffeur.chauffeur_id,
        date: form.date,
        heures_travaillees: parseFloat(form.heures_travaillees) || 0,
        tours: toursValides.map(t => ({
          volume: parseFloat(t.volume) || 0,
          distance_km: parseFloat(t.distance) || 0,
        })),
        commentaire: form.commentaire,
      };

      await axios.post(`${API}/pointages`, payload);

      toast.success("Pointage enregistré avec succès");
      
      // Reset form but keep date
      setForm({
        chantier_id: "",
        date: form.date,
        heures_travaillees: "",
        commentaire: "",
      });
      setTours([]);

      // Refresh pointages
      fetchChauffeurData(chauffeur.chauffeur_id);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
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
              <p className="text-xs text-gray-400">Portail Chauffeur</p>
              <p className="font-semibold">{chauffeur?.chauffeur_nom}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-gray-400 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Saisie Pointage */}
        <Card>
          <CardHeader className="border-b bg-[#1A4D2E] text-white rounded-t-lg">
            <CardTitle className="text-xl font-['Barlow_Condensed'] flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Nouveau Pointage
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Chantier et Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <HardHat className="w-4 h-4 text-[#D9A520]" />
                  Chantier *
                </Label>
                <Select
                  value={form.chantier_id}
                  onValueChange={(value) => {
                    setForm({ ...form, chantier_id: value });
                    setTours([]); // Reset tours when changing chantier
                  }}
                >
                  <SelectTrigger data-testid="chantier-select">
                    <SelectValue placeholder="Sélectionner un chantier" />
                  </SelectTrigger>
                  <SelectContent>
                    {chantiers.map((chantier) => (
                      <SelectItem key={chantier.id} value={chantier.id}>
                        <div className="flex items-center gap-2">
                          {chantier.reference} - {chantier.lieu}
                          <Badge variant="outline" className="text-xs">
                            {chantier.transport_type === "liquide" ? "Liquide" : "Solide"}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#D9A520]" />
                  Date *
                </Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  data-testid="date-input"
                />
              </div>
            </div>

            {/* Info chantier sélectionné */}
            {selectedChantier && (
              <div className="bg-slate-50 p-3 rounded-lg flex items-center gap-4 text-sm">
                <Badge variant="outline" className={transportType === "liquide" ? "bg-blue-50" : "bg-amber-50"}>
                  {transportType === "liquide" ? "Transport Liquide" : "Transport Solide"}
                </Badge>
                <span className={`flex items-center gap-1 ${avecGasoil ? 'text-green-600' : 'text-orange-600'}`}>
                  <Fuel className="w-4 h-4" />
                  {avecGasoil ? "Gasoil fourni" : "Sans gasoil"}
                </span>
              </div>
            )}

            {/* Heures travaillées */}
            <div>
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D9A520]" />
                Heures travaillées
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={form.heures_travaillees}
                  onChange={(e) => setForm({ ...form, heures_travaillees: e.target.value })}
                  placeholder="0"
                  className="w-32"
                  data-testid="heures-input"
                />
                <span className="text-muted-foreground">heures</span>
              </div>
            </div>

            <Separator />

            {/* Tours (trajets) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-base">
                  <Route className="w-4 h-4 text-[#D9A520]" />
                  Tours / Trajets
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTour}
                  disabled={!form.chantier_id}
                  data-testid="add-tour-btn"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter un tour
                </Button>
              </div>

              {!form.chantier_id && (
                <p className="text-sm text-muted-foreground italic">
                  Sélectionnez un chantier pour ajouter des tours
                </p>
              )}

              {tours.length === 0 && form.chantier_id && (
                <p className="text-sm text-muted-foreground italic">
                  Aucun tour ajouté. Cliquez sur "Ajouter un tour" pour saisir vos trajets.
                </p>
              )}

              {/* Liste des tours */}
              {tours.map((tour, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                >
                  <span className="w-8 h-8 bg-[#1A4D2E] text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Weight className="w-3 h-3" />
                        Volume ({uniteVolume})
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={tour.volume}
                        onChange={(e) => updateTour(index, "volume", e.target.value)}
                        placeholder="0"
                        className="h-9"
                        data-testid={`tour-volume-${index}`}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Distance (km)
                      </Label>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        value={tour.distance}
                        onChange={(e) => updateTour(index, "distance", e.target.value)}
                        placeholder="0"
                        className="h-9"
                        data-testid={`tour-distance-${index}`}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTour(index)}
                    className="text-red-500 hover:text-red-700"
                    data-testid={`remove-tour-${index}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              {/* Totaux */}
              {tours.length > 0 && (
                <div className="flex items-center gap-6 p-3 bg-[#1A4D2E]/10 rounded-lg">
                  <span className="font-semibold text-[#1A4D2E]">Totaux :</span>
                  <div className="flex items-center gap-2">
                    <Weight className="w-4 h-4 text-[#1A4D2E]" />
                    <span className="font-bold">{totalVolume.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">{uniteVolume}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#1A4D2E]" />
                    <span className="font-bold">{totalDistance.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">km</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Route className="w-4 h-4 text-[#1A4D2E]" />
                    <span className="font-bold">{tours.length}</span>
                    <span className="text-sm text-muted-foreground">tour(s)</span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Commentaire */}
            <div>
              <Label>Commentaire (optionnel)</Label>
              <Textarea
                value={form.commentaire}
                onChange={(e) => setForm({ ...form, commentaire: e.target.value })}
                placeholder="Notes, observations..."
                rows={2}
                data-testid="commentaire-input"
              />
            </div>

            {/* Bouton Enregistrer */}
            <Button
              onClick={handleSubmitPointage}
              disabled={saving || !form.chantier_id}
              className="w-full bg-[#1A4D2E] hover:bg-[#143d24] h-12 text-lg"
              data-testid="submit-pointage-btn"
            >
              <Save className="w-5 h-5 mr-2" />
              {saving ? "Enregistrement..." : "Enregistrer le pointage"}
            </Button>
          </CardContent>
        </Card>

        {/* Historique des pointages */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-xl font-['Barlow_Condensed'] flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#D9A520]" />
              Mes derniers pointages
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {pointages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucun pointage enregistré
              </p>
            ) : (
              <div className="space-y-3">
                {pointages.slice(0, 10).map((pointage) => (
                  <div
                    key={pointage.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#1A4D2E]/10 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-[#1A4D2E]" />
                      </div>
                      <div>
                        <p className="font-medium">{pointage.chantier_reference || "Chantier"}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(pointage.date).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {pointage.heures_travaillees > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold">{pointage.heures_travaillees}h</span>
                        </div>
                      )}
                      {pointage.nombre_tours > 0 && (
                        <div className="flex items-center gap-1">
                          <Route className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold">{pointage.nombre_tours} tours</span>
                        </div>
                      )}
                      {pointage.total_volume > 0 && (
                        <div className="flex items-center gap-1">
                          <Weight className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {pointage.total_volume.toFixed(1)} {pointage.transport_type === "liquide" ? "m³" : "t"}
                          </span>
                        </div>
                      )}
                      {pointage.total_distance > 0 && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold">{pointage.total_distance.toFixed(1)} km</span>
                        </div>
                      )}
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Enregistré
                      </Badge>
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
