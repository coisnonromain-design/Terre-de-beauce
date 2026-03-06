import { useEffect, useState } from "react";
import axios from "axios";
import {
  Truck,
  Container,
  Users,
  Building2,
  HardHat,
  Calendar,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StatCard = ({ icon: Icon, value, label, subValue, color, testId }) => (
  <Card className="hover:shadow-md transition-shadow duration-200" data-testid={testId}>
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-4xl font-bold font-['Barlow_Condensed'] text-foreground">
            {value}
          </p>
          {subValue && (
            <p className="text-sm text-muted-foreground mt-1">{subValue}</p>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentChantiers, setRecentChantiers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, chantiersRes] = await Promise.all([
          axios.get(`${API}/dashboard/stats`),
          axios.get(`${API}/chantiers`),
        ]);
        setStats(statsRes.data);
        setRecentChantiers(chantiersRes.data.slice(0, 5));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A4D2E]"></div>
      </div>
    );
  }

  const getStatusBadge = (statut) => {
    const statusStyles = {
      planifie: "bg-indigo-100 text-indigo-700 border-indigo-200",
      en_cours: "bg-green-100 text-green-700 border-green-200",
      termine: "bg-slate-100 text-slate-600 border-slate-200",
      annule: "bg-red-100 text-red-700 border-red-200",
    };
    const statusLabels = {
      planifie: "Planifié",
      en_cours: "En cours",
      termine: "Terminé",
      annule: "Annulé",
    };
    return (
      <Badge className={`${statusStyles[statut]} border font-medium`}>
        {statusLabels[statut]}
      </Badge>
    );
  };

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-bold font-['Barlow_Condensed'] tracking-tight text-foreground">
          Tableau de bord
        </h1>
        <p className="text-muted-foreground mt-1">
          Vue d'ensemble de votre activité
        </p>
      </div>

      {/* Stats Grid - Bento Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Truck}
          value={stats?.total_tracteurs || 0}
          label="Tracteurs"
          subValue={`${stats?.tracteurs_disponibles || 0} disponibles`}
          color="bg-[#1A4D2E] text-white"
          testId="stat-tracteurs"
        />
        <StatCard
          icon={Container}
          value={stats?.total_equipements || 0}
          label="Équipements"
          subValue={`${stats?.equipements_disponibles || 0} disponibles`}
          color="bg-[#D9A520] text-[#1A1D1F]"
          testId="stat-equipements"
        />
        <StatCard
          icon={Users}
          value={stats?.total_chauffeurs || 0}
          label="Chauffeurs"
          subValue={`${stats?.chauffeurs_disponibles || 0} disponibles`}
          color="bg-slate-600 text-white"
          testId="stat-chauffeurs"
        />
        <StatCard
          icon={Building2}
          value={stats?.total_clients || 0}
          label="Clients"
          color="bg-blue-600 text-white"
          testId="stat-clients"
        />
      </div>

      {/* Activity Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chantiers en cours */}
        <Card className="lg:col-span-2" data-testid="chantiers-card">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-['Barlow_Condensed'] flex items-center gap-2">
                <HardHat className="w-5 h-5 text-[#D9A520]" />
                Chantiers récents
              </CardTitle>
              <Badge variant="secondary">
                {stats?.chantiers_en_cours || 0} en cours
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentChantiers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <HardHat className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Aucun chantier pour le moment</p>
                <p className="text-sm">Créez votre premier chantier dans la section Chantiers</p>
              </div>
            ) : (
              <div className="divide-y">
                {recentChantiers.map((chantier) => (
                  <div
                    key={chantier.id}
                    className="p-4 hover:bg-muted/50 transition-colors"
                    data-testid={`chantier-item-${chantier.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{chantier.reference}</p>
                        <p className="text-sm text-muted-foreground">
                          {chantier.client_nom || "Client"} • {chantier.lieu}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          {new Date(chantier.date_debut).toLocaleDateString("fr-FR")}
                        </span>
                        {getStatusBadge(chantier.statut)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card data-testid="quick-stats-card">
          <CardHeader className="border-b">
            <CardTitle className="text-xl font-['Barlow_Condensed'] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#1A4D2E]" />
              Activité
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Chantiers planifiés</p>
                  <p className="text-sm text-muted-foreground">À venir</p>
                </div>
              </div>
              <span className="text-2xl font-bold font-['Barlow_Condensed']">
                {stats?.chantiers_planifies || 0}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <HardHat className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">En cours</p>
                  <p className="text-sm text-muted-foreground">Actifs</p>
                </div>
              </div>
              <span className="text-2xl font-bold font-['Barlow_Condensed']">
                {stats?.chantiers_en_cours || 0}
              </span>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {(stats?.total_tracteurs || 0) - (stats?.tracteurs_disponibles || 0)} tracteur(s) en mission
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
