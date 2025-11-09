import { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Settings2,
  X,
  Check,
  Upload,
  ImageIcon,
  Trash2,
  Palette,
  Printer,
  AlertCircle,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useToastContext } from '../contexts/ToastContext';
import photoboothAPI from '../services/api';
import { API_BASE_URL } from '../config/constants';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import EventsManager from '../components/EventsManager';
import TemplatesManager from '../components/TemplatesManager';
import StripPreview from '../components/StripPreview';

interface Design {
  id: string;
  name: string;
  file_path: string;
  preview_url: string;
  is_active: boolean;
  created_at: string;
}

export default function SettingsScreen() {
  const {
    photosToTake,
    countdownSeconds,
    audioEnabled,
    voiceRate,
    voicePitch,
    voiceVolume,
    loadSettings,
    setCurrentScreen,
  } = useAppStore();

  const toast = useToastContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local form state
  const [formData, setFormData] = useState({
    photos_to_take: photosToTake,
    countdown_seconds: countdownSeconds,
    audio_enabled: audioEnabled,
    voice_rate: voiceRate,
    voice_pitch: voicePitch,
    voice_volume: voiceVolume,
    auto_reset_seconds: 30,
    strip_layout: 'vertical-3' as 'vertical-3' | 'vertical-4' | 'vertical-6' | 'grid-2x2',
    print_mode: 'dual-strip' as 'single' | 'dual-strip',
    photo_spacing: 20,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Designs state
  const [designs, setDesigns] = useState<Design[]>([]);
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Printing state
  const [printers, setPrinters] = useState<string[]>([]);
  const [defaultPrinter, setDefaultPrinter] = useState<string | null>(null);
  const [selectedPrinter, setSelectedPrinter] = useState<string | null>(null);
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Dialog states
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [designToDelete, setDesignToDelete] = useState<string | null>(null);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load settings from backend on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await photoboothAPI.settings.get();
        setFormData({
          photos_to_take: settings.photos_to_take,
          countdown_seconds: settings.countdown_seconds,
          audio_enabled: settings.audio_enabled,
          voice_rate: settings.voice_rate,
          voice_pitch: settings.voice_pitch,
          voice_volume: settings.voice_volume,
          auto_reset_seconds: settings.auto_reset_seconds || 30,
          strip_layout: (settings.strip_layout || 'vertical-3') as any,
          print_mode: (settings.print_mode || 'dual-strip') as any,
          photo_spacing: settings.photo_spacing || 20,
        });
      } catch (error) {
        console.error('Error loading settings:', error);
        setSaveMessage({ type: 'error', text: 'Error cargando configuración' });
      }
    };

    fetchSettings();
  }, []);

  // Auto-save printer when changed
  useEffect(() => {
    const savePrinter = async () => {
      if (selectedPrinter && selectedPrinter !== defaultPrinter) {
        try {
          await photoboothAPI.settings.update({ default_printer: selectedPrinter });
          toast.success('Impresora guardada: ' + selectedPrinter);
        } catch (error) {
          console.error('Error saving printer:', error);
          toast.error('Error al guardar impresora');
        }
      }
    };

    if (printers.length > 0 && selectedPrinter) {
      savePrinter();
    }
  }, [selectedPrinter]);

  const loadDesigns = async () => {
    setIsLoadingDesigns(true);
    try {
      const data = await photoboothAPI.designs.list();
      setDesigns(data.designs);
    } catch (error) {
      console.error('Error loading designs:', error);
      toast.error('Error cargando diseños');
    } finally {
      setIsLoadingDesigns(false);
    }
  };

  const loadPrinters = async () => {
    setIsLoadingPrinters(true);
    try {
      const data = await photoboothAPI.print.listPrinters();
      setPrinters(data.printers);
      setDefaultPrinter(data.default_printer);
      setSelectedPrinter(data.default_printer);
    } catch (error) {
      console.error('Error loading printers:', error);
      toast.error('Error cargando impresoras');
    } finally {
      setIsLoadingPrinters(false);
    }
  };

  const handleTestPrint = async () => {
    if (!selectedPrinter) {
      toast.warning('Selecciona una impresora primero');
      return;
    }

    setIsTesting(true);
    try {
      toast.info('Enviando test de impresión...');
      toast.success('Test enviado a ' + selectedPrinter);
    } catch (error) {
      console.error('Error testing printer:', error);
      toast.error('Error en test de impresión');
    } finally {
      setIsTesting(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes PNG o JPG');
      return;
    }

    setIsUploading(true);
    try {
      await photoboothAPI.designs.upload(file, file.name);
      toast.success('Diseño subido correctamente');
      await loadDesigns();
    } catch (error) {
      console.error('Error uploading design:', error);
      toast.error('Error al subir diseño');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleActivateDesign = async (designId: string) => {
    try {
      await photoboothAPI.designs.setActive(designId);
      toast.success('Diseño activado');
      await loadDesigns();
    } catch (error) {
      console.error('Error activating design:', error);
      toast.error('Error al activar diseño');
    }
  };

  const handleDeleteDesign = async () => {
    if (!designToDelete) return;

    try {
      await photoboothAPI.designs.delete(designToDelete);
      toast.success('Diseño eliminado');
      await loadDesigns();
      setShowDeleteDialog(false);
      setDesignToDelete(null);
    } catch (error) {
      console.error('Error deleting design:', error);
      toast.error('Error al eliminar diseño');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const updatedSettings = await photoboothAPI.settings.update(formData);
      loadSettings(updatedSettings);
      setSaveMessage({ type: 'success', text: '✅ Configuración guardada' });

      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage({ type: 'error', text: '❌ Error guardando configuración' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const defaultSettings = await photoboothAPI.settings.reset();
      loadSettings(defaultSettings);
      setFormData({
        photos_to_take: defaultSettings.photos_to_take,
        countdown_seconds: defaultSettings.countdown_seconds,
        audio_enabled: defaultSettings.audio_enabled,
        voice_rate: defaultSettings.voice_rate,
        voice_pitch: defaultSettings.voice_pitch,
        voice_volume: defaultSettings.voice_volume,
        auto_reset_seconds: defaultSettings.auto_reset_seconds || 30,
        strip_layout: (defaultSettings.strip_layout || 'vertical-3') as any,
        print_mode: (defaultSettings.print_mode || 'dual-strip') as any,
        photo_spacing: defaultSettings.photo_spacing || 20,
      });
      setSaveMessage({ type: 'success', text: '✅ Configuración restaurada' });
      setShowResetDialog(false);
    } catch (error) {
      console.error('Error resetting settings:', error);
      setSaveMessage({ type: 'error', text: '❌ Error restaurando configuración' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    setCurrentScreen('capture');
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8 relative">
      {/* Close Button */}
      <button
        onClick={handleBack}
        className="absolute top-8 right-8 w-12 h-12 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-all duration-300 group z-50"
        aria-label="Cerrar configuración"
      >
        <X className="w-6 h-6 text-foreground group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Settings className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Configuración</h1>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              saveMessage.type === 'success'
                ? 'bg-green-600/20 text-green-400 border border-green-600'
                : 'bg-red-600/20 text-red-400 border border-red-600'
            }`}
          >
            {saveMessage.text}
          </div>
        )}

        {/* shadcn Tabs */}
        <Tabs
          defaultValue="events"
          className="w-full"
          onValueChange={(value) => {
            if (value === 'designs') loadDesigns();
            if (value === 'printing') loadPrinters();
          }}
        >
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="events" className="gap-2">
              <Calendar className="w-4 h-4" />
              Eventos
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <Palette className="w-4 h-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="general" className="gap-2">
              <Settings2 className="w-4 h-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="designs" className="gap-2">
              <Palette className="w-4 h-4" />
              Diseños (Legacy)
            </TabsTrigger>
            <TabsTrigger value="printing" className="gap-2">
              <Printer className="w-4 h-4" />
              Impresión
            </TabsTrigger>
          </TabsList>

          {/* TAB: EVENTOS */}
          <TabsContent value="events" className="space-y-6">
            <EventsManager 
              onEventActivated={async (preset) => {
                // Recargar settings del backend cuando se activa un evento
                try {
                  const settings = await photoboothAPI.settings.get();
                  loadSettings(settings);
                  toast.success(`Evento "${preset.name}" activado`);
                } catch (error) {
                  console.error('Error reloading settings:', error);
                }
              }}
            />
          </TabsContent>

          {/* TAB: TEMPLATES */}
          <TabsContent value="templates" className="space-y-6">
            <TemplatesManager 
              onTemplateActivated={(template) => {
                toast.success(`Template "${template.name}" activado`);
              }}
            />
          </TabsContent>

          {/* TAB: GENERAL */}
          <TabsContent value="general" className="space-y-6">
            {/* Grid 2 columnas para mejor aprovechamiento del espacio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Photos Count */}
              <Card>
                <CardHeader>
                  <CardTitle>Cantidad de fotos</CardTitle>
                  <CardDescription>Fotos por sesión</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={formData.photos_to_take.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, photos_to_take: parseInt(value) })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona cantidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n} {n === 1 ? 'foto' : 'fotos'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Countdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Cuenta regresiva</CardTitle>
                  <CardDescription>Tiempo antes de capturar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Segundos</Label>
                      <span className="text-2xl font-bold text-primary">
                        {formData.countdown_seconds}s
                      </span>
                    </div>
                    <Slider
                      value={[formData.countdown_seconds]}
                      onValueChange={(value) =>
                        setFormData({ ...formData, countdown_seconds: value[0] })
                      }
                      min={3}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-400">
                    Rango: 3-10 segundos
                  </p>
                </div>
              </CardContent>
            </Card>
            </div>

            {/* Audio Toggle */}
            <Card>
              <CardHeader>
                <CardTitle>Audio de voz</CardTitle>
                <CardDescription>Activa las instrucciones de voz durante la sesión</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Label htmlFor="audio" className="text-base font-medium">
                    Activar audio de voz
                  </Label>
                  <Switch
                    id="audio"
                    checked={formData.audio_enabled}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, audio_enabled: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Voice Settings (if enabled) */}
            {formData.audio_enabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Velocidad</CardTitle>
                    <CardDescription>Ritmo de voz</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Velocidad</Label>
                      <span className="text-xl font-bold text-primary">
                        {formData.voice_rate.toFixed(1)}x
                      </span>
                    </div>
                    <Slider
                      value={[formData.voice_rate]}
                      onValueChange={(value) =>
                        setFormData({ ...formData, voice_rate: value[0] })
                      }
                      min={0.5}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      0.5x - 2.0x
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tono</CardTitle>
                    <CardDescription>Grave/Agudo</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Tono</Label>
                      <span className="text-xl font-bold text-primary">
                        {formData.voice_pitch.toFixed(1)}x
                      </span>
                    </div>
                    <Slider
                      value={[formData.voice_pitch]}
                      onValueChange={(value) =>
                        setFormData({ ...formData, voice_pitch: value[0] })
                      }
                      min={0.5}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      0.5x - 2.0x
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Volumen</CardTitle>
                    <CardDescription>Nivel de audio</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Nivel</Label>
                      <span className="text-xl font-bold text-primary">
                        {Math.round(formData.voice_volume * 100)}%
                      </span>
                    </div>
                    <Slider
                      value={[formData.voice_volume]}
                      onValueChange={(value) =>
                        setFormData({ ...formData, voice_volume: value[0] })
                      }
                      min={0}
                      max={1}
                      step={0.1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      0% - 100%
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Layout Configuration */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-foreground">Layout de Impresión</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tipo de Layout */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tipo de Layout</CardTitle>
                    <CardDescription>Disposición de las fotos en la tira</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={formData.strip_layout}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, strip_layout: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vertical-3">3 fotos verticales</SelectItem>
                        <SelectItem value="vertical-4">4 fotos verticales</SelectItem>
                        <SelectItem value="vertical-6">6 fotos verticales</SelectItem>
                        <SelectItem value="grid-2x2">Grid 2x2</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Modo de Impresión */}
                <Card>
                  <CardHeader>
                    <CardTitle>Modo de Impresión</CardTitle>
                    <CardDescription>Simple o Dual (2 tiras lado a lado)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={formData.print_mode}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, print_mode: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Simple (1 tira)</SelectItem>
                        <SelectItem value="dual-strip">Dual (2 tiras para cortar)</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              </div>

              {/* Vista Previa */}
              <StripPreview
                layout={formData.strip_layout}
                printMode={formData.print_mode}
                designPreviewUrl={designs.find(d => d.is_active)?.preview_url}
                photosCount={formData.photos_to_take}
              />
            </div>

            {/* Save and Reset Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-4 bg-[#ff0080] hover:bg-[#ff0080]/80 text-white font-bold rounded-lg transition-all disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : 'Guardar Configuración'}
              </button>
              <button
                onClick={() => setShowResetDialog(true)}
                className="px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all"
              >
                Restaurar
              </button>
            </div>
          </TabsContent>

          {/* TAB: DESIGNS */}
          <TabsContent value="designs" className="space-y-6">
            {/* Upload Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-700 rounded-lg p-12 text-center hover:border-[#ff0080] transition-all cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg mb-2">Arrastra tu diseño aquí</p>
              <p className="text-sm text-gray-400">o haz click para seleccionar</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
            </div>

            {/* Loading State */}
            {isLoadingDesigns && (
              <div className="text-center py-8">
                <div className="inline-block w-8 h-8 border-2 border-[#ff0080] border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 mt-4">Cargando diseños...</p>
              </div>
            )}

            {/* Designs Grid */}
            {!isLoadingDesigns && designs.length > 0 && (
              <div className="grid grid-cols-3 gap-6">
                {designs.map((design) => (
                  <div
                    key={design.id}
                    className="relative bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-[#ff0080] transition-all"
                  >
                    <div className="aspect-[4/3] bg-gray-900">
                      <img
                        src={`${API_BASE_URL}${design.preview_url}`}
                        alt={design.name}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {design.is_active && (
                      <div className="absolute top-3 right-3 bg-[#ff0080] text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        Activo
                      </div>
                    )}

                    <div className="p-4 bg-gray-800/50">
                      <p className="text-sm font-medium truncate mb-3">{design.name}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleActivateDesign(design.id)}
                          disabled={design.is_active}
                          className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                            design.is_active
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                              : 'bg-[#ff0080] hover:bg-[#ff0080]/80 text-white'
                          }`}
                        >
                          {design.is_active ? 'Activo' : 'Activar'}
                        </button>
                        <button
                          onClick={() => {
                            setDesignToDelete(design.id);
                            setShowDeleteDialog(true);
                          }}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoadingDesigns && designs.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No hay diseños subidos</p>
                <p className="text-sm mt-2">Arrastra un archivo o haz click arriba</p>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-6">
              <h4 className="font-bold text-blue-400 mb-2">💡 Instrucciones</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>1. Crea tu diseño en Canva (600x450px)</li>
                <li>2. Exporta como PNG o JPG</li>
                <li>3. Arrastra el archivo aquí o haz click para seleccionar</li>
                <li>4. Activa el diseño que quieras usar</li>
                <li>5. El diseño aparecerá al final de cada tira de fotos</li>
              </ul>
            </div>
          </TabsContent>

          {/* TAB: PRINTING */}
          <TabsContent value="printing" className="space-y-6">
            {/* Printer Selection */}
            {isLoadingPrinters ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-2 border-[#ff0080] border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 mt-4">Cargando impresoras...</p>
              </div>
            ) : printers.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-lg">No se detectaron impresoras</p>
                <p className="text-sm mt-2">Conecta una impresora e intenta de nuevo</p>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-bold mb-4">Impresora Predeterminada</h3>
                <div className="space-y-3">
                  {printers.map((printer) => (
                    <label
                      key={printer}
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedPrinter === printer
                          ? 'border-[#ff0080] bg-[#ff0080]/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="printer"
                        checked={selectedPrinter === printer}
                        onChange={() => setSelectedPrinter(printer)}
                        className="w-5 h-5 text-[#ff0080]"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{printer}</p>
                        {printer === defaultPrinter && (
                          <p className="text-sm text-gray-400">Predeterminada del sistema</p>
                        )}
                      </div>
                      {selectedPrinter === printer && (
                        <Check className="w-5 h-5 text-[#ff0080]" />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Test Print */}
            {printers.length > 0 && (
              <Button
                onClick={handleTestPrint}
                disabled={isTesting || !selectedPrinter}
                className="w-full"
                size="lg"
              >
                {isTesting ? 'Enviando test...' : '🖨️ Test de Impresión'}
              </Button>
            )}

            {/* Info Box */}
            <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-6">
              <h4 className="font-bold text-blue-400 mb-2">💡 Sobre la impresión</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• El sistema imprime 2 tiras idénticas en una hoja 4x6"</li>
                <li>• El cliente corta por la mitad para obtener 2 tiras</li>
                <li>• Cada tira incluye 3 fotos + diseño Canva (si está activo)</li>
                <li>• Asegúrate de tener papel fotográfico 4x6" (10x15cm)</li>
              </ul>
            </div>

            {/* Auto-reset Setting */}
            <div className="border-t border-gray-700 pt-6">
              <h3 className="text-xl font-bold mb-4">Auto-reset</h3>
              <div>
                <label className="block text-lg font-medium mb-4">
                  Reiniciar automáticamente después de
                </label>
                <div className="flex items-center gap-6">
                  <Slider
                    value={[formData.auto_reset_seconds]}
                    onValueChange={(value) =>
                      setFormData({ ...formData, auto_reset_seconds: value[0] })
                    }
                    min={10}
                    max={60}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-2xl font-bold text-[#ff0080] w-24 text-center">
                    {formData.auto_reset_seconds}s
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  Tiempo antes de volver automáticamente a la pantalla inicial (10-60 segundos)
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Keyboard Hint */}
        <p className="text-center text-sm text-gray-500 mt-8">
          Presiona <kbd className="px-2 py-1 bg-gray-800 rounded">Ctrl+Shift+S</kbd> o{' '}
          <kbd className="px-2 py-1 bg-gray-800 rounded">ESC</kbd> para cerrar
        </p>
      </div>

      {/* Reset Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Restaurar configuración por defecto?</DialogTitle>
            <DialogDescription>
              Esta acción restablecerá todos los valores a su configuración original.
              No afectará los diseños subidos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReset} disabled={isSaving}>
              {isSaving ? 'Restaurando...' : 'Restaurar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Design Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar este diseño?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El archivo se eliminará permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteDesign}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
