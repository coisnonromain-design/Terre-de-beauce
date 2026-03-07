import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Truck, Users, LogIn, KeyRound, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ChauffeurLogin() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Vérifier si déjà connecté
    const session = localStorage.getItem("chauffeur_session");
    if (session) {
      navigate("/chauffeur/portal");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!code || code.length < 4) {
      toast.error("Veuillez entrer votre code d'accès");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/chauffeur/login`, { code_acces: code.toUpperCase() });
      localStorage.setItem("chauffeur_session", JSON.stringify({
        chauffeur_id: res.data.chauffeur_id,
        nom: res.data.chauffeur_nom,
        token: res.data.token
      }));
      toast.success(`Bienvenue, ${res.data.chauffeur_nom} !`);
      navigate("/chauffeur/portal");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Code d'accès invalide");
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Bouton retour */}
        <Button
          variant="ghost"
          className="text-white/70 hover:text-white hover:bg-white/10 mb-6"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 bg-[#D9A520] rounded-xl flex items-center justify-center">
              <Truck className="w-8 h-8 text-[#1A4D2E]" />
            </div>
          </div>
          <h1 className="text-3xl font-bold font-['Barlow_Condensed'] text-white">
            TERRE DE BEAUCE
          </h1>
        </div>

        {/* Card de connexion */}
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-slate-600" />
            </div>
            <CardTitle className="text-2xl font-['Barlow_Condensed']">
              Espace Chauffeur
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Entrez votre code d'accès pour continuer
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="code">Code d'accès</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="code"
                    type="text"
                    placeholder="XXXXXX"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="pl-10 text-center text-xl tracking-widest font-mono uppercase"
                    maxLength={6}
                    data-testid="chauffeur-code-input"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Le code vous a été fourni par votre administrateur
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-slate-700 hover:bg-slate-800"
                disabled={loading || code.length < 4}
                data-testid="chauffeur-login-btn"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Accéder à mon espace
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
