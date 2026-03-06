import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Flotte from "@/pages/Flotte";
import Chauffeurs from "@/pages/Chauffeurs";
import Clients from "@/pages/Clients";
import Chantiers from "@/pages/Chantiers";
import Planning from "@/pages/Planning";
import Pointages from "@/pages/Pointages";
import Factures from "@/pages/Factures";
import Contrats from "@/pages/Contrats";
import ChauffeurPortal from "@/pages/ChauffeurPortal";
import Configuration from "@/pages/Configuration";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Interface chauffeur simplifiée */}
          <Route path="/chauffeur" element={<ChauffeurPortal />} />
          
          {/* ERP principal */}
          <Route path="/" element={<Layout />}>
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
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
