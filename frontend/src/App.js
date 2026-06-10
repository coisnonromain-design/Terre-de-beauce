import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

// Pages publiques
import LandingPage from "@/pages/LandingPage";
import AdminLogin from "@/pages/AdminLogin";
import ChauffeurLogin from "@/pages/ChauffeurLogin";

// Layout Admin
import Layout from "@/components/Layout";

// Pages Admin
import Dashboard from "@/pages/Dashboard";
import Flotte from "@/pages/Flotte";
import Chauffeurs from "@/pages/Chauffeurs";
import Clients from "@/pages/Clients";
import Chantiers from "@/pages/Chantiers";
import Planning from "@/pages/Planning";
import Pointages from "@/pages/Pointages";
import Factures from "@/pages/Factures";
import Contrats from "@/pages/Contrats";
import Configuration from "@/pages/Configuration";
import Administrateurs from "@/pages/Administrateurs";

// Portail Chauffeur
import ChauffeurPortal from "@/pages/ChauffeurPortal";

// Portail Client
import ClientLogin from "@/pages/ClientLogin";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Page d'accueil - Choix Admin/Chauffeur */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Authentification Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          
          {/* Authentification Chauffeur */}
          <Route path="/chauffeur/login" element={<ChauffeurLogin />} />
          
          {/* Portail Chauffeur (après connexion) */}
          <Route path="/chauffeur/portal" element={<ChauffeurPortal />} />
          {/* Redirection ancienne route */}
          <Route path="/chauffeur" element={<Navigate to="/chauffeur/login" replace />} />
          
          {/* Authentification Client */}
          <Route path="/client/login" element={<ClientLogin />} />
          
          {/* ERP Admin (protégé) */}
          <Route path="/admin" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="flotte" element={<Flotte />} />
            <Route path="chauffeurs" element={<Chauffeurs />} />
            <Route path="clients" element={<Clients />} />
            <Route path="chantiers" element={<Chantiers />} />
            <Route path="planning" element={<Planning />} />
            <Route path="pointages" element={<Pointages />} />
            <Route path="factures" element={<Factures />} />
            <Route path="contrats" element={<Contrats />} />
            <Route path="configuration" element={<Configuration />} />
            <Route path="administrateurs" element={<Administrateurs />} />
          </Route>
          
          {/* Redirection des anciennes routes vers /admin */}
          <Route path="/flotte" element={<Navigate to="/admin/flotte" replace />} />
          <Route path="/chauffeurs" element={<Navigate to="/admin/chauffeurs" replace />} />
          <Route path="/clients" element={<Navigate to="/admin/clients" replace />} />
          <Route path="/chantiers" element={<Navigate to="/admin/chantiers" replace />} />
          <Route path="/planning" element={<Navigate to="/admin/planning" replace />} />
          <Route path="/pointages" element={<Navigate to="/admin/pointages" replace />} />
          <Route path="/factures" element={<Navigate to="/admin/factures" replace />} />
          <Route path="/contrats" element={<Navigate to="/admin/contrats" replace />} />
          <Route path="/configuration" element={<Navigate to="/admin/configuration" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
