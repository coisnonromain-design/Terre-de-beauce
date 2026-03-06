import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Settings,
  Building2,
  Save,
  CreditCard,
  TruckIcon,
  Droplets,
  Fuel,
  Clock,
  CircleOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Composant pour afficher et éditer un barème
function BaremeEditor({ bareme, onChange, unite }) {
  const handlePriceChange = (index, value) => {
    const newTranches = [...bareme.tranches];
    newTranches[index] = {
      ...newTranches[index],
      prix_tonne_km: parseFloat(value) || 0,
    };
    onChange({ ...bareme, tranches: newTranches });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
        <div className="col-span-4">Distance (km)</div>
        <div className="col-span-8">Prix par {unite}</div>
      </div>
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
        {bareme.tranches.map((tranche, index) => (
          <div
            key={index}
            className="grid grid-cols-12 gap-2 items-center bg-slate-50 rounded-lg p-2"
          >
            <div className="col-span-4 text-sm font-medium">
              {tranche.km_min.toFixed(1)} - {tranche.km_max.toFixed(1)} km
            </div>
            <div className="col-span-8">
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tranche.prix_tonne_km || ""}
                  onChange={(e) => handlePriceChange(index, e.target.value)}
                  className="pr-8 h-9"
                  placeholder="0.00"
                  data-testid={`bareme-price-${index}`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  €
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Configuration() {
  const [config, setConfig] = useState({
    raison_sociale: "",
    adresse: "",
    code_postal: "",
    ville: "",
    pays: "France",
    siren: "",
    siret: "",
    tva_intracommunautaire: "",
    email: "",
    telephone: "",
    iban: "",
    bic: "",
  });
  const [baremes, setBaremes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingBaremes, setSavingBaremes] = useState(false);
  const [activeBaremeTab, setActiveBaremeTab] = useState("solide_avec_gasoil");

  useEffect(() => {
    fetchConfig();
    fetchBaremes();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await axios.get(`${API}/config/entreprise`);
      setConfig(res.data);
    } catch (error) {
      toast.error("Erreur lors du chargement de la configuration");
    } finally {
      setLoading(false);
    }
  };

  const fetchBaremes = async () => {
    try {
      const res = await axios.get(`${API}/config/baremes`);
      setBaremes(res.data);
    } catch (error) {
      console.error("Erreur chargement barèmes:", error);
      toast.error("Erreur lors du chargement des barèmes");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/config/entreprise`, config);
      toast.success("Configuration enregistrée");
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBaremes = async () => {
    setSavingBaremes(true);
    try {
      await axios.put(`${API}/config/baremes`, {
        solide_avec_gasoil: baremes.solide_avec_gasoil,
        solide_sans_gasoil: baremes.solide_sans_gasoil,
        liquide_avec_gasoil: baremes.liquide_avec_gasoil,
        liquide_sans_gasoil: baremes.liquide_sans_gasoil,
        taux_horaire_minimum: baremes.taux_horaire_minimum,
      });
      toast.success("Barèmes enregistrés");
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement des barèmes");
    } finally {
      setSavingBaremes(false);
    }
  };

  const updateBareme = (type, newBareme) => {
    setBaremes((prev) => ({
      ...prev,
      [type]: newBareme,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A4D2E]"></div>
      </div>
    );
  }

  const baremeTabInfo = {
    solide_avec_gasoil: {
      label: "Solide + Gasoil",
      icon: <TruckIcon className="w-4 h-4" />,
      iconFuel: <Fuel className="w-4 h-4 text-green-600" />,
      description: "Transport de matières solides (céréales, etc.) avec gasoil fourni",
      unite: "tonne",
    },
    solide_sans_gasoil: {
      label: "Solide sans Gasoil",
      icon: <TruckIcon className="w-4 h-4" />,
      iconFuel: <CircleOff className="w-4 h-4 text-orange-500" />,
      description: "Transport de matières solides sans gasoil fourni",
      unite: "tonne",
    },
    liquide_avec_gasoil: {
      label: "Liquide + Gasoil",
      icon: <Droplets className="w-4 h-4" />,
      iconFuel: <Fuel className="w-4 h-4 text-green-600" />,
      description: "Transport de liquides (engrais, etc.) avec gasoil fourni",
      unite: "m³",
    },
    liquide_sans_gasoil: {
      label: "Liquide sans Gasoil",
      icon: <Droplets className="w-4 h-4" />,
      iconFuel: <CircleOff className="w-4 h-4 text-orange-500" />,
      description: "Transport de liquides sans gasoil fourni",
      unite: "m³",
    },
  };

  return (
    <div className="space-y-6" data-testid="configuration-page">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold font-['Barlow_Condensed'] tracking-tight">
          Configuration
        </h1>
        <p className="text-muted-foreground mt-1">
          Paramètres de l'entreprise et facturation
        </p>
      </div>

      {/* Entreprise Info */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-xl font-['Barlow_Condensed'] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#D9A520]" />
            Informations de l'entreprise
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Raison sociale</Label>
              <Input
                value={config.raison_sociale}
                onChange={(e) => setConfig({ ...config, raison_sociale: e.target.value })}
                placeholder="Nom de l'entreprise"
                data-testid="raison-sociale-input"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={config.email}
                onChange={(e) => setConfig({ ...config, email: e.target.value })}
                placeholder="contact@entreprise.fr"
                data-testid="email-input"
              />
            </div>
          </div>

          <div>
            <Label>Adresse</Label>
            <Input
              value={config.adresse}
              onChange={(e) => setConfig({ ...config, adresse: e.target.value })}
              placeholder="Numéro et nom de rue"
              data-testid="adresse-input"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Code postal</Label>
              <Input
                value={config.code_postal}
                onChange={(e) => setConfig({ ...config, code_postal: e.target.value })}
                placeholder="91660"
                maxLength={5}
                data-testid="cp-input"
              />
            </div>
            <div>
              <Label>Ville</Label>
              <Input
                value={config.ville}
                onChange={(e) => setConfig({ ...config, ville: e.target.value })}
                placeholder="Le Mérévillois"
                data-testid="ville-input"
              />
            </div>
            <div>
              <Label>Pays</Label>
              <Input
                value={config.pays}
                onChange={(e) => setConfig({ ...config, pays: e.target.value })}
                placeholder="France"
                data-testid="pays-input"
              />
            </div>
          </div>

          <div>
            <Label>Téléphone</Label>
            <Input
              value={config.telephone || ""}
              onChange={(e) => setConfig({ ...config, telephone: e.target.value })}
              placeholder="01 23 45 67 89"
              data-testid="telephone-input"
            />
          </div>

          <Separator />

          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Informations légales
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>SIREN</Label>
              <Input
                value={config.siren}
                onChange={(e) => setConfig({ ...config, siren: e.target.value })}
                placeholder="123456789"
                maxLength={9}
                data-testid="siren-input"
              />
            </div>
            <div>
              <Label>SIRET</Label>
              <Input
                value={config.siret}
                onChange={(e) => setConfig({ ...config, siret: e.target.value })}
                placeholder="12345678900012"
                maxLength={14}
                data-testid="siret-input"
              />
            </div>
            <div>
              <Label>N° TVA Intracommunautaire</Label>
              <Input
                value={config.tva_intracommunautaire}
                onChange={(e) => setConfig({ ...config, tva_intracommunautaire: e.target.value })}
                placeholder="FR12345678901"
                data-testid="tva-input"
              />
            </div>
          </div>

          <Separator />

          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Coordonnées bancaires (pour les factures)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>IBAN</Label>
              <Input
                value={config.iban || ""}
                onChange={(e) => setConfig({ ...config, iban: e.target.value })}
                placeholder="FR76 1234 5678 9012 3456 7890 123"
                data-testid="iban-input"
              />
            </div>
            <div>
              <Label>BIC</Label>
              <Input
                value={config.bic || ""}
                onChange={(e) => setConfig({ ...config, bic: e.target.value })}
                placeholder="BNPAFRPP"
                data-testid="bic-input"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#1A4D2E] hover:bg-[#143d24]"
              data-testid="save-config-btn"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Barèmes Kilométriques */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-xl font-['Barlow_Condensed'] flex items-center gap-2">
            <TruckIcon className="w-5 h-5 text-[#D9A520]" />
            Barèmes Kilométriques
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {baremes ? (
            <div className="space-y-6">
              {/* Taux horaire minimum */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <h4 className="font-semibold text-amber-800">Taux Horaire Minimum</h4>
                </div>
                <p className="text-sm text-amber-700 mb-3">
                  Si le montant facturé au volume pour une journée est inférieur à ce seuil, 
                  la facturation basculera automatiquement sur le tarif horaire.
                </p>
                <div className="flex items-center gap-3">
                  <Label className="text-amber-800 whitespace-nowrap">Taux minimum :</Label>
                  <div className="relative w-40">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={baremes.taux_horaire_minimum || ""}
                      onChange={(e) =>
                        setBaremes({
                          ...baremes,
                          taux_horaire_minimum: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="pr-12"
                      placeholder="0.00"
                      data-testid="taux-horaire-minimum-input"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      €/h
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabs pour les 4 barèmes */}
              <Tabs value={activeBaremeTab} onValueChange={setActiveBaremeTab}>
                <TabsList className="grid grid-cols-4 mb-4">
                  {Object.entries(baremeTabInfo).map(([key, info]) => (
                    <TabsTrigger
                      key={key}
                      value={key}
                      className="flex items-center gap-1 text-xs sm:text-sm"
                      data-testid={`bareme-tab-${key}`}
                    >
                      {info.icon}
                      {info.iconFuel}
                      <span className="hidden sm:inline">{info.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {Object.entries(baremeTabInfo).map(([key, info]) => (
                  <TabsContent key={key} value={key}>
                    <div className="bg-slate-50/50 rounded-lg p-4 mb-4">
                      <p className="text-sm text-muted-foreground">{info.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tranches de 2,5 km jusqu'à 50 km • Tarifs en € par {info.unite}
                      </p>
                    </div>
                    {baremes[key] && (
                      <BaremeEditor
                        bareme={baremes[key]}
                        onChange={(newBareme) => updateBareme(key, newBareme)}
                        unite={info.unite}
                      />
                    )}
                  </TabsContent>
                ))}
              </Tabs>

              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={handleSaveBaremes}
                  disabled={savingBaremes}
                  className="bg-[#1A4D2E] hover:bg-[#143d24]"
                  data-testid="save-baremes-btn"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {savingBaremes ? "Enregistrement..." : "Enregistrer les barèmes"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A4D2E]"></div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DocuSign Info */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-xl font-['Barlow_Condensed'] flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#1A4D2E]" />
            Signature électronique (DocuSign)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium">DocuSign configuré</p>
            <p className="text-sm text-green-700 mt-1">
              L'intégration DocuSign est active. Vous pouvez envoyer des factures 
              pour signature électronique depuis la page Factures.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
