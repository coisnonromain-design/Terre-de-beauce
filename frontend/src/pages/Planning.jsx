import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Truck,
  Container,
  Users,
  HardHat,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusConfig = {
  planifie: { label: "Planifié", class: "bg-indigo-500", textClass: "text-indigo-700" },
  en_cours: { label: "En cours", class: "bg-green-500", textClass: "text-green-700" },
  termine: { label: "Terminé", class: "bg-slate-400", textClass: "text-slate-600" },
  annule: { label: "Annulé", class: "bg-red-400", textClass: "text-red-600" },
};

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function Planning() {
  const [chantiers, setChantiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);

  useEffect(() => {
    fetchChantiers();
  }, []);

  const fetchChantiers = async () => {
    try {
      const res = await axios.get(`${API}/chantiers`);
      setChantiers(res.data);
    } catch (error) {
      console.error("Error fetching chantiers:", error);
    } finally {
      setLoading(false);
    }
  };

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const allDays = eachDayOfInterval({ start, end });
    
    // Add padding days from previous month
    const startDay = start.getDay();
    const paddingDays = startDay === 0 ? 6 : startDay - 1;
    const prevMonthDays = [];
    for (let i = paddingDays; i > 0; i--) {
      const d = new Date(start);
      d.setDate(d.getDate() - i);
      prevMonthDays.push(d);
    }
    
    // Add padding days for next month
    const endDay = end.getDay();
    const nextPaddingDays = endDay === 0 ? 0 : 7 - endDay;
    const nextMonthDays = [];
    for (let i = 1; i <= nextPaddingDays; i++) {
      const d = new Date(end);
      d.setDate(d.getDate() + i);
      nextMonthDays.push(d);
    }
    
    return [...prevMonthDays, ...allDays, ...nextMonthDays];
  }, [currentMonth]);

  const getChantierForDay = (day) => {
    return chantiers.filter((chantier) => {
      const startDate = parseISO(chantier.date_debut);
      const endDate = chantier.date_fin ? parseISO(chantier.date_fin) : startDate;
      return isWithinInterval(day, { start: startDate, end: endDate }) ||
             isSameDay(day, startDate) ||
             isSameDay(day, endDate);
    });
  };

  const handleDayClick = (day) => {
    const dayChantiers = getChantierForDay(day);
    if (dayChantiers.length > 0) {
      setSelectedDay({ date: day, chantiers: dayChantiers });
      setDayDialogOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A4D2E]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="planning-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-['Barlow_Condensed'] tracking-tight">
            Planning
          </h1>
          <p className="text-muted-foreground mt-1">
            Vue calendrier des chantiers
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {Object.entries(statusConfig).map(([key, config]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${config.class}`} />
            <span className="text-sm text-muted-foreground">{config.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-['Barlow_Condensed'] flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[#D9A520]" />
              {format(currentMonth, "MMMM yyyy", { locale: fr })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                data-testid="prev-month-btn"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentMonth(new Date())}
                data-testid="today-btn"
              >
                Aujourd'hui
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                data-testid="next-month-btn"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {/* Days header */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const dayChantiers = getChantierForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());
              
              return (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleDayClick(day)}
                        className={`
                          min-h-24 p-2 rounded-md border text-left
                          transition-colors duration-150
                          ${isCurrentMonth ? "bg-white" : "bg-muted/30"}
                          ${isToday ? "ring-2 ring-[#D9A520] ring-offset-1" : ""}
                          ${dayChantiers.length > 0 ? "cursor-pointer hover:bg-muted/50" : "cursor-default"}
                        `}
                        data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
                      >
                        <span
                          className={`
                            text-sm font-medium
                            ${isCurrentMonth ? "text-foreground" : "text-muted-foreground"}
                            ${isToday ? "bg-[#1A4D2E] text-white rounded-full w-6 h-6 flex items-center justify-center" : ""}
                          `}
                        >
                          {format(day, "d")}
                        </span>
                        
                        {/* Chantiers for this day */}
                        <div className="mt-1 space-y-1">
                          {dayChantiers.slice(0, 3).map((chantier) => (
                            <div
                              key={chantier.id}
                              className={`
                                text-xs px-1.5 py-0.5 rounded truncate
                                ${statusConfig[chantier.statut].class} text-white
                              `}
                            >
                              {chantier.reference}
                            </div>
                          ))}
                          {dayChantiers.length > 3 && (
                            <div className="text-xs text-muted-foreground px-1">
                              +{dayChantiers.length - 3} autres
                            </div>
                          )}
                        </div>
                      </button>
                    </TooltipTrigger>
                    {dayChantiers.length > 0 && (
                      <TooltipContent>
                        <p>{dayChantiers.length} chantier(s)</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming chantiers */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-xl font-['Barlow_Condensed'] flex items-center gap-2">
            <HardHat className="w-5 h-5 text-[#1A4D2E]" />
            Chantiers en cours et à venir
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {chantiers.filter(c => c.statut === "en_cours" || c.statut === "planifie").length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun chantier planifié ou en cours</p>
            </div>
          ) : (
            <div className="divide-y">
              {chantiers
                .filter(c => c.statut === "en_cours" || c.statut === "planifie")
                .sort((a, b) => new Date(a.date_debut) - new Date(b.date_debut))
                .slice(0, 10)
                .map((chantier) => (
                  <div key={chantier.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{chantier.reference}</span>
                          <Badge className={`${statusConfig[chantier.statut].class} text-white text-xs`}>
                            {statusConfig[chantier.statut].label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {chantier.client_nom} • {chantier.lieu}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(chantier.date_debut), "d MMMM yyyy", { locale: fr })}
                          {chantier.date_fin && ` → ${format(parseISO(chantier.date_fin), "d MMMM yyyy", { locale: fr })}`}
                        </p>
                      </div>
                      {chantier.affectations?.length > 0 && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-1 text-[#1A4D2E]">
                            <Truck className="w-4 h-4" />
                            <span>{chantier.affectations.length}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Day Detail Dialog */}
      <Dialog open={dayDialogOpen} onOpenChange={setDayDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-['Barlow_Condensed'] text-2xl">
              {selectedDay && format(selectedDay.date, "EEEE d MMMM yyyy", { locale: fr })}
            </DialogTitle>
          </DialogHeader>
          {selectedDay && (
            <div className="space-y-4">
              {selectedDay.chantiers.map((chantier) => (
                <div key={chantier.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{chantier.reference}</span>
                    <Badge className={`${statusConfig[chantier.statut].class} text-white`}>
                      {statusConfig[chantier.statut].label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {chantier.client_nom} • {chantier.lieu}
                  </p>
                  
                  {chantier.affectations?.length > 0 && (
                    <div className="space-y-2 mt-3 pt-3 border-t">
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        Affectations
                      </p>
                      {chantier.affectations.map((aff, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-[#1A4D2E]" />
                            <span>{aff.tracteur_identifiant}</span>
                          </div>
                          <span className="text-muted-foreground">+</span>
                          <div className="flex items-center gap-1">
                            <Container className="w-3.5 h-3.5 text-[#D9A520]" />
                            <span>{aff.equipement_numero}</span>
                          </div>
                          <span className="text-muted-foreground">+</span>
                          <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-600" />
                            <span>{aff.chauffeur_nom}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
