import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Truck, ShieldCheck, LogIn, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingInit, setCheckingInit] = useState(true);

  useEffect(() => {
    // Vérifier si des admins existent, sinon initialiser
    const checkAdmins = async () => {
      try {
        const res = await axios.get(`${API}/admin/check`);
        if (!res.data.has_admins) {
          // Initialiser le premier admin
          await axios.post(`${API}/admin/init`);
          toast.success("Compte administrateur initial créé");
        }
      } catch (error) {
        console.error("Error checking admins:", error);
      } finally {
        setCheckingInit(false);
      }
    };
    checkAdmins();

    // Vérifier si déjà connecté
    const token = localStorage.getItem("admin_token");
    if (token) {
      navigate("/admin");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/admin/login`, { email, password });
      localStorage.setItem("admin_token", res.data.token);
      localStorage.setItem("admin_info", JSON.stringify({
        id: res.data.admin_id,
        email: res.data.email,
        nom: res.data.nom,
        prenom: res.data.prenom
      }));
      toast.success(`Bienvenue, ${res.data.prenom} !`);
      navigate("/admin");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  if (checkingInit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1A4D2E] to-[#0d2818] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A4D2E] to-[#0d2818] flex items-center justify-center p-4">
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
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#D9A520]/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-[#D9A520]" />
            </div>
            <CardTitle className="text-2xl font-['Barlow_Condensed']">
              Espace Administrateur
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Connectez-vous pour accéder à l'ERP
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    data-testid="admin-email-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    data-testid="admin-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#1A4D2E] hover:bg-[#143d24]"
                disabled={loading}
                data-testid="admin-login-btn"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Se connecter
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
