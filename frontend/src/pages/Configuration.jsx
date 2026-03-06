import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Settings,
  Building2,
  Save,
  CreditCard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A4D2E]"></div>
      </div>
    );
  }

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

      {/* DocuSign Info */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-xl font-['Barlow_Condensed'] flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#1A4D2E]" />
            Signature électronique (DocuSign)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-800 font-medium">Configuration en attente</p>
            <p className="text-sm text-amber-700 mt-1">
              Pour activer la signature électronique des contrats et factures, 
              vous devez fournir vos clés API DocuSign :
            </p>
            <ul className="text-sm text-amber-700 mt-2 list-disc list-inside space-y-1">
              <li>Integration Key (Client ID)</li>
              <li>Secret Key</li>
            </ul>
            <p className="text-sm text-amber-700 mt-2">
              Créez votre compte développeur sur{" "}
              <a
                href="https://developers.docusign.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                developers.docusign.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
