import { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { useAppStore } from '../store/useAppStore';
import { useToastContext } from '../contexts/ToastContext';
import photoboothAPI, { API_BASE_URL } from '../services/api';
import { useAudio, useSoundEffects } from '../hooks/useAudio';
import { UI_CONSTANTS } from '../config/constants';
import OperationalHUD from '../components/OperationalHUD';
import { useDeviceStatus } from '../hooks/useDeviceStatus';
import CircularCountdown from '../components/CircularCountdown';
import StaffDock from '../components/StaffDock';
import HardwareChecklistDialog from '../components/HardwareChecklistDialog';
import { EventPreset, EVENT_TYPE_LABELS } from '../types/preset';
import { LAYOUT_LABELS, getLayoutPhotoCount, LAYOUT_3X1_VERTICAL } from '../types/template';
import { Calendar } from 'lucide-react';
import Confetti from '../components/Confetti';
import StaffLogPanel from '../components/StaffLogPanel';

type BoothState = 'idle' | 'countdown' | 'capturing' | 'pausing' | 'reviewing' | 'preview-final' | 'processing' | 'success';

const getTemplateLayoutLabel = (layout?: string | null) =>
  layout ? LAYOUT_LABELS[layout as keyof typeof LAYOUT_LABELS] ?? null : null;

const PANIC_EXIT_THRESHOLD = 3;
const PANIC_EXIT_WINDOW_MS = 2000;
const COUNTDOWN_BEEP_FREQUENCY = 650;
const GO_BEEP_FREQUENCY = 1200;
const COUNTDOWN_BEEP_DURATION_MS = 150;
const GO_BEEP_DURATION_MS = 200;
const PAUSE_BETWEEN_SHOTS_SECONDS = 2;
const SUCCESS_AUTO_RESET_SECONDS = 30;

export default function UnifiedBoothScreen() {
  const {
    photosToTake,
    countdownSeconds,
    currentPhotoIndex,
    sessionId,
    photoPaths,
    incrementPhotoIndex,
    addCapturedImage,
    addPhotoPath,
    setSessionId,
    setCurrentScreen,
    setError,
    reset,
    mirrorPreview,
    kioskMode,
    addLog,
  } = useAppStore();

  const webcamRef = useRef<Webcam>(null);
  const escapeTimestampsRef = useRef<number[]>([]);
  const [boothState, setBoothState] = useState<BoothState>('idle');
  const [countdown, setCountdown] = useState(countdownSeconds || 5);
  const [pauseCountdown, setPauseCountdown] = useState(PAUSE_BETWEEN_SHOTS_SECONDS);
  const [photoSlots, setPhotoSlots] = useState<string[]>([]);
  const [autoResetTimer, setAutoResetTimer] = useState(SUCCESS_AUTO_RESET_SECONDS);
  const [showFlash, setShowFlash] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewProgress, setReviewProgress] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [stripPreviewUrl, setStripPreviewUrl] = useState<string | null>(null);
  const [previewCountdown, setPreviewCountdown] = useState(5);
  const [galleryPhotoCount, setGalleryPhotoCount] = useState(0);
  const [activeEvent, setActiveEvent] = useState<EventPreset | null>(null);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);

  const { speak } = useAudio();
  const { playShutter, playBeep, playSuccess } = useSoundEffects();
  const toast = useToastContext();
  const deviceStatus = useDeviceStatus();
  const activeTemplateLabel = getTemplateLayoutLabel(activeEvent?.template_layout);
  
  // Calcular número de fotos efectivo: priorizar template activo, fallback a settings
  const effectivePhotosToTake = activeEvent?.template_layout 
    ? getLayoutPhotoCount(activeEvent.template_layout as any) 
    : photosToTake || getLayoutPhotoCount(LAYOUT_3X1_VERTICAL); // Fallback seguro

  // Helper: Wait for image to be ready with retry logic
  const waitForImageReady = async (url: string): Promise<void> => {
    for (let i = 0; i < UI_CONSTANTS.FILE_READY_MAX_RETRIES; i++) {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          console.log(`✅ Image ready after ${i + 1} attempts`);
          return;
        }
      } catch (error) {
        console.log(`⏳ Waiting for image (attempt ${i + 1}/${UI_CONSTANTS.FILE_READY_MAX_RETRIES})`);
      }
      await new Promise(resolve => setTimeout(resolve, UI_CONSTANTS.FILE_READY_RETRY_DELAY));
    }
    console.warn('⚠️ Image may not be fully ready, but proceeding anyway');
  };

  // Capturar foto con backend
  const capturePhoto = useCallback(async () => {
    try {
      setIsCapturingPhoto(true);
      setBoothState('capturing');
      
      // Flash animado
      setShowFlash(true);
      playShutter();
      setTimeout(() => setShowFlash(false), 300);
      
      const response = await photoboothAPI.camera.capture({
        camera_id: 0,
        session_id: sessionId || undefined,
      });

      console.log('✅ Foto capturada:', response);

      if (!sessionId && response.session_id) {
        setSessionId(response.session_id);
      }

      addPhotoPath(response.file_path);

      // Construir URL de la imagen real desde el backend
      const imageUrl = `${API_BASE_URL}${response.file_path}`;
      console.log('🖼️ URL de imagen:', imageUrl);

      // ⏳ Retry logic para esperar que backend termine de escribir el archivo
      // Esto previene race condition donde <img> intenta cargar antes de que exista
      await waitForImageReady(imageUrl);
      
      setPhotoSlots((prev) => [...prev, imageUrl]);

      addCapturedImage({
        id: response.file_path.split('/').pop() || `img-${Date.now()}`,
        url: imageUrl,
        timestamp: new Date(),
      });

      incrementPhotoIndex();
      addLog({ level: 'info', source: 'camera', message: `Foto ${currentPhotoIndex + 1} capturada` });

      const nextPhotoIndex = currentPhotoIndex + 1;
      const remainingPhotos = effectivePhotosToTake - nextPhotoIndex;

      // Si es la última foto, ir a REVIEW (carousel)
      if (nextPhotoIndex >= effectivePhotosToTake) {
        playSuccess();
        speak('¡Perfecto! Mira tus fotos.', { rate: 1.0, pitch: 1.1 });
        setTimeout(() => {
          setBoothState('reviewing');
          setReviewIndex(0);
          setReviewProgress(0);
        }, 1000);
      } else {
        if (remainingPhotos === 1) {
          speak('Falta una foto. Última toma.', { rate: 1.0, pitch: 1.0 });
        } else {
          speak('Bien. Siguiente foto.', { rate: 1.0, pitch: 1.0 });
        }
        setBoothState('pausing');
        setPauseCountdown(PAUSE_BETWEEN_SHOTS_SECONDS);
      }

    } catch (error) {
      console.error('Error capturing photo:', error);
      const message = error instanceof Error ? error.message : 'Error al capturar foto';
      setError(message);
      setErrorMessage(message);
      speak('Error al capturar. Intenta de nuevo.', { rate: 1.0, pitch: 1.0 });
      addLog({ level: 'error', source: 'camera', message });
      setBoothState('idle');
    } finally {
      setIsCapturingPhoto(false);
    }
  }, [currentPhotoIndex, effectivePhotosToTake, sessionId, addCapturedImage, addPhotoPath, setSessionId, incrementPhotoIndex, setCurrentScreen, setError, playShutter, playSuccess, speak, addLog]);

  // Countdown principal (5-4-3-2-1)
  useEffect(() => {
    if (boothState !== 'countdown') return;

    if (countdown === 0) {
      playBeep(GO_BEEP_FREQUENCY, GO_BEEP_DURATION_MS);
      capturePhoto();
      return;
    }

    const timer = setTimeout(() => {
      const tone = countdown === 1 ? GO_BEEP_FREQUENCY : COUNTDOWN_BEEP_FREQUENCY;
      const duration = countdown === 1 ? GO_BEEP_DURATION_MS : COUNTDOWN_BEEP_DURATION_MS;
      playBeep(tone, duration);
      speak(countdown.toString(), { rate: 1.0, pitch: 1.0 });
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [boothState, countdown, capturePhoto, playBeep, speak]);

  // Pausa entre fotos (2 segundos)
  useEffect(() => {
    if (boothState !== 'pausing') return;

    if (pauseCountdown === 0) {
      setBoothState('countdown');
      setCountdown(countdownSeconds || 5);
      return;
    }

    const timer = setTimeout(() => {
      setPauseCountdown(pauseCountdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [boothState, pauseCountdown]);

  // Iniciar sesión
  const handleStart = useCallback(() => {
    if (boothState !== 'idle') return;
    
    speak('Prepárate. Primera foto en cinco segundos.', { rate: 1.0, pitch: 1.0 });
    addLog({ level: 'info', source: 'session', message: 'Sesión iniciada' });
    setBoothState('countdown');
    setCountdown(countdownSeconds || 5);
  }, [boothState, speak, addLog, countdownSeconds]);

  // Reset
  const handleReset = useCallback(() => {
    reset();
    addLog({ level: 'warning', source: 'session', message: 'Sesión reiniciada' });
    setBoothState('idle');
    setPhotoSlots([]);
    setCountdown(countdownSeconds || 5);
    setPauseCountdown(PAUSE_BETWEEN_SHOTS_SECONDS);
    setAutoResetTimer(SUCCESS_AUTO_RESET_SECONDS);
    setShowFlash(false);
  }, [reset, addLog, countdownSeconds]);

  // Auto-reset en success (30 segundos)
  useEffect(() => {
    if (boothState !== 'success') return;

    if (autoResetTimer === 0) {
      handleReset();
      return;
    }

    const timer = setTimeout(() => {
      setAutoResetTimer(autoResetTimer - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [boothState, autoResetTimer, handleReset]);

  // Tecla SPACE para iniciar + flechas para carousel
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && boothState === 'idle') {
        e.preventDefault();
        handleStart();
      }
      if (e.code === 'Escape') {
        const now = Date.now();
        escapeTimestampsRef.current = [
          ...escapeTimestampsRef.current.filter((ts) => now - ts <= PANIC_EXIT_WINDOW_MS),
          now,
        ];

        const isPanic = escapeTimestampsRef.current.length >= PANIC_EXIT_THRESHOLD;

        if (isPanic) {
          escapeTimestampsRef.current = [];
          if (window.electronAPI?.exitKiosk) {
            void window.electronAPI.exitKiosk();
          }
          addLog({ level: 'warning', source: 'kiosk', message: 'Panic exit activado' });
          handleReset();
          return;
        }

        if (boothState !== 'idle') {
          e.preventDefault();
          handleReset();
        }
      }
      // Navegación en carousel
      if (boothState === 'reviewing') {
        if (e.code === 'ArrowRight' && reviewIndex < effectivePhotosToTake - 1) {
          e.preventDefault();
          setReviewIndex(reviewIndex + 1);
          setReviewProgress(0);
        }
        if (e.code === 'ArrowLeft' && reviewIndex > 0) {
          e.preventDefault();
          setReviewIndex(reviewIndex - 1);
          setReviewProgress(0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [boothState, reviewIndex, effectivePhotosToTake, addLog, handleReset, handleStart]);

  // Carousel auto-advance
  useEffect(() => {
    if (boothState !== 'reviewing') return;

    // Duración por foto: 2.5s (primeras 2), 3s (última)
    const duration = reviewIndex === effectivePhotosToTake - 1 ? 3000 : 2500;
    
    // Progress bar animation
    const progressInterval = setInterval(() => {
      setReviewProgress((prev) => {
        const increment = 100 / (duration / 50); // Update cada 50ms
        return Math.min(prev + increment, 100);
      });
    }, 50);

    // Auto-advance o ir a preview final
    const advanceTimer = setTimeout(() => {
      if (reviewIndex < effectivePhotosToTake - 1) {
        // Siguiente foto
        playBeep();
        setReviewIndex(reviewIndex + 1);
        setReviewProgress(0);
      } else {
        // Todas vistas → Preview Final
        speak('Generando vista previa de tu tira.', { rate: 1.0, pitch: 1.0 });
        setBoothState('preview-final');
        generateStripPreview();
      }
    }, duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(advanceTimer);
    };
  }, [boothState, reviewIndex, effectivePhotosToTake, playBeep, speak, setCurrentScreen]);

  // Generar preview del strip
  const generateStripPreview = async () => {
    try {
      console.log('🎬 Generando preview del strip...');
      console.log('📸 Photo paths:', photoPaths);
      
      // Obtener template activo completo (DRY: reutilizar misma lógica que ProcessingScreen)
      let designPath: string | null = null;
      let activeTemplate = null;
      try {
        activeTemplate = await photoboothAPI.templates.getActive();
        if (activeTemplate) {
          designPath = activeTemplate.design_file_path || null;
          console.log('✅ Template activo:', {
            name: activeTemplate.name,
            background_color: activeTemplate.background_color,
            photo_spacing: activeTemplate.photo_spacing
          });
        }
      } catch (err) {
        console.warn('⚠️ No hay template activo, usando configuración por defecto');
      }

      // Generar preview con metadatos completos del template
      console.log('🚀 Llamando API preview-strip...');
      const previewUrl = await photoboothAPI.image.previewStrip({
        photo_paths: photoPaths,
        design_path: designPath,
        // Metadatos del template (opcionales, backend usa defaults)
        layout: activeTemplate?.layout,
        design_position: activeTemplate?.design_position,
        background_color: activeTemplate?.background_color,
        photo_spacing: activeTemplate?.photo_spacing,
        photo_filter: activeEvent?.photo_filter || 'none',
      });

      console.log('✅ Preview generado:', previewUrl);
      setStripPreviewUrl(previewUrl);
      setPreviewCountdown(5);
    } catch (error) {
      console.error('❌ Error generando preview:', error);
      toast.error('Error al generar preview');
      // Si falla, ir directo a processing
      setBoothState('processing');
      setCurrentScreen('processing');
    }
  };

  // Preview final countdown
  useEffect(() => {
    if (boothState !== 'preview-final') return;

    if (previewCountdown === 0) {
      // Ir a processing
      speak('Procesando tu tira de fotos.', { rate: 1.0, pitch: 1.0 });
      setBoothState('processing');
      setCurrentScreen('processing');
      return;
    }

    const timer = setTimeout(() => {
      setPreviewCountdown(previewCountdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [boothState, previewCountdown, speak, setCurrentScreen]);

  // Mensaje de bienvenida
  useEffect(() => {
    if (boothState === 'idle') {
      speak('Bienvenido. Toca la pantalla para comenzar.', { rate: 1.0, pitch: 1.0 });
    }
  }, [boothState, speak]);

  // Cargar conteo de fotos de galería
  // Contador de fotos en galería
  const loadGalleryCount = async () => {
    try {
      const data = await photoboothAPI.gallery.getStats();
      setGalleryPhotoCount(data.total_photos || 0);
    } catch (error) {
      console.error('Error loading gallery count:', error);
    }
  };

  // Cargar evento activo
  const loadActiveEvent = async () => {
    try {
      const data = await photoboothAPI.presets.list();
      setActiveEvent(data.active_preset || null);
    } catch (error) {
      console.error('Error loading active event:', error);
    }
  };

  useEffect(() => {
    loadGalleryCount();
    loadActiveEvent();
    // Actualizar cada 30 segundos
    const interval = setInterval(() => {
      loadGalleryCount();
      loadActiveEvent();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sincronizar preferencia de kiosk con el proceso principal
  useEffect(() => {
    if (!window.electronAPI?.setKioskMode) return;
    void window.electronAPI.setKioskMode(kioskMode).catch(() => {
      addLog({ level: 'warning', source: 'kiosk', message: 'No se pudo aplicar modo kiosk' });
    });
  }, [kioskMode, addLog]);

  // Handlers para StaffDock
  const handleOpenSettings = () => {
    setCurrentScreen('settings');
  };

  const handleOpenGallery = () => {
    setCurrentScreen('gallery');
  };

  const handleOpenDesigns = () => {
    // Abrir tab de diseños en settings
    setCurrentScreen('settings');
    // TODO: Pasar parámetro para abrir tab específico
  };

  const handleOpenChecklist = () => {
    setIsChecklistOpen(true);
  };

  return (
    <div className="flex h-screen w-screen bg-black">
      {/* Operational HUD - Status de dispositivos (solo en modo staff) */}
      {!kioskMode && (
        <OperationalHUD
          cameraStatus={deviceStatus.cameraStatus}
          printerStatus={deviceStatus.printerStatus}
          backendStatus={deviceStatus.backendStatus}
          cameraDetails={deviceStatus.cameraDetails}
          printerDetails={deviceStatus.printerDetails}
          backendDetails={deviceStatus.backendDetails}
          lastPrintJobError={deviceStatus.lastPrintJobError}
          lastPrintJobId={deviceStatus.lastPrintJobId}
          failedPrintJobs={deviceStatus.failedPrintJobs}
          onStatusClick={(device) => {
            console.log(`Status clicked: ${device}`);
            deviceStatus.refresh();
          }}
        />
      )}

      {/* Event Indicator - Enhanced with glassmorphism (solo en modo staff) */}
      {!kioskMode && activeEvent && (
        <div className="fixed top-20 left-4 z-40 glass rounded-xl max-w-xs animate-slide-in-blur">
          {/* Gradient accent border */}
          <div
            className="absolute inset-0 rounded-xl opacity-50"
            style={{
              background: 'var(--gradient-primary)',
              zIndex: -1,
              filter: 'blur(8px)',
            }}
          />

          <div className="relative px-4 py-3 border border-white/10 rounded-xl backdrop-blur-xl bg-black/40">
            <div className="flex items-center gap-3">
              {/* Pulsing indicator */}
              <div className="flex-shrink-0 relative">
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                <div className="absolute inset-0 w-3 h-3 bg-primary rounded-full animate-ping opacity-75" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xs text-white/60 font-medium uppercase tracking-wider mb-0.5">
                  Evento Activo
                </div>
                <div className="text-base text-white font-bold truncate">
                  {activeEvent.name}
                </div>
                {activeEvent.event_date && (
                  <div className="flex items-center gap-1.5 text-xs text-white/70 mt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(activeEvent.event_date).toLocaleDateString('es-MX', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                )}
                {activeEvent.template_name && (
                  <div className="text-[11px] text-white/60 mt-1">
                    {activeEvent.template_name}
                    {activeTemplateLabel ? ` • ${activeTemplateLabel}` : ''}
                  </div>
                )}
              </div>

              {/* Event type emoji */}
              <div className="flex-shrink-0 text-2xl opacity-80">
                {EVENT_TYPE_LABELS[activeEvent.event_type].split(' ')[0]}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR IZQUIERDA: 3 Photo Slots - Enhanced with glassmorphism */}
      <aside className="w-[25%] min-w-[320px] max-w-[480px] flex flex-col items-center justify-center gap-8 p-8 relative overflow-hidden border-r border-white/5">
        {/* Animated gradient mesh background */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: 'var(--gradient-mesh)',
          }}
        />
        {/* Dark overlay for glassmorphism */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-none" />
        {[...Array(effectivePhotosToTake)].map((_, i) => (
          <div
            key={i}
            className={`
              w-full aspect-[3/4] rounded-xl overflow-hidden
              transition-all duration-500 relative z-10
              ${i < photoSlots.length
                ? 'border-[3px] shadow-2xl'
                : i === currentPhotoIndex && boothState !== 'idle' && boothState !== 'success' && boothState !== 'reviewing'
                  ? 'border-[3px] border-primary animate-breathe'
                  : 'border-2 border-white/10 shadow-md'
              }
            `}
            style={{
              animation: i < photoSlots.length ? 'photoShoot 2.0s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : undefined,
              borderColor: i < photoSlots.length ? 'var(--primary)' : undefined,
              boxShadow: i < photoSlots.length ? 'var(--shadow-glow-magenta)' : undefined,
            }}
          >
            {photoSlots[i] ? (
              <div className="relative w-full h-full group cursor-pointer transition-transform duration-300 hover:scale-110 hover:-translate-y-3 hover:shadow-2xl hover:shadow-[#ff0080]/60">
                <img 
                  src={photoSlots[i]} 
                  alt={`Foto ${i + 1}`}
                  className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-110"
                  loading="eager"
                  onLoad={() => console.log(`✅ Foto ${i+1} cargada`)}          
                  onError={() => {
                    console.error(`❌ Error cargando foto ${i+1}:`, photoSlots[i]);
                    // NO reemplazar el src - dejar que el navegador reintente
                    // Si realmente no carga, el slot vacío se verá
                  }}
                />
                {/* Checkmark overlay (se desvanece al hover) */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-all duration-300 group-hover:opacity-0 group-hover:scale-110">
                  <div className="bg-[#ff0080] rounded-full w-16 h-16 flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:rotate-12 group-hover:scale-125">
                    <span className="text-4xl text-white font-bold">✓</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full bg-[#1a1a1a] flex flex-col items-center justify-center gap-3">
                {i === currentPhotoIndex && (boothState === 'countdown' || boothState === 'capturing') ? (
                  <>
                    <div className="relative">
                      <div className="w-6 h-6 bg-[#ff0080] rounded-full animate-ping absolute" />
                      <div className="w-6 h-6 bg-[#ff0080] rounded-full" />
                    </div>
                    <span className="text-sm text-[#ff0080] font-semibold animate-pulse">
                      {boothState === 'capturing' ? 'Capturando...' : 'Preparando...'}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-6xl text-[#2a2a2a] font-black">{i + 1}</span>
                    <span className="text-sm text-[#2a2a2a] font-medium">Esperando</span>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </aside>

      {/* ÁREA PRINCIPAL: Cámara + Overlays */}
      <main className="flex-1 relative">
        {/* Webcam */}
        <div className="absolute inset-0">
          {cameraError ? (
            <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white p-8">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold mb-4">Error de Cámara</h2>
              <p className="text-lg text-center mb-6">{cameraError}</p>
              <div className="text-sm text-gray-400 max-w-md text-center">
                <p className="mb-2">Por favor verifica:</p>
                <ul className="list-disc text-left pl-6">
                  <li>Que la cámara esté conectada</li>
                  <li>Que hayas dado permisos de cámara a esta aplicación</li>
                  <li>Que ninguna otra aplicación esté usando la cámara</li>
                </ul>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="mt-8 px-8 py-4 bg-[#ff0080] rounded-lg text-white font-bold hover:bg-[#ff0080]/80"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                width: 1280,
                height: 720,
                facingMode: 'user',
              }}
              className="w-full h-full object-cover"
              style={{ transform: mirrorPreview ? 'scaleX(-1)' : 'none' }}
              onUserMediaError={(error) => {
                console.error('❌ Camera error:', error);
                const errorMsg = error instanceof Error ? error.message : String(error);
                addLog({ level: 'error', source: 'camera', message: errorMsg });

                if (errorMsg.includes('Permission denied') || errorMsg.includes('NotAllowedError')) {
                  setCameraError('Acceso a la cámara denegado. Por favor permite el acceso en la configuración de tu navegador.');
                  toast.error('Acceso a cámara denegado');
                } else if (errorMsg.includes('NotFoundError') || errorMsg.includes('DevicesNotFoundError')) {
                  setCameraError('No se detectó ninguna cámara conectada.');
                  toast.error('Cámara no encontrada');
                } else if (errorMsg.includes('NotReadableError') || errorMsg.includes('TrackStartError')) {
                  setCameraError('La cámara está siendo usada por otra aplicación.');
                  toast.error('Cámara en uso');
                } else {
                  setCameraError(`Error: ${errorMsg}`);
                  toast.error('Error de cámara');
                }
              }}
            />
          )}
        </div>

        {/* OVERLAY: IDLE - Enhanced with modern design */}
        {boothState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
            {/* Animated instruction text */}
            <p className="text-2xl text-white/80 mb-8 animate-fade-in-up font-medium tracking-wide">
              Presiona el botón cuando estés listo
            </p>

            {/* Enhanced gradient button */}
            <button
              onClick={handleStart}
              className="
                relative px-20 py-8 rounded-full text-white text-4xl font-bold
                transition-all duration-300 hover:scale-105 active:scale-95
                overflow-hidden group
              "
              style={{
                minHeight: '80px',
                background: 'var(--gradient-primary)',
                boxShadow: 'var(--shadow-glow-magenta), var(--shadow-xl)',
              }}
              aria-label="Comenzar sesión de fotos"
            >
              {/* Shimmer effect on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s infinite',
                }}
              />
              <span className="relative z-10 drop-shadow-lg">TOCA PARA COMENZAR</span>
            </button>

            {/* Floating particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-primary animate-float"
                  style={{
                    left: `${20 + i * 15}%`,
                    bottom: '20%',
                    animationDelay: `${i * 0.5}s`,
                    animationDuration: `${3 + i * 0.5}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* OVERLAY: COUNTDOWN */}
        {boothState === 'countdown' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
            <CircularCountdown
              value={countdown}
              max={countdownSeconds}
              size={300}
              strokeWidth={12}
              color="#ff0080"
              className="mb-8"
            />
            <p className="text-white text-3xl font-bold">¡Prepárate!</p>
            <p className="text-white/70 text-xl mt-2">Foto {currentPhotoIndex + 1} de {effectivePhotosToTake}</p>
          </div>
        )}

        {/* OVERLAY: CAPTURING (Flash) */}
        {showFlash && (
          <div 
            className="absolute inset-0 bg-white pointer-events-none"
            style={{
              animation: 'flash 0.3s ease-out'
            }}
          />
        )}

        {/* OVERLAY: PAUSING */}
        {boothState === 'pausing' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/70 px-12 py-6 rounded-2xl">
              <p className="text-white text-2xl">Siguiente en {pauseCountdown}s</p>
            </div>
          </div>
        )}

        {/* OVERLAY: REVIEWING (Carousel) */}
        {boothState === 'reviewing' && photoSlots[reviewIndex] && (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center">
            {/* Contador discreto */}
            <div className="absolute top-6 right-6 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
              <span className="text-white text-lg font-medium">
                {reviewIndex + 1} / {effectivePhotosToTake}
              </span>
            </div>

            {/* Foto actual - GRANDE */}
            <div 
              key={`review-${reviewIndex}`}
              className="relative w-[65vh] h-[65vh] rounded-3xl overflow-hidden shadow-2xl border-4 border-[#ff0080]"
              style={{
                animation: 'carouselSlide 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards'
              }}
            >
              <img 
                src={photoSlots[reviewIndex]} 
                alt={`Foto ${reviewIndex + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay con feedback positivo */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                <p className="text-white text-3xl font-bold text-center drop-shadow-lg">
                  {reviewIndex === 0 && '¡Excelente! 📸'}
                  {reviewIndex === 1 && '¡Perfecta! ✨'}
                  {reviewIndex === 2 && '¡Increíble! 🎉'}
                </p>
              </div>
            </div>

            {/* Thumbnails navegación */}
            <div className="absolute bottom-16 flex gap-3">
              {photoSlots.map((photo, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setReviewIndex(i);
                    setReviewProgress(0);
                  }}
                  className={`w-14 h-14 rounded-lg cursor-pointer transition-all duration-300 overflow-hidden ${
                    i === reviewIndex 
                      ? 'ring-3 ring-[#ff0080] scale-110 opacity-100' 
                      : 'opacity-40 hover:opacity-80 hover:scale-105'
                  }`}
                >
                  <img 
                    src={photo} 
                    className="w-full h-full object-cover" 
                    alt={`Thumbnail ${i + 1}`}
                  />
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-6 w-80 h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#ff0080] transition-all duration-100 ease-linear"
                style={{ width: `${reviewProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* OVERLAY: PREVIEW FINAL */}
        {boothState === 'preview-final' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
            {/* Strip Preview */}
            {stripPreviewUrl ? (
              <div className="flex flex-col items-center">
                {/* Imagen del strip */}
                <div 
                  className="mb-8 rounded-2xl overflow-hidden shadow-2xl border-4 border-[#ff0080]"
                  style={{
                    animation: 'slideInUp 0.6s ease-out',
                    maxHeight: '70vh'
                  }}
                >
                  <img 
                    src={stripPreviewUrl} 
                    alt="Preview del strip"
                    className="h-full w-auto object-contain"
                  />
                </div>

                {/* Mensaje */}
                <div className="text-center">
                  <h1 className="text-7xl font-bold text-white mb-4 animate-bounce">
                    ¡Listo! 🎉
                  </h1>
                  <p className="text-4xl text-white/90 mb-2">
                    Así quedó tu tira de fotos
                  </p>
                  <p className="text-3xl text-[#ff0080] font-bold">
                    Recoge tus fotos con el staff
                  </p>
                  
                  {/* Countdown */}
                  <div className="mt-8 text-white/60 text-xl">
                    Procesando en {previewCountdown}s...
                  </div>
                </div>
              </div>
            ) : (
              // Loading mientras genera preview
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 border-4 border-[#ff0080] border-t-transparent rounded-full animate-spin mb-6" />
                <p className="text-white text-3xl font-bold">Generando vista previa...</p>
              </div>
            )}
          </div>
        )}

        {/* OVERLAY: PROCESSING */}
        {boothState === 'processing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
            <div className="w-16 h-16 border-4 border-[#ff0080] border-t-transparent rounded-full animate-spin mb-6" />
            <p className="text-white text-3xl font-bold">Creando tira...</p>
            <p className="text-white/70 text-xl mt-2">Espera un momento</p>
          </div>
        )}

        {/* OVERLAY: SUCCESS - Enhanced with premium animations */}
        {boothState === 'success' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
            {/* Confetti celebration! */}
            <Confetti active={true} count={60} duration={4000} />

            {/* Gradient mesh background */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{ background: 'var(--gradient-mesh)' }}
            />

            {/* Preview de las fotos - Enhanced with stagger effect */}
            <div className="flex gap-6 mb-8 relative z-10">
              {photoSlots.map((photo, i) => (
                <div
                  key={i}
                  className={`
                    w-48 h-36 rounded-xl overflow-hidden
                    border-[3px] shadow-2xl
                    hover:scale-110 hover:-rotate-2 hover:z-20
                    transition-all duration-300 cursor-pointer
                    stagger-${i + 1} animate-scale-in
                  `}
                  style={{
                    borderColor: 'var(--primary)',
                    boxShadow: 'var(--shadow-glow-magenta)',
                  }}
                  onClick={() => console.log('Click en foto', i + 1)}
                >
                  <img
                    src={photo}
                    alt={`Foto ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('❌ Error en preview final:', photo);
                      e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150"><rect width="200" height="150" fill="%23ff0080"/></svg>';
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Success message with gradient text */}
            <div className="text-7xl mb-6 animate-bounce-smooth">✨</div>
            <h2 className="text-white text-6xl font-bold mb-4 gradient-text">
              ¡Perfecto!
            </h2>
            <p className="text-white/70 text-xl mb-12 animate-fade-in-up">
              Tus {effectivePhotosToTake} fotos están listas
            </p>

            {/* Enhanced action buttons */}
            <div className="flex gap-6 relative z-10">
              <button
                onClick={() => {
                  speak('Enviando a impresora.', { rate: 1.0, pitch: 1.0 });
                  setCurrentScreen('processing');
                }}
                className="
                  relative px-16 py-6 rounded-full text-white text-2xl font-bold
                  hover:scale-105 active:scale-95 transition-all duration-300
                  overflow-hidden group
                "
                style={{
                  minHeight: '80px',
                  background: 'var(--gradient-primary)',
                  boxShadow: 'var(--shadow-glow-magenta), var(--shadow-xl)',
                }}
                aria-label="Imprimir fotos"
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s infinite',
                  }}
                />
                <span className="relative z-10">IMPRIMIR</span>
              </button>

              <button
                onClick={handleReset}
                className="
                  px-16 py-6 glass rounded-full text-white text-2xl font-bold
                  hover:scale-105 active:scale-95 transition-all duration-300
                  border-2 border-white/20
                "
                style={{ minHeight: '80px' }}
                aria-label="Nueva sesión"
              >
                NUEVA
              </button>
            </div>

            <p className="text-white/50 text-lg mt-8 animate-pulse">
              Auto-reset en {autoResetTimer}s
            </p>
          </div>
        )}

        {/* Loading overlay mientras captura */}
        {isCapturingPhoto && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
            <div className="bg-[#ff0080] rounded-full p-6 animate-pulse">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        )}

        {/* Indicador de teclas (esquina inferior) */}
        <div className="absolute bottom-4 left-4 bg-black/50 px-4 py-2 rounded text-white/50 text-sm">
          {boothState === 'idle' ? (
            <span><kbd className="px-2 py-1 bg-white/10 rounded">SPACE</kbd> Comenzar</span>
          ) : (
            <span><kbd className="px-2 py-1 bg-white/10 rounded">ESC</kbd> Reiniciar</span>
          )}
        </div>

        {/* Staff Dock - Menú lateral (siempre visible, acceso discreto para staff) */}
      <StaffDock
        onOpenSettings={handleOpenSettings}
        onOpenGallery={handleOpenGallery}
        onOpenDesigns={handleOpenDesigns}
        onOpenChecklist={handleOpenChecklist}
        onRetryPrint={
          deviceStatus.lastPrintJobId
            ? () => photoboothAPI.print.retryJob(deviceStatus.lastPrintJobId)
            : undefined
        }
        hasPrintError={Boolean(deviceStatus.lastPrintJobError)}
        failedPrintJobs={deviceStatus.failedPrintJobs}
        galleryPhotoCount={galleryPhotoCount}
      />

      {/* Staff Log Panel (solo en modo staff) */}
      {!kioskMode && <StaffLogPanel />}
      </main>

      <HardwareChecklistDialog
        open={isChecklistOpen}
        onOpenChange={setIsChecklistOpen}
        status={{
          cameraStatus: deviceStatus.cameraStatus,
          printerStatus: deviceStatus.printerStatus,
          backendStatus: deviceStatus.backendStatus,
          cameraDetails: deviceStatus.cameraDetails,
          printerDetails: deviceStatus.printerDetails,
          backendDetails: deviceStatus.backendDetails,
        }}
        onRefresh={deviceStatus.refresh}
        activeEvent={activeEvent}
      />

      {/* Error Toast */}
      {errorMessage && (
        <div 
          className="fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-4 animate-slideInDown z-50"
          style={{ animation: 'slideInDown 0.3s ease-out' }}
        >
          <span className="text-2xl">❌</span>
          <div className="flex-1">
            <p className="font-bold">Error</p>
            <p className="text-sm">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-white hover:text-red-200 transition-colors text-xl font-bold"
            aria-label="Cerrar error"
          >
            ×
          </button>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes flash {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }

        @keyframes photoShoot {
          0% {
            opacity: 0;
            transform: scale(0.85) translateY(-80px) translateX(0);
            filter: brightness(2.5) contrast(1.1) saturate(0.4) sepia(1);
          }
          25% {
            opacity: 0.7;
            transform: scale(0.92) translateY(-20px) translateX(2px);
            filter: brightness(1.8) contrast(1.05) saturate(0.6) sepia(0.7);
          }
          50% {
            opacity: 0.95;
            transform: scale(0.98) translateY(5px) translateX(-3px);
            filter: brightness(1.4) contrast(1) saturate(0.8) sepia(0.3);
          }
          70% {
            opacity: 1;
            transform: scale(1.01) translateY(-2px) translateX(2px);
            filter: brightness(1.15) contrast(1) saturate(0.95) sepia(0.1);
          }
          85% {
            transform: scale(1) translateY(1px) translateX(-1px);
            filter: brightness(1.05) contrast(1) saturate(1) sepia(0);
          }
          95% {
            transform: scale(1) translateY(0) translateX(0.5px);
            filter: brightness(1) contrast(1) saturate(1) sepia(0);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0) translateX(0);
            filter: brightness(1) contrast(1) saturate(1) sepia(0);
          }
        }

        @keyframes carouselSlide {
          0% {
            opacity: 0;
            transform: scale(0.8) translateX(100px);
            filter: blur(10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateX(0);
            filter: blur(0);
          }
        }

        @keyframes heartbeat {
          0%, 100% { 
            transform: scale(1); 
          }
          25% { 
            transform: scale(1.15); 
          }
          50% { 
            transform: scale(0.95); 
          }
        }

        @keyframes slideInUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
