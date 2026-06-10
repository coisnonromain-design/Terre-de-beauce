import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Truck, Building2, LogIn, Mail, Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ClientLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem("client_session");
    if (session) {
      navigate("/client/portal");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Veuillez renseigner votre email et mot de passe");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/client/login`, { email: email.trim(), password });
      localStorage.setItem("client_session", JSON.stringify({
        client_id: res.data.client_id,
        nom: res.data.client_nom,
        email: res.data.email,
        token: res.data.token,
      }));
      toast.success(`Bienvenue, ${res.data.client_nom} !`);
      navigate("/client/portal");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Email ou mot de passe incorrect");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A4D2E] to-[#0d2818] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          className="text-white/70 hover:text-white hover:bg-white/10 mb-6"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

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

        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#D9A520]/15 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-[#D9A520]" />
            </div>
            <CardTitle className="text-2xl font-['Barlow_Condensed']">
              Espace Client
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Connectez-vous pour accéder à vos documents
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
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
                    data-testid="client-email-input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    data-testid="client-password-input"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Vos identifiants vous ont été fournis par Terre de Beauce
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#1A4D2E] hover:bg-[#143d24]"
                disabled={loading || !email || !password}
                data-testid="client-login-btn"
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
