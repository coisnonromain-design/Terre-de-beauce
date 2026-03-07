import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  ClipboardList,
  Search,
  Calendar,
  Clock,
  Weight,
  RotateCcw,
  User,
  HardHat,
  Download,
  FileDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Pointages() {
  const [pointages, setPointages] = useState([]);
  const [chantiers, setChantiers] = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chantierFilter, setChantierFilter] = useState("all");
  const [chauffeurFilter, setChauffeurFilter] = useState("all");
  const [searchDate, setSearchDate] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pointagesRes, chantiersRes, chauffeursRes] = await Promise.all([
        axios.get(`${API}/pointages`),
        axios.get(`${API}/chantiers`),
        axios.get(`${API}/chauffeurs`),
      ]);
      setPointages(pointagesRes.data);
      setChantiers(chantiersRes.data);
      setChauffeurs(chauffeursRes.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const filteredPointages = pointages.filter((p) => {
    const matchesChantier = chantierFilter === "all" || p.chantier_id === chantierFilter;
    const matchesChauffeur = chauffeurFilter === "all" || p.chauffeur_id === chauffeurFilter;
    const matchesDate = !searchDate || p.date === searchDate;
    return matchesChantier && matchesChauffeur && matchesDate;
  });

  // Stats
  const totalHeures = filteredPointages.reduce((sum, p) => sum + (p.heures_travaillees || 0), 0);
  const totalTonnage = filteredPointages.reduce((sum, p) => sum + (p.tonnage_transporte || 0), 0);
  const totalRotations = filteredPointages.reduce((sum, p) => sum + (p.nombre_rotations || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A4D2E]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="pointages-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-['Barlow_Condensed'] tracking-tight">
            Pointages
          </h1>
          <p className="text-muted-foreground mt-1">
            Suivi des heures et volumes transportés
          </p>
        </div>
        <div className="flex items-center gap-1 border rounded-md">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-9 px-3"
            title="Exporter en CSV"
            data-testid="export-pointages-csv-btn"
          >
            <a href={`${API}/export/pointages?format=csv${chantierFilter !== 'all' ? `&chantier_id=${chantierFilter}` : ''}${chauffeurFilter !== 'all' ? `&chauffeur_id=${chauffeurFilter}` : ''}`} download>
              <Download className="w-4 h-4 mr-1" />
              CSV
            </a>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-9 px-3 border-l"
            title="Exporter en Excel"
            data-testid="export-pointages-excel-btn"
          >
            <a href={`${API}/export/pointages?format=excel${chantierFilter !== 'all' ? `&chantier_id=${chantierFilter}` : ''}${chauffeurFilter !== 'all' ? `&chauffeur_id=${chauffeurFilter}` : ''}`} download>
              <FileDown className="w-4 h-4 mr-1" />
              Excel
            </a>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total heures</p>
                <p className="text-2xl font-bold font-['Barlow_Condensed']">{totalHeures.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Weight className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total tonnage</p>
                <p className="text-2xl font-bold font-['Barlow_Condensed']">{totalTonnage.toFixed(1)}T</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total rotations</p>
                <p className="text-2xl font-bold font-['Barlow_Condensed']">{totalRotations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="w-40"
            data-testid="filter-date"
          />
        </div>
        <Select value={chantierFilter} onValueChange={setChantierFilter}>
          <SelectTrigger className="w-48" data-testid="filter-chantier">
            <SelectValue placeholder="Tous les chantiers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les chantiers</SelectItem>
            {chantiers.map((chantier) => (
              <SelectItem key={chantier.id} value={chantier.id}>
                {chantier.reference}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={chauffeurFilter} onValueChange={setChauffeurFilter}>
          <SelectTrigger className="w-48" data-testid="filter-chauffeur">
            <SelectValue placeholder="Tous les chauffeurs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les chauffeurs</SelectItem>
            {chauffeurs.map((chauffeur) => (
              <SelectItem key={chauffeur.id} value={chauffeur.id}>
                {chauffeur.prenom} {chauffeur.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(searchDate || chantierFilter !== "all" || chauffeurFilter !== "all") && (
          <button
            onClick={() => {
              setSearchDate("");
              setChantierFilter("all");
              setChauffeurFilter("all");
            }}
            className="text-sm text-[#1A4D2E] hover:underline"
          >
            Réinitialiser filtres
          </button>
        )}
      </div>

      {/* Pointages Table */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-xl font-['Barlow_Condensed'] flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#D9A520]" />
            Liste des pointages ({filteredPointages.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredPointages.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun pointage trouvé</p>
              <p className="text-sm">Les chauffeurs peuvent saisir leurs heures via le portail chauffeur</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Chauffeur</TableHead>
                  <TableHead>Chantier</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Heures</TableHead>
                  <TableHead className="text-right">Tonnage</TableHead>
                  <TableHead className="text-right">Rotations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPointages.map((pointage) => (
                  <TableRow key={pointage.id} data-testid={`pointage-row-${pointage.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {new Date(pointage.date).toLocaleDateString("fr-FR")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-medium">
                          {pointage.chauffeur_nom?.split(' ').map(n => n[0]).join('')}
                        </div>
                        {pointage.chauffeur_nom}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <HardHat className="w-3 h-3" />
                        {pointage.chantier_reference}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {pointage.client_nom}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {pointage.heures_travaillees?.toFixed(1)}h
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {pointage.tonnage_transporte?.toFixed(1)}T
                    </TableCell>
                    <TableCell className="text-right">
                      {pointage.nombre_rotations}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
