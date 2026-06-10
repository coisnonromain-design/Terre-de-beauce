import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Truck,
  Clock,
  MapPin,
  HardHat,
  Calendar,
  Save,
  LogOut,
  Plus,
  Trash2,
  Route,
  Camera,
  Receipt,
  Wifi,
  WifiOff,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Image,
  Euro,
  FolderArchive,
  FileSignature,
  Download,
  FileCheck2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// IndexedDB pour le mode hors-ligne
const DB_NAME = 'TerreDeBeauceDB';
const DB_VERSION = 1;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-pointages')) {
        db.createObjectStore('pending-pointages', { keyPath: 'offline_id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('pending-notes-frais')) {
        db.createObjectStore('pending-notes-frais', { keyPath: 'offline_id', autoIncrement: true });
      }
    };
  });
}

async function savePendingPointage(pointage) {
  const db = await openDatabase();
  const tx = db.transaction('pending-pointages', 'readwrite');
  const store = tx.objectStore('pending-pointages');
  await store.add({ ...pointage, offline_id: Date.now() });
}

async function getPendingPointages() {
  const db = await openDatabase();
  const tx = db.transaction('pending-pointages', 'readonly');
  const store = tx.objectStore('pending-pointages');
  return new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve([]);
  });
}

async function clearPendingPointages() {
  const db = await openDatabase();
  const tx = db.transaction('pending-pointages', 'readwrite');
  const store = tx.objectStore('pending-pointages');
  await store.clear();
}

const typesFrais = [
  { value: 'carburant', label: 'Carburant', icon: '⛽' },
  { value: 'peage', label: 'Péage', icon: '🛣️' },
  { value: 'repas', label: 'Repas', icon: '🍽️' },
  { value: 'hebergement', label: 'Hébergement', icon: '🏨' },
  { value: 'autre', label: 'Autre', icon: '📋' },
];

export default function ChauffeurPortal() {
  const navigate = useNavigate();
  const [chauffeur, setChauffeur] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chantiers, setChantiers] = useState([]);
  const [pointages, setPointages] = useState([]);
  const [notesFrais, setNotesFrais] = useState([]);
  const [saving, setSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [showTours, setShowTours] = useState(true);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [notesFraisOpen, setNotesFraisOpen] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [photoType, setPhotoType] = useState('pointage'); // 'pointage' ou 'note_frais'
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [signingDocId, setSigningDocId] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [form, setForm] = useState({
    chantier_id: "",
    date: new Date().toISOString().split("T")[0],
    heures_travaillees: "",
  });

  const [tours, setTours] = useState([]);
  const [photos, setPhotos] = useState([]);

  const [noteFraisForm, setNoteFraisForm] = useState({
    date: new Date().toISOString().split("T")[0],
    montant: "",
    type_frais: "carburant",
    description: "",
    photo_base64: null,
  });

  // Gestion online/offline
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Connexion rétablie");
      syncOfflineData();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Mode hors-ligne activé");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const savedChauffeur = localStorage.getItem("chauffeur_session");
    if (!savedChauffeur) {
      navigate("/chauffeur/login");
      return;
    }
    
    const session = JSON.parse(savedChauffeur);
    setChauffeur(session);
    fetchData(session.chauffeur_id);
    checkPendingSync();
    setLoading(false);

    // Gestion du retour de signature DocuSign
    const params = new URLSearchParams(window.location.search);
    if (params.get("docusign_return") === "1" && params.get("documentId")) {
      const docId = params.get("documentId");
      const event = params.get("event");
      window.history.replaceState({}, "", "/chauffeur/portal");
      handleDocusignReturn(docId, event, session.chauffeur_id);
    }
  }, [navigate]);

  const checkPendingSync = async () => {
    const pending = await getPendingPointages();
    setPendingSync(pending.length);
  };

  const syncOfflineData = async () => {
    if (!isOnline) return;
    
    setSyncing(true);
    try {
      const pending = await getPendingPointages();
      if (pending.length > 0) {
        await axios.post(`${API}/sync/pointages`, pending);
        await clearPendingPointages();
        setPendingSync(0);
        toast.success(`${pending.length} pointage(s) synchronisé(s)`);
        fetchData(chauffeur?.chauffeur_id);
      }
    } catch (error) {
      console.error("Erreur sync:", error);
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("chauffeur_session");
    toast.success("Déconnexion réussie");
    navigate("/");
  };

  const fetchData = async (chauffeurId) => {
    try {
      const [chantiersRes, pointagesRes, notesRes, docsRes] = await Promise.all([
        axios.get(`${API}/chantiers?statut=en_cours`),
        axios.get(`${API}/pointages?chauffeur_id=${chauffeurId}`),
        axios.get(`${API}/notes-frais?chauffeur_id=${chauffeurId}`),
        axios.get(`${API}/documents/chauffeur/${chauffeurId}`),
      ]);
      setChantiers(chantiersRes.data);
      setPointages(pointagesRes.data);
      setNotesFrais(notesRes.data);
      setDocuments(docsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Lancer la signature intégrée DocuSign d'un document
  const handleSignDocument = async (documentId) => {
    setSigningDocId(documentId);
    try {
      const returnUrl = `${window.location.origin}/chauffeur/portal?docusign_return=1&documentId=${documentId}`;
      const res = await axios.post(
        `${API}/documents/${documentId}/sign?return_url=${encodeURIComponent(returnUrl)}`
      );
      if (res.data.signing_url) {
        window.location.href = res.data.signing_url;
      } else {
        toast.error("Impossible d'ouvrir la signature");
        setSigningDocId(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'ouverture de la signature");
      setSigningDocId(null);
    }
  };

  const downloadChauffeurDoc = (doc, signed) => {
    window.open(`${API}/documents/${doc.id}/download${signed ? "?signed=true" : ""}`, "_blank");
  };

  const handleDocusignReturn = async (documentId, event, chauffeurId) => {
    setDocumentsOpen(true);
    try {
      const res = await axios.post(`${API}/documents/${documentId}/sync`);
      if (res.data.signe) {
        toast.success("Document signé avec succès !");
      } else if (event === "signing_complete") {
        toast.info("Signature en cours de traitement, veuillez patienter...");
      } else {
        toast.info("Signature non finalisée");
      }
    } catch (e) {
      console.error("Erreur sync DocuSign:", e);
    } finally {
      fetchData(chauffeurId);
    }
  };

  // Caméra
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOpen(true);
    } catch (error) {
      toast.error("Impossible d'accéder à la caméra");
      console.error("Camera error:", error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      setCapturedPhoto(dataUrl);
      stopCamera();
    }
  };

  const confirmPhoto = () => {
    if (photoType === 'pointage') {
      setPhotos([...photos, { id: Date.now(), url: capturedPhoto }]);
    } else {
      setNoteFraisForm({ ...noteFraisForm, photo_base64: capturedPhoto });
    }
    setCapturedPhoto(null);
  };

  // Gestion des tours
  const addTour = () => {
    setTours([...tours, { 
      id: Date.now().toString(),
      volume: "",
      distance_km: "",
      commentaire: ""
    }]);
  };

  const updateTour = (index, field, value) => {
    const newTours = [...tours];
    newTours[index][field] = value;
    setTours(newTours);
  };

  const removeTour = (index) => {
    setTours(tours.filter((_, i) => i !== index));
  };

  // Sauvegarder le pointage
  const handleSave = async () => {
    if (!form.chantier_id || !form.date) {
      toast.error("Chantier et date requis");
      return;
    }

    setSaving(true);
    
    const pointageData = {
      chauffeur_id: chauffeur.chauffeur_id,
      chantier_id: form.chantier_id,
      date: form.date,
      heures_travaillees: parseFloat(form.heures_travaillees) || 0,
      tours: tours.map(t => ({
        ...t,
        volume: parseFloat(t.volume) || 0,
        distance_km: parseFloat(t.distance_km) || 0,
      })),
      photos: photos,
    };

    if (!isOnline) {
      // Mode hors-ligne
      await savePendingPointage(pointageData);
      setPendingSync(prev => prev + 1);
      toast.success("Pointage sauvegardé localement");
      resetForm();
      setSaving(false);
      return;
    }

    try {
      await axios.post(`${API}/pointages`, pointageData);
      toast.success("Pointage enregistré !");
      resetForm();
      fetchData(chauffeur.chauffeur_id);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({
      chantier_id: "",
      date: new Date().toISOString().split("T")[0],
      heures_travaillees: "",
    });
    setTours([]);
    setPhotos([]);
  };

  // Sauvegarder note de frais
  const handleSaveNoteFrais = async () => {
    if (!noteFraisForm.montant || !noteFraisForm.date) {
      toast.error("Montant et date requis");
      return;
    }

    try {
      await axios.post(`${API}/notes-frais`, {
        chauffeur_id: chauffeur.chauffeur_id,
        chantier_id: form.chantier_id || null,
        date: noteFraisForm.date,
        montant: parseFloat(noteFraisForm.montant),
        type_frais: noteFraisForm.type_frais,
        description: noteFraisForm.description,
        photo_base64: noteFraisForm.photo_base64,
      });
      toast.success("Note de frais enregistrée");
      setNoteFraisOpen(false);
      setNoteFraisForm({
        date: new Date().toISOString().split("T")[0],
        montant: "",
        type_frais: "carburant",
        description: "",
        photo_base64: null,
      });
      fetchData(chauffeur.chauffeur_id);
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const selectedChantier = chantiers.find(c => c.id === form.chantier_id);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A4D2E]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-20" data-testid="chauffeur-portal-mobile">
      {/* Header fixe */}
      <header className="sticky top-0 z-50 bg-[#1A4D2E] text-white px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D9A520] flex items-center justify-center">
              <Truck className="w-6 h-6 text-[#1A4D2E]" />
            </div>
            <div>
              <p className="font-bold text-sm">{chauffeur?.nom}</p>
              <p className="text-xs text-white/70">Terre de Beauce</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Indicateur online/offline */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${isOnline ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'}`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? 'En ligne' : 'Hors-ligne'}
            </div>
            {pendingSync > 0 && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-white h-8"
                onClick={syncOfflineData}
                disabled={!isOnline || syncing}
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                <Badge className="ml-1 bg-amber-500 text-xs">{pendingSync}</Badge>
              </Button>
            )}
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-white h-8 relative"
              onClick={() => setDocumentsOpen(true)}
              data-testid="open-documents-btn"
            >
              <FolderArchive className="w-4 h-4" />
              {documents.filter(d => d.categorie === 'a_signer' && d.statut !== 'signe').length > 0 && (
                <Badge className="ml-1 bg-amber-500 text-xs">
                  {documents.filter(d => d.categorie === 'a_signer' && d.statut !== 'signe').length}
                </Badge>
              )}
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-white h-8"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <div className="p-4 space-y-4">
        {/* Sélection du chantier */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Chantier</Label>
            <Select value={form.chantier_id} onValueChange={(v) => setForm({...form, chantier_id: v})}>
              <SelectTrigger className="mt-1" data-testid="mobile-select-chantier">
                <SelectValue placeholder="Sélectionner un chantier" />
              </SelectTrigger>
              <SelectContent>
                {chantiers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <HardHat className="w-4 h-4 text-[#D9A520]" />
                      <span>{c.reference}</span>
                      <span className="text-xs text-muted-foreground">- {c.lieu}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedChantier && (
              <div className="mt-2 p-2 bg-slate-50 rounded-lg text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {selectedChantier.lieu}
                </div>
                <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                  <span className="font-medium">{selectedChantier.client_nom}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Date et heures */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({...form, date: e.target.value})}
                className="mt-1"
                data-testid="mobile-date-input"
              />
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Heures</Label>
              <div className="relative mt-1">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.5"
                  placeholder="0"
                  value={form.heures_travaillees}
                  onChange={(e) => setForm({...form, heures_travaillees: e.target.value})}
                  className="pl-10"
                  data-testid="mobile-heures-input"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section Tours */}
        <Card className="border-0 shadow-md">
          <CardHeader className="p-4 pb-2">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowTours(!showTours)}
            >
              <CardTitle className="text-base flex items-center gap-2">
                <Route className="w-4 h-4 text-[#D9A520]" />
                Tours ({tours.length})
              </CardTitle>
              {showTours ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </CardHeader>
          {showTours && (
            <CardContent className="p-4 pt-0 space-y-3">
              {tours.map((tour, index) => (
                <div key={tour.id} className="p-3 bg-slate-50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Tour {index + 1}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0 text-red-500"
                      onClick={() => removeTour(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Volume (T/m³)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0"
                        value={tour.volume}
                        onChange={(e) => updateTour(index, 'volume', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Distance (km)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0"
                        value={tour.distance_km}
                        onChange={(e) => updateTour(index, 'distance_km', e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                  <Input
                    placeholder="Commentaire..."
                    value={tour.commentaire}
                    onChange={(e) => updateTour(index, 'commentaire', e.target.value)}
                    className="h-9"
                  />
                </div>
              ))}
              <Button 
                variant="outline" 
                className="w-full border-dashed"
                onClick={addTour}
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un tour
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Photos */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Photos ({photos.length})
              </Label>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => { setPhotoType('pointage'); startCamera(); }}
                className="h-8"
              >
                <Camera className="w-4 h-4 mr-1" />
                Photo
              </Button>
            </div>
            {photos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {photos.map((photo, i) => (
                  <div key={photo.id} className="relative flex-shrink-0">
                    <img 
                      src={photo.url} 
                      alt={`Photo ${i+1}`} 
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                      onClick={() => setPhotos(photos.filter(p => p.id !== photo.id))}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <p className="text-xl font-bold text-[#1A4D2E]">{tours.reduce((s, t) => s + (parseFloat(t.volume) || 0), 0).toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Volume total</p>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <p className="text-xl font-bold text-[#1A4D2E]">{tours.reduce((s, t) => s + (parseFloat(t.distance_km) || 0), 0).toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Distance (km)</p>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <p className="text-xl font-bold text-[#1A4D2E]">{tours.length}</p>
            <p className="text-xs text-muted-foreground">Tours</p>
          </div>
        </div>
      </div>

      {/* Barre d'action fixe en bas */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-3 flex gap-2">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => setNotesFraisOpen(true)}
        >
          <Receipt className="w-4 h-4 mr-2" />
          Note de frais
        </Button>
        <Button 
          className="flex-1 bg-[#1A4D2E] hover:bg-[#143d24]"
          onClick={handleSave}
          disabled={saving || !form.chantier_id}
          data-testid="mobile-save-btn"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Enregistrer
        </Button>
      </div>

      {/* Modal Caméra */}
      <Dialog open={cameraOpen} onOpenChange={(open) => { if (!open) stopCamera(); }}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <div className="relative bg-black">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
              <Button 
                variant="outline" 
                className="rounded-full w-12 h-12 bg-white/90"
                onClick={stopCamera}
              >
                <X className="w-6 h-6" />
              </Button>
              <Button 
                className="rounded-full w-16 h-16 bg-white text-[#1A4D2E]"
                onClick={capturePhoto}
              >
                <Camera className="w-8 h-8" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Preview Photo */}
      <Dialog open={!!capturedPhoto} onOpenChange={() => setCapturedPhoto(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer la photo</DialogTitle>
          </DialogHeader>
          {capturedPhoto && (
            <img src={capturedPhoto} alt="Captured" className="w-full rounded-lg" />
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setCapturedPhoto(null)}>
              Reprendre
            </Button>
            <Button onClick={confirmPhoto} className="bg-[#1A4D2E]">
              <Check className="w-4 h-4 mr-2" />
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sheet Notes de frais */}
      <Sheet open={notesFraisOpen} onOpenChange={setNotesFraisOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#D9A520]" />
              Nouvelle note de frais
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={noteFraisForm.date}
                  onChange={(e) => setNoteFraisForm({...noteFraisForm, date: e.target.value})}
                />
              </div>
              <div>
                <Label>Montant (€)</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={noteFraisForm.montant}
                    onChange={(e) => setNoteFraisForm({...noteFraisForm, montant: e.target.value})}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>Type de frais</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {typesFrais.map((type) => (
                  <Button
                    key={type.value}
                    variant={noteFraisForm.type_frais === type.value ? "default" : "outline"}
                    className={`h-auto py-3 flex-col ${noteFraisForm.type_frais === type.value ? 'bg-[#1A4D2E]' : ''}`}
                    onClick={() => setNoteFraisForm({...noteFraisForm, type_frais: type.value})}
                  >
                    <span className="text-lg">{type.icon}</span>
                    <span className="text-xs">{type.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Description du frais..."
                value={noteFraisForm.description}
                onChange={(e) => setNoteFraisForm({...noteFraisForm, description: e.target.value})}
                rows={2}
              />
            </div>

            <div>
              <Label>Ticket / Justificatif</Label>
              <div className="mt-1">
                {noteFraisForm.photo_base64 ? (
                  <div className="relative inline-block">
                    <img 
                      src={noteFraisForm.photo_base64} 
                      alt="Ticket" 
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                      onClick={() => setNoteFraisForm({...noteFraisForm, photo_base64: null})}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full border-dashed h-24 flex-col gap-2"
                    onClick={() => { setPhotoType('note_frais'); startCamera(); setNotesFraisOpen(false); }}
                  >
                    <Camera className="w-6 h-6" />
                    <span className="text-sm">Photographier le ticket</span>
                  </Button>
                )}
              </div>
            </div>

            <Button 
              className="w-full bg-[#1A4D2E] hover:bg-[#143d24]"
              onClick={handleSaveNoteFrais}
              disabled={!noteFraisForm.montant}
            >
              <Save className="w-4 h-4 mr-2" />
              Enregistrer la note de frais
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet Mes Documents */}
      <Sheet open={documentsOpen} onOpenChange={setDocumentsOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 font-['Barlow_Condensed'] text-2xl">
              <FolderArchive className="w-6 h-6 text-[#D9A520]" />
              Mes documents
            </SheetTitle>
            <SheetDescription>
              Consultez, téléchargez et signez vos documents.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 mt-4" data-testid="chauffeur-documents-list">
            {documents.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                <FolderArchive className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Aucun document pour le moment</p>
              </div>
            )}

            {/* À signer */}
            {documents.filter((d) => d.categorie === "a_signer" && d.statut !== "signe").length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <FileSignature className="w-4 h-4" /> En attente de signature
                </h3>
                <div className="space-y-3">
                  {documents
                    .filter((d) => d.categorie === "a_signer" && d.statut !== "signe")
                    .map((doc) => (
                      <Card key={doc.id} data-testid={`chauffeur-doc-${doc.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium truncate">{doc.titre}</p>
                              <Badge variant="outline" className="mt-1 text-xs">
                                {doc.statut === "en_cours" ? "Signature commencée" : "À signer"}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => downloadChauffeurDoc(doc, false)}
                            >
                              <Download className="w-4 h-4 mr-1" /> Aperçu
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 bg-[#1A4D2E] hover:bg-[#143d24]"
                              onClick={() => handleSignDocument(doc.id)}
                              disabled={signingDocId === doc.id}
                              data-testid={`sign-document-${doc.id}`}
                            >
                              {signingDocId === doc.id ? (
                                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <FileSignature className="w-4 h-4 mr-1" />
                              )}
                              {doc.statut === "en_cours" ? "Continuer" : "Signer"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            )}

            {/* Signés + À consulter */}
            {documents.filter((d) => d.statut === "signe" || d.categorie === "a_consulter").length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[#1A4D2E] uppercase tracking-wide mb-2 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4" /> Documents signés &amp; disponibles
                </h3>
                <div className="space-y-3">
                  {documents
                    .filter((d) => d.statut === "signe" || d.categorie === "a_consulter")
                    .map((doc) => (
                      <Card key={doc.id} data-testid={`chauffeur-doc-${doc.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium truncate">{doc.titre}</p>
                              {doc.statut === "signe" ? (
                                <Badge className="mt-1 text-xs bg-green-100 text-green-700 border-green-200 border">
                                  Signé
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="mt-1 text-xs">À consulter</Badge>
                              )}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadChauffeurDoc(doc, false)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              {doc.statut === "signe" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-700"
                                  onClick={() => downloadChauffeurDoc(doc, true)}
                                  data-testid={`download-signed-${doc.id}`}
                                >
                                  <FileCheck2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
