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
import { EventPreset, EVENT_TYPE_LABELS } from '../types/preset';
import { Calendar } from 'lucide-react';

type BoothState = 'idle' | 'countdown' | 'capturing' | 'pausing' | 'reviewing' | 'preview-final' | 'processing' | 'success';

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
  } = useAppStore();

  const webcamRef = useRef<Webcam>(null);
  const [boothState, setBoothState] = useState<BoothState>('idle');
  const [countdown, setCountdown] = useState(5);
  const [pauseCountdown, setPauseCountdown] = useState(2);
  const [photoSlots, setPhotoSlots] = useState<string[]>([]);
  const [autoResetTimer, setAutoResetTimer] = useState(30);
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

  const { speak } = useAudio();
  const { playShutter, playBeep, playSuccess } = useSoundEffects();
  const toast = useToastContext();
  const deviceStatus = useDeviceStatus();

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

      // Si es la última foto, ir a REVIEW (carousel)
      if (currentPhotoIndex === photosToTake - 1) {
        playSuccess();
        speak('¡Perfecto! Mira tus fotos.', { rate: 1.0, pitch: 1.1 });
        setTimeout(() => {
          setBoothState('reviewing');
          setReviewIndex(0);
          setReviewProgress(0);
        }, 1000);
      } else {
        speak('Bien. Siguiente foto.', { rate: 1.0, pitch: 1.0 });
        setBoothState('pausing');
        setPauseCountdown(2);
      }

    } catch (error) {
      console.error('Error capturing photo:', error);
      const message = error instanceof Error ? error.message : 'Error al capturar foto';
      setError(message);
      setErrorMessage(message);
      speak('Error al capturar. Intenta de nuevo.', { rate: 1.0, pitch: 1.0 });
      setBoothState('idle');
    } finally {
      setIsCapturingPhoto(false);
    }
  }, [currentPhotoIndex, photosToTake, sessionId, addCapturedImage, addPhotoPath, setSessionId, incrementPhotoIndex, setCurrentScreen, setError, playShutter, playSuccess, speak]);

  // Countdown principal (5-4-3-2-1)
  useEffect(() => {
    if (boothState !== 'countdown') return;

    if (countdown === 0) {
      capturePhoto();
      return;
    }

    const timer = setTimeout(() => {
      playBeep(countdown === 1 ? 900 : 600, 150);
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
      setCountdown(5);
      return;
    }

    const timer = setTimeout(() => {
      setPauseCountdown(pauseCountdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [boothState, pauseCountdown]);

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
  }, [boothState, autoResetTimer]);

  // Iniciar sesión
  const handleStart = () => {
    if (boothState !== 'idle') return;
    
    speak('Prepárate. Primera foto en cinco segundos.', { rate: 1.0, pitch: 1.0 });
    setBoothState('countdown');
    setCountdown(5);
  };

  // Reset
  const handleReset = () => {
    reset();
    setBoothState('idle');
    setPhotoSlots([]);
    setCountdown(5);
    setPauseCountdown(2);
    setAutoResetTimer(30);
    setShowFlash(false);
  };

  // Tecla SPACE para iniciar + flechas para carousel
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && boothState === 'idle') {
        e.preventDefault();
        handleStart();
      }
      if (e.code === 'Escape' && boothState !== 'idle') {
        e.preventDefault();
        handleReset();
      }
      // Navegación en carousel
      if (boothState === 'reviewing') {
        if (e.code === 'ArrowRight' && reviewIndex < photosToTake - 1) {
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
  }, [boothState, reviewIndex, photosToTake]);

  // Carousel auto-advance
  useEffect(() => {
    if (boothState !== 'reviewing') return;

    // Duración por foto: 2.5s (primeras 2), 3s (última)
    const duration = reviewIndex === photosToTake - 1 ? 3000 : 2500;
    
    // Progress bar animation
    const progressInterval = setInterval(() => {
      setReviewProgress((prev) => {
        const increment = 100 / (duration / 50); // Update cada 50ms
        return Math.min(prev + increment, 100);
      });
    }, 50);

    // Auto-advance o ir a preview final
    const advanceTimer = setTimeout(() => {
      if (reviewIndex < photosToTake - 1) {
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
  }, [boothState, reviewIndex, photosToTake, playBeep, speak, setCurrentScreen]);

  // Generar preview del strip
  const generateStripPreview = async () => {
    try {
      console.log('🎬 Generando preview del strip...');
      console.log('📸 Photo paths:', photoPaths);
      
      // Obtener diseño del template activo
      let designPath: string | null = null;
      try {
        const activeTemplate = await photoboothAPI.templates.getActive();
        if (activeTemplate?.design_file_path) {
          designPath = activeTemplate.design_file_path;
          console.log('🎨 Diseño del template:', designPath);
        }
      } catch (err) {
        console.warn('⚠️ No hay template activo con diseño');
      }

      // Generar preview
      console.log('🚀 Llamando API preview-strip...');
      const previewUrl = await photoboothAPI.image.previewStrip({
        photo_paths: photoPaths,
        design_path: designPath,
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
    // TODO: Abrir dialog de checklist
    console.log('Opening hardware checklist...');
    toast.info('Hardware Checklist - Próximamente');
  };

  return (
    <div className="flex h-screen w-screen bg-black">
      {/* Operational HUD - Status de dispositivos */}
      <OperationalHUD
        cameraStatus={deviceStatus.cameraStatus}
        printerStatus={deviceStatus.printerStatus}
        backendStatus={deviceStatus.backendStatus}
        cameraDetails={deviceStatus.cameraDetails}
        printerDetails={deviceStatus.printerDetails}
        backendDetails={deviceStatus.backendDetails}
        onStatusClick={(device) => {
          console.log(`Status clicked: ${device}`);
          deviceStatus.refresh();
        }}
      />

      {/* Event Indicator - Evento activo */}
      {activeEvent && (
        <div className="fixed top-20 left-4 z-40 bg-gradient-to-r from-[#ff0080]/90 to-[#ff0080]/70 backdrop-blur-sm rounded-lg shadow-lg border border-[#ff0080]/50 px-4 py-2 max-w-xs">
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white/80 font-medium uppercase tracking-wide">
                Evento Activo
              </div>
              <div className="text-sm text-white font-bold truncate">
                {activeEvent.name}
              </div>
              {activeEvent.event_date && (
                <div className="flex items-center gap-1 text-xs text-white/70 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  {new Date(activeEvent.event_date).toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </div>
              )}
            </div>
            <div className="flex-shrink-0 text-lg">
              {EVENT_TYPE_LABELS[activeEvent.event_type].split(' ')[0]}
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR IZQUIERDA: 3 Photo Slots */}
      <aside className="w-[25%] min-w-[320px] max-w-[480px] flex flex-col items-center justify-center gap-8 p-8 bg-gradient-to-b from-black via-[#0a0a0a] to-black border-r-2 border-[#2a2a2a]">
        {[...Array(photosToTake)].map((_, i) => (
          <div
            key={i}
            className={`w-full aspect-[3/4] rounded-xl overflow-hidden transition-all duration-500 ${
              i < photoSlots.length
                ? 'border-3 border-[#ff0080] shadow-lg shadow-[#ff0080]/50'
                : i === currentPhotoIndex && boothState !== 'idle' && boothState !== 'success' && boothState !== 'reviewing'
                  ? 'border-3 border-[#ff0080] animate-pulse'
                  : 'border-2 border-[#2a2a2a]'
            }`}
            style={{
              animation: i < photoSlots.length ? 'photoShoot 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards' : undefined
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
              onUserMediaError={(error) => {
                console.error('❌ Camera error:', error);
                const errorMsg = error instanceof Error ? error.message : String(error);

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

        {/* OVERLAY: IDLE */}
        {boothState === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <button
              onClick={handleStart}
              className="px-20 py-8 bg-[#ff0080] rounded-full text-white text-4xl font-bold hover:bg-[#ff0080]/90 transition-all duration-300 hover:scale-105"
              style={{ minHeight: '80px' }}
              aria-label="Comenzar sesión de fotos"
            >
              TOCA PARA COMENZAR
            </button>
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
            <p className="text-white/70 text-xl mt-2">Foto {currentPhotoIndex + 1} de {photosToTake}</p>
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
                {reviewIndex + 1} / {photosToTake}
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

        {/* OVERLAY: SUCCESS */}
        {boothState === 'success' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm">
            {/* Preview de las 3 fotos - MÁS GRANDE */}
            <div className="flex gap-6 mb-8" style={{ animation: 'slideInUp 0.5s ease-out' }}>
              {photoSlots.map((photo, i) => (
                <div 
                  key={i}
                  className="w-48 h-36 rounded-xl overflow-hidden border-4 border-[#ff0080] shadow-2xl shadow-[#ff0080]/40 hover:scale-105 transition-transform duration-300 cursor-pointer"
                  style={{ 
                    animation: `slideInUp 0.5s ease-out ${i * 0.15}s backwards`
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

            <div className="text-7xl mb-6 animate-bounce">✨</div>
            <h2 className="text-white text-6xl font-bold mb-4">¡Perfecto!</h2>
            <p className="text-white/70 text-xl mb-12">Tus 3 fotos están listas</p>
            
            <div className="flex gap-6">
              <button
                onClick={() => {
                  speak('Enviando a impresora.', { rate: 1.0, pitch: 1.0 });
                  setCurrentScreen('processing');
                }}
                className="px-16 py-6 bg-[#ff0080] rounded-full text-white text-2xl font-bold hover:bg-[#ff0080]/90 hover:scale-105 transition-all duration-300 shadow-lg shadow-[#ff0080]/50"
                style={{ minHeight: '80px' }}
                aria-label="Imprimir fotos"
              >
                IMPRIMIR
              </button>
              
              <button
                onClick={handleReset}
                className="px-16 py-6 bg-transparent border-2 border-white rounded-full text-white text-2xl font-bold hover:bg-white/10 hover:scale-105 transition-all duration-300"
                style={{ minHeight: '80px' }}
                aria-label="Nueva sesión"
              >
                NUEVA
              </button>
            </div>

            <p className="text-white/50 text-lg mt-8">
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

        {/* Staff Dock - Menú lateral */}
        <StaffDock
          onOpenSettings={handleOpenSettings}
          onOpenGallery={handleOpenGallery}
          onOpenDesigns={handleOpenDesigns}
          onOpenChecklist={handleOpenChecklist}
          galleryPhotoCount={galleryPhotoCount}
        />
      </main>

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
            transform: scale(0.5) translateY(60px);
            filter: brightness(3) contrast(0.8) saturate(0.3);
          }
          40% {
            opacity: 0.9;
            transform: scale(0.92) translateY(10px);
            filter: brightness(2) contrast(0.9) saturate(0.6);
          }
          70% {
            opacity: 1;
            transform: scale(1.02) translateY(-3px);
            filter: brightness(1.3) contrast(1) saturate(0.9);
          }
          85% {
            transform: scale(0.99) translateY(1px);
            filter: brightness(1.1) contrast(1) saturate(1);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: brightness(1) contrast(1) saturate(1);
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
