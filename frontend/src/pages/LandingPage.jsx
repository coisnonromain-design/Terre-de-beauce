import { useNavigate } from "react-router-dom";
import { Truck, Users, ShieldCheck, Building2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A4D2E] to-[#0d2818] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {/* Logo et titre */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-20 h-20 bg-[#D9A520] rounded-2xl flex items-center justify-center shadow-lg">
              <Truck className="w-12 h-12 text-[#1A4D2E]" />
            </div>
          </div>
          <h1 className="text-5xl font-bold font-['Barlow_Condensed'] text-white tracking-tight mb-2">
            TERRE DE BEAUCE
          </h1>
          <p className="text-xl text-white/70">
            Transport Agricole
          </p>
        </div>

        {/* Cards de choix */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Espace Administrateur */}
          <Card
            className="group cursor-pointer border-2 border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-[#D9A520]/50 transition-all duration-300"
            onClick={() => navigate("/admin/login")}
            data-testid="admin-choice-card"
          >
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#D9A520]/20 flex items-center justify-center group-hover:bg-[#D9A520]/30 transition-colors">
                <ShieldCheck className="w-8 h-8 text-[#D9A520]" />
              </div>
              <h2 className="text-2xl font-bold font-['Barlow_Condensed'] text-white mb-2">
                Espace Administrateur
              </h2>
              <p className="text-white/60 mb-6">
                Gestion de la flotte, clients, chantiers, facturation et planning
              </p>
              <Button
                className="w-full bg-[#D9A520] hover:bg-[#c4941d] text-[#1A4D2E] font-semibold"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Connexion Admin
              </Button>
            </CardContent>
          </Card>

          {/* Espace Chauffeur */}
          <Card
            className="group cursor-pointer border-2 border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/30 transition-all duration-300"
            onClick={() => navigate("/chauffeur/login")}
            data-testid="chauffeur-choice-card"
          >
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold font-['Barlow_Condensed'] text-white mb-2">
                Espace Chauffeur
              </h2>
              <p className="text-white/60 mb-6">
                Saisie des heures, volumes transportés et suivi des chantiers
              </p>
              <Button
                variant="outline"
                className="w-full border-white/30 text-white hover:bg-white/10"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Connexion Chauffeur
              </Button>
            </CardContent>
          </Card>

          {/* Espace Client */}
          <Card
            className="group cursor-pointer border-2 border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-blue-400/40 transition-all duration-300"
            onClick={() => navigate("/client/login")}
            data-testid="client-choice-card"
          >
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-blue-400/10 flex items-center justify-center group-hover:bg-blue-400/20 transition-colors">
                <Building2 className="w-8 h-8 text-blue-300" />
              </div>
              <h2 className="text-2xl font-bold font-['Barlow_Condensed'] text-white mb-2">
                Espace Client
              </h2>
              <p className="text-white/60 mb-6">
                Accès à vos documents, contrats et factures à signer ou consulter
              </p>
              <Button
                variant="outline"
                className="w-full border-blue-400/30 text-blue-200 hover:bg-blue-400/10"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Connexion Client
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <p className="text-center text-white/40 text-sm mt-12">
          Ferme de Mennessard • 91660 Le Mérévillois
        </p>
      </div>
    </div>
  );
}
