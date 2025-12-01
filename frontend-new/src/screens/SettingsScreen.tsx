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
import { useAppStore, type PrintJob } from '../store/useAppStore';
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
import { Input } from '@/components/ui/input';
import TemplatesManager from '../components/TemplatesManager';
import StripPreview from '../components/StripPreview';
import VoiceSelector from '../components/VoiceSelector';
import type { Template } from '../types/template';
import { getLayoutPhotoCount, LAYOUT_LABELS } from '../types/template';

const TAB_PANEL_CLASS = 'space-y-6 max-h-[calc(100vh-220px)] overflow-y-auto pr-3 w-full';
const UI_PREF_STORAGE_KEY = 'photobooth_ui_preferences';

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
    mirrorPreview,
    kioskMode,
    setSettings,
  } = useAppStore();

  const toast = useToastContext();

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
    auto_print: false,
    print_copies: 2,
    camera_width: 1280,
    camera_height: 720,
    paper_size: '4x6' as '2x6' | '4x6' | '5x7',
  });
  const [uiPreferences, setUiPreferences] = useState({
    mirror_preview: mirrorPreview,
    kiosk_mode: kioskMode,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Printing state
  const [printers, setPrinters] = useState<string[]>([]);
  const [defaultPrinter, setDefaultPrinter] = useState<string | null>(null);
  const [selectedPrinter, setSelectedPrinter] = useState<string | null>(null);
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null);

  // Active template info (para mostrar ayuda sobre fotos esperadas por diseño)
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);

  // Dialog states
  const [showResetDialog, setShowResetDialog] = useState(false);

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
          auto_print: settings.auto_print ?? false,
          print_copies: settings.print_copies ?? 2,
          camera_width: settings.camera_width ?? 1280,
          camera_height: settings.camera_height ?? 720,
          paper_size: (settings.paper_size || '4x6') as any,
        });
        setUiPreferences({
          mirror_preview: settings.mirror_preview ?? uiPreferences.mirror_preview,
          kiosk_mode: settings.kiosk_mode ?? uiPreferences.kiosk_mode,
        });
        setSettings({
          mirrorPreview: settings.mirror_preview ?? mirrorPreview,
          kioskMode: settings.kiosk_mode ?? kioskMode,
        });

        // Cargar template activo (si hay) para ayuda visual en General
        if (settings.active_template_id) {
          try {
            const tpl = await photoboothAPI.templates.get(settings.active_template_id);
            setActiveTemplate(tpl);
          } catch (e) {
            console.error('No se pudo cargar el template activo para ayuda de fotos:', e);
          }
        } else {
          setActiveTemplate(null);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        setSaveMessage({ type: 'error', text: 'Error cargando configuración' });
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(UI_PREF_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<typeof uiPreferences>;
        const mirrorPref = parsed.mirror_preview ?? mirrorPreview;
        const kioskPref = parsed.kiosk_mode ?? kioskMode;
        setUiPreferences({ mirror_preview: mirrorPref, kiosk_mode: kioskPref });
        setSettings({ mirrorPreview: mirrorPref, kioskMode: kioskPref });
      }
    } catch (error) {
      console.error('No se pudieron cargar preferencias locales', error);
    }
  }, [mirrorPreview, kioskMode, setSettings]);

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

  const loadPrintJobs = async () => {
    try {
      setIsLoadingJobs(true);
      const jobs = await photoboothAPI.print.listJobs();
      setPrintJobs(jobs);
    } catch (error) {
      console.error('Error cargando trabajos de impresión:', error);
      toast.error('No se pudo cargar la cola de impresión');
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      setRetryingJobId(jobId);
      await photoboothAPI.print.retryJob(jobId);
      toast.success('Reintento enviado');
      await loadPrintJobs();
    } catch (error) {
      console.error('Error reintentando trabajo de impresión:', error);
      toast.error('No se pudo reintentar el trabajo');
    } finally {
      setRetryingJobId(null);
    }
  };

  useEffect(() => {
    setSettings({
      mirrorPreview: uiPreferences.mirror_preview,
      kioskMode: uiPreferences.kiosk_mode,
    });
    localStorage.setItem(UI_PREF_STORAGE_KEY, JSON.stringify(uiPreferences));
  }, [uiPreferences, setSettings]);

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
      await photoboothAPI.print.test(selectedPrinter);
      toast.success('Test enviado a ' + selectedPrinter);
    } catch (error) {
      console.error('Error testing printer:', error);
      toast.error('Error en test de impresión');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const updatedSettings = await photoboothAPI.settings.update({
        ...formData,
        mirror_preview: uiPreferences.mirror_preview,
        kiosk_mode: uiPreferences.kiosk_mode,
      });
      loadSettings(updatedSettings);
      setUiPreferences({
        mirror_preview: updatedSettings.mirror_preview ?? uiPreferences.mirror_preview,
        kiosk_mode: updatedSettings.kiosk_mode ?? uiPreferences.kiosk_mode,
      });
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
        auto_print: defaultSettings.auto_print ?? false,
        print_copies: defaultSettings.print_copies ?? 2,
        camera_width: defaultSettings.camera_width ?? 1280,
        camera_height: defaultSettings.camera_height ?? 720,
        paper_size: (defaultSettings.paper_size || '4x6') as any,
      });
      setUiPreferences({
        mirror_preview: defaultSettings.mirror_preview ?? false,
        kiosk_mode: defaultSettings.kiosk_mode ?? true,
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
    <div className="min-h-screen bg-background text-foreground px-6 lg:px-12 py-10 relative overflow-hidden flex flex-col">
      {/* Close Button */}
      <button
        onClick={handleBack}
        className="absolute top-8 right-8 w-12 h-12 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-all duration-300 group z-50"
        aria-label="Cerrar configuración"
      >
        <X className="w-6 h-6 text-foreground group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Header */}
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-2">
          <Settings className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Configuración</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Flujo recomendado: <strong>1)</strong> pestaña <strong>Diseños</strong> para elegir el look (layout, marco, filtro),{' '}
          <strong>2)</strong> pestaña <strong>General</strong> para ajustar comportamiento (fotos, countdown, audio),{' '}
          <strong>3)</strong> cerrar y probar la cabina.
        </p>

        {/* Save Message */}
        {saveMessage && (
          <div
            className={`mb-6 p-4 rounded-lg ${saveMessage.type === 'success'
              ? 'bg-green-600/20 text-green-400 border border-green-600'
              : 'bg-red-600/20 text-red-400 border border-red-600'
              }`}
          >
            {saveMessage.text}
          </div>
        )}

        {/* shadcn Tabs */}
        <Tabs
          defaultValue="templates"
          className="w-full flex-1 flex flex-col overflow-hidden"
          onValueChange={(value) => {
            if (value === 'printing') {
              loadPrinters();
              void loadPrintJobs();
            }
          }}
        >
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="templates" className="gap-2">
              <Palette className="w-4 h-4" />
              Diseños
            </TabsTrigger>
            <TabsTrigger value="general" className="gap-2">
              <Settings2 className="w-4 h-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="printing" className="gap-2">
              <Printer className="w-4 h-4" />
              Impresión
            </TabsTrigger>
          </TabsList>

          {/* TAB: TEMPLATES */}
          <TabsContent value="templates" className={TAB_PANEL_CLASS}>
            <TemplatesManager
              onTemplateActivated={async (template) => {
                try {
                  const filter = (template.photo_filter as any) || 'none';
                  setActiveTemplate(template);
                  const updatedSettings = await photoboothAPI.settings.update({
                    active_template_id: template.id,
                    photo_filter: filter,
                  });
                  loadSettings(updatedSettings);
                  toast.success(`Template "${template.name}" activado`);
                } catch (error) {
                  console.error('Error sincronizando filtro del template:', error);
                  toast.error('Template activado, pero no se pudo guardar el filtro en configuración');
                }
              }}
            />
          </TabsContent>

          {/* TAB: GENERAL */}
          <TabsContent value="general" className={TAB_PANEL_CLASS}>
            {/* Grid 2 columnas para mejor aprovechamiento del espacio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Photos Count */}
              <Card>
                <CardHeader>
                  <CardTitle>Cantidad de fotos</CardTitle>
                  <CardDescription>
                    Paso 2: define cuántas fotos tomará la cabina por sesión.
                  </CardDescription>
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
                  {activeTemplate && (
                    <div className="mt-3 text-xs text-muted-foreground space-y-1">
                      <p>
                        Diseño activo:{' '}
                        <span className="font-medium">
                          {LAYOUT_LABELS[activeTemplate.layout]}
                        </span>{' '}
                        (
                        {getLayoutPhotoCount(activeTemplate.layout)}{' '}
                        {getLayoutPhotoCount(activeTemplate.layout) === 1
                          ? 'foto esperada'
                          : 'fotos esperadas'}
                        )
                      </p>
                      {getLayoutPhotoCount(activeTemplate.layout) !== formData.photos_to_take && (
                        <p className="text-amber-500">
                          Este diseño está pensado para{' '}
                          {getLayoutPhotoCount(activeTemplate.layout)}{' '}
                          {getLayoutPhotoCount(activeTemplate.layout) === 1 ? 'foto' : 'fotos'}, pero
                          actualmente tomarás {formData.photos_to_take}.
                        </p>
                      )}
                    </div>
                  )}
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

            {/* Pantalla y modo espejo */}
            <Card>
              <CardHeader>
                <CardTitle>Pantalla y experiencia</CardTitle>
                <CardDescription>Kiosko por defecto y espejo para el preview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="kiosk-mode" className="text-base font-medium">
                    Modo kiosko al iniciar
                  </Label>
                  <Switch
                    id="kiosk-mode"
                    checked={uiPreferences.kiosk_mode}
                    onCheckedChange={(checked) =>
                      setUiPreferences((prev) => ({ ...prev, kiosk_mode: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="mirror-preview" className="text-base font-medium">
                    Espejo del preview (flip horizontal)
                  </Label>
                  <Switch
                    id="mirror-preview"
                    checked={uiPreferences.mirror_preview}
                    onCheckedChange={(checked) =>
                      setUiPreferences((prev) => ({ ...prev, mirror_preview: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Cámara */}
            <Card>
              <CardHeader>
                <CardTitle>Resolución de cámara</CardTitle>
                <CardDescription>Define ancho/alto del frame de captura</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Ancho (px)</Label>
                    <Input
                      type="number"
                      min={640}
                      max={1920}
                      step={10}
                      value={formData.camera_width}
                      onChange={(e) =>
                        setFormData({ ...formData, camera_width: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Alto (px)</Label>
                    <Input
                      type="number"
                      min={480}
                      max={1080}
                      step={10}
                      value={formData.camera_height}
                      onChange={(e) =>
                        setFormData({ ...formData, camera_height: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  Usa valores moderados (ej. 1280x720) para mantener bajo consumo y velocidad de composición.
                </p>
              </CardContent>
            </Card>

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
              <>
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

                {/* Voice Selector */}
                <div className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Voz del Asistente</CardTitle>
                      <CardDescription>Elige la voz del sistema que guiará a los invitados</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <VoiceSelector />
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {/* Layout Configuration */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-foreground">Diseño de tiras</h3>
              <p className="text-sm text-gray-400">
                Normalmente personalizarás el look de las tiras desde la pestaña <strong>Diseños</strong>.
                Estos ajustes sirven como base o cuando no hay un Template activo.
              </p>

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
                designPreviewUrl={undefined}
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
          {/* TAB: PRINTING */}
          <TabsContent value="printing" className={TAB_PANEL_CLASS}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Auto impresión</CardTitle>
                <CardDescription>Copias por defecto y envío automático al terminar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-print" className="text-base font-medium">
                    Enviar a imprimir automáticamente
                  </Label>
                  <Switch
                    id="auto-print"
                    checked={formData.auto_print}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, auto_print: checked })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Copias</Label>
                    <span className="text-xl font-bold text-primary">{formData.print_copies}</span>
                  </div>
                  <Slider
                    value={[formData.print_copies]}
                    onValueChange={(value) =>
                      setFormData({ ...formData, print_copies: value[0] })
                    }
                    min={1}
                    max={6}
                    step={1}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Modo de impresión</CardTitle>
                <CardDescription>Selecciona si imprimes 1 tira o duplicada (2 tiras en 4x6)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Modo</Label>
                    <Select
                      value={formData.print_mode}
                      onValueChange={(value: 'single' | 'dual-strip') => setFormData({ ...formData, print_mode: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Una tira (strip)</SelectItem>
                        <SelectItem value="dual-strip">Dos tiras en una hoja (full_strip)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Papel</Label>
                    <Select
                      value={(formData as any).paper_size || '4x6'}
                      onValueChange={(value: '2x6' | '4x6' | '5x7') => setFormData({ ...formData, paper_size: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2x6">2x6 pulgadas (solo tiras)</SelectItem>
                        <SelectItem value="4x6">4x6 pulgadas</SelectItem>
                        <SelectItem value="5x7">5x7 pulgadas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  “Dos tiras” usa la imagen full_strip con línea de corte al centro; “Una tira” imprime el strip simple.
                </p>
              </CardContent>
            </Card>

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
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedPrinter === printer
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

            <Card className="mt-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Cola de impresión</CardTitle>
                  <CardDescription>Trabajos recientes y fallidos</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadPrintJobs}
                  disabled={isLoadingJobs}
                >
                  {isLoadingJobs ? 'Actualizando...' : 'Actualizar'}
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingJobs ? (
                  <div className="text-center py-6 text-gray-400">Cargando trabajos...</div>
                ) : printJobs.length === 0 ? (
                  <div className="text-center py-6 text-gray-400">Sin trabajos registrados</div>
                ) : (
                  <div className="space-y-3">
                    {printJobs.slice(0, 10).map((job) => (
                      <div
                        key={job.job_id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="space-y-1">
                          <p className="text-sm text-white font-semibold">{job.status.toUpperCase()}</p>
                          <p className="text-xs text-white/70 break-all">{job.file_path}</p>
                          {job.error && (
                            <p className="text-xs text-red-400">Error: {job.error}</p>
                          )}
                        </div>
                        {job.status !== 'sent' && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={Boolean(retryingJobId)}
                            onClick={() => handleRetryJob(job.job_id)}
                          >
                            {retryingJobId === job.job_id ? 'Reintentando...' : 'Reintentar'}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

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
              No afectará los templates ni eventos guardados.
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
    </div>
  );
}
