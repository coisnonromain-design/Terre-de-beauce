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
  Euro,
  FileText,
  Clock,
  Bell,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StatCard = ({ icon: Icon, value, label, subValue, color, trend, testId }) => (
  <Card className="hover:shadow-md transition-shadow duration-200" data-testid={testId}>
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-4xl font-bold font-['Barlow_Condensed'] text-foreground">
            {value}
          </p>
          {subValue && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              {trend === "up" && <ArrowUpRight className="w-3 h-3 text-green-500" />}
              {trend === "down" && <ArrowDownRight className="w-3 h-3 text-red-500" />}
              {subValue}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const KPICard = ({ title, value, subtitle, icon: Icon, trend, color }) => (
  <div className="p-4 rounded-lg bg-gradient-to-br from-white to-slate-50 border">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium text-muted-foreground">{title}</span>
      <div className={`w-8 h-8 rounded-md flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <p className="text-2xl font-bold font-['Barlow_Condensed']">{value}</p>
    {subtitle && (
      <p className={`text-xs mt-1 flex items-center gap-1 ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-muted-foreground'}`}>
        {trend === "up" && <ArrowUpRight className="w-3 h-3" />}
        {trend === "down" && <ArrowDownRight className="w-3 h-3" />}
        {subtitle}
      </p>
    )}
  </div>
);

const NotificationItem = ({ notification }) => {
  const priorityColors = {
    high: "border-l-red-500 bg-red-50/50",
    medium: "border-l-amber-500 bg-amber-50/50",
    low: "border-l-blue-500 bg-blue-50/50",
  };
  
  const priorityBadge = {
    high: "bg-red-100 text-red-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-blue-100 text-blue-700",
  };

  return (
    <div 
      className={`p-3 border-l-4 rounded-r-md ${priorityColors[notification.priority]} hover:opacity-90 transition-opacity cursor-pointer`}
      data-testid={`notification-${notification.type}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="font-medium text-sm">{notification.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{notification.message}</p>
        </div>
        <Badge className={`${priorityBadge[notification.priority]} text-xs`}>
          {notification.priority === 'high' ? 'Urgent' : notification.priority === 'medium' ? 'Important' : 'Info'}
        </Badge>
      </div>
      {notification.montant && (
        <p className="text-xs font-semibold text-[#1A4D2E] mt-1">
          {notification.montant.toLocaleString('fr-FR')} €
        </p>
      )}
    </div>
  );
};

const CHART_COLORS = ['#1A4D2E', '#D9A520', '#3B82F6', '#EF4444', '#8B5CF6'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [notifications, setNotifications] = useState(null);
  const [recentChantiers, setRecentChantiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, dashRes, notifsRes, chantiersRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/stats/dashboard`),
        axios.get(`${API}/notifications`),
        axios.get(`${API}/chantiers`),
      ]);
      setStats(statsRes.data);
      setDashboardStats(dashRes.data);
      setNotifications(notifsRes.data);
      setRecentChantiers(chantiersRes.data.slice(0, 5));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

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

  // Prepare chart data - map nested API response to expected format
  const caEvolution = dashboardStats?.evolution_ca || [];
  const facturesParStatut = [
    { name: 'En attente', value: dashboardStats?.facturation?.factures_en_attente || 0, color: '#D9A520' },
    { name: 'Payées', value: dashboardStats?.facturation?.factures_payees || 0, color: '#1A4D2E' },
  ];
  
  const topClients = dashboardStats?.top_clients || [];
  
  // Extract nested values for easier access
  const caMois = dashboardStats?.facturation?.ca_mois || 0;
  const caAnnee = dashboardStats?.facturation?.ca_annee || 0;
  const facturesEnAttente = dashboardStats?.facturation?.factures_en_attente || 0;
  const heuresMois = dashboardStats?.activite_mois?.heures || 0;
  const toursMois = dashboardStats?.activite_mois?.tours || 0;
  const volumeMois = dashboardStats?.activite_mois?.volume || 0;
  const chantiersActifs = dashboardStats?.chantiers?.actifs || 0;
  const chantiersTermines = dashboardStats?.chantiers?.termines || 0;
  const contratsSigns = dashboardStats?.contrats?.signes || 0;
  const contratsEnAttente = dashboardStats?.contrats?.en_attente || 0;

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold font-['Barlow_Condensed'] tracking-tight text-foreground">
            Tableau de bord
          </h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble de votre activité
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
          data-testid="refresh-dashboard-btn"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* KPI Section - Chiffre d'Affaires */}
      <Card className="border-[#1A4D2E]/20 bg-gradient-to-r from-[#1A4D2E]/5 to-transparent">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KPICard
              title="CA du mois"
              value={`${caMois.toLocaleString('fr-FR')} €`}
              icon={Euro}
              color="bg-[#1A4D2E] text-white"
            />
            <KPICard
              title="CA de l'année"
              value={`${caAnnee.toLocaleString('fr-FR')} €`}
              icon={TrendingUp}
              color="bg-[#D9A520] text-white"
            />
            <KPICard
              title="Factures en attente"
              value={facturesEnAttente}
              subtitle="À relancer"
              icon={FileText}
              color="bg-amber-500 text-white"
            />
            <KPICard
              title="Heures ce mois"
              value={`${heuresMois.toFixed(0)}h`}
              subtitle={`${toursMois} tours effectués`}
              icon={Clock}
              color="bg-blue-500 text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
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
          subValue={`${stats?.chauffeurs_disponibles || 0} actifs`}
          color="bg-slate-600 text-white"
          testId="stat-chauffeurs"
        />
        <StatCard
          icon={HardHat}
          value={chantiersActifs}
          label="Chantiers actifs"
          subValue={`${chantiersTermines} terminés`}
          color="bg-blue-600 text-white"
          testId="stat-chantiers"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CA Evolution Chart */}
        <Card className="lg:col-span-2" data-testid="ca-evolution-chart">
          <CardHeader className="border-b">
            <CardTitle className="text-xl font-['Barlow_Condensed'] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#1A4D2E]" />
              Évolution du chiffre d'affaires
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {caEvolution.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={caEvolution}>
                  <defs>
                    <linearGradient id="caGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1A4D2E" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#1A4D2E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="mois" 
                    tick={{ fontSize: 12 }} 
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `${(v/1000).toFixed(0)}k€`}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value.toLocaleString('fr-FR')} €`, 'CA']}
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="montant" 
                    stroke="#1A4D2E" 
                    strokeWidth={2}
                    fill="url(#caGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Pas de données disponibles</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications Panel */}
        <Card data-testid="notifications-panel">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-['Barlow_Condensed'] flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#D9A520]" />
                Notifications
              </CardTitle>
              {notifications && (
                <div className="flex gap-1">
                  {notifications.high > 0 && (
                    <Badge className="bg-red-500 text-white text-xs">{notifications.high}</Badge>
                  )}
                  {notifications.medium > 0 && (
                    <Badge className="bg-amber-500 text-white text-xs">{notifications.medium}</Badge>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-3 space-y-2 max-h-[340px] overflow-y-auto">
            {notifications?.notifications?.length > 0 ? (
              notifications.notifications.slice(0, 6).map((notif, index) => (
                <NotificationItem key={index} notification={notif} />
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune notification</p>
                <p className="text-xs">Tout est en ordre !</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Chantiers */}
        <Card className="lg:col-span-2" data-testid="chantiers-card">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-['Barlow_Condensed'] flex items-center gap-2">
                <HardHat className="w-5 h-5 text-[#D9A520]" />
                Chantiers récents
              </CardTitle>
              <Badge variant="secondary">
                {stats?.chantiers_en_cours || dashboardStats?.chantiers_actifs || 0} en cours
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentChantiers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <HardHat className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Aucun chantier pour le moment</p>
                <p className="text-sm">Créez votre premier chantier</p>
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

        {/* Top Clients */}
        <Card data-testid="top-clients-card">
          <CardHeader className="border-b">
            <CardTitle className="text-xl font-['Barlow_Condensed'] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-500" />
              Top Clients
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {topClients.length > 0 ? (
              <div className="space-y-3">
                {topClients.slice(0, 5).map((client, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      >
                        {index + 1}
                      </div>
                      <span className="font-medium text-sm truncate max-w-[120px]" title={client.nom}>
                        {client.nom}
                      </span>
                    </div>
                    <span className="font-bold text-[#1A4D2E]">
                      {client.ca?.toLocaleString('fr-FR')} €
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucun client facturé</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Footer */}
      <Card className="bg-slate-50/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#1A4D2E]"></div>
                <span className="text-muted-foreground">Contrats signés:</span>
                <span className="font-bold">{contratsSigns}</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-muted-foreground">En attente:</span>
                <span className="font-bold">{contratsEnAttente}</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-muted-foreground">Volume ce mois:</span>
                <span className="font-bold">{volumeMois.toFixed(1)} m³</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
