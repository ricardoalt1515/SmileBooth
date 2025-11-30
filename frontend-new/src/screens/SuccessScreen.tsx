import { useEffect, useState } from 'react';
import { CheckCircle, Printer, RotateCcw, Download } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useToastContext } from '../contexts/ToastContext';
import photoboothAPI from '../services/api';
import { useAudio, useSoundEffects } from '../hooks/useAudio';
import { Button } from '@/components/ui/button';
import Confetti from '../components/Confetti';

export default function SuccessScreen() {
  const {
    capturedImages,
    stripId,        // strip_path (tira simple)
    stripImageUrl,  // full_page_path (formato 2x para imprimir)
    sessionId,
    autoResetSeconds,
    reset,
    setCurrentScreen,
  } = useAppStore();

  const [countdown, setCountdown] = useState(autoResetSeconds || 30);
  const [isPrinting, setIsPrinting] = useState(false);
  const { speak } = useAudio();
  const { playSuccess } = useSoundEffects();
  const toast = useToastContext();

  // Mensaje de éxito y sonido al cargar
  useEffect(() => {
    playSuccess();
    setTimeout(() => {
      speak('¡Tus fotos están listas! Puedes imprimirlas, descargarlas o comenzar una nueva sesión.', {
        rate: 1.0,
        pitch: 1.1,
      });
    }, 500);
  }, [speak, playSuccess]);

  useEffect(() => {
    if (countdown === 0) {
      handleReset();
      return;
    }

    // Advertencia de countdown
    if (countdown === 5) {
      speak('Reiniciando en 5 segundos.', { rate: 1.1 });
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, speak]);

  const handleReset = () => {
    speak('Comenzando nueva sesión.', { rate: 1.2 });
    setTimeout(() => {
      reset();
      setCurrentScreen('start');
    }, 500);
  };

  const handlePrint = async () => {
    const pathToPrint = stripImageUrl || stripId;

    if (!pathToPrint) {
      speak('No hay strip para imprimir.', { rate: 1.0 });
      toast.error('No hay strip para imprimir');
      return;
    }

    try {
      setIsPrinting(true);
      speak('Enviando a impresora. Espera un momento.', { rate: 1.1 });

      // 1) Intentar reimpresión basada en sesión (para tracking y metadata)
      if (sessionId) {
        try {
          const reprintResponse = await photoboothAPI.sessions.reprint(sessionId, {
            copies: 1,
            file_path: pathToPrint,
          });
          console.log('✅ Reimpresión por sesión:', reprintResponse);
          speak('Impresión enviada. Recoge tus fotos en la impresora.', { rate: 1.0 });
          toast.success('¡Impresión enviada desde la sesión actual!');
          return;
        } catch (sessionError) {
          console.warn('⚠️ Error en reimpresión por sesión, usando impresión directa:', sessionError);
        }
      }

      // 2) Fallback robusto: impresión directa del archivo
      const printResponse = await photoboothAPI.print.queue({
        file_path: pathToPrint,
        copies: 1,
      });

      console.log('✅ Impresión directa enviada:', printResponse);
      speak('Impresión enviada. Recoge tus fotos en la impresora.', { rate: 1.0 });
      toast.success(`¡Impresión enviada! ${printResponse.message}`);
    } catch (error) {
      console.error('❌ Error printing:', error);
      speak('Error al enviar a imprimir.', { rate: 1.0 });
      toast.error('Error al enviar a imprimir');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownload = () => {
    if (capturedImages.length === 0) return;

    speak('Descargando tus fotos.', { rate: 1.2 });
    const link = document.createElement('a');
    link.href = capturedImages[0].url;
    link.download = `photobooth-${Date.now()}.jpg`;
    link.click();
  };

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden">
      {/* Confetti celebration */}
      <Confetti active={true} count={50} duration={4000} />

      {/* Gradient mesh background */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{ background: 'var(--gradient-mesh)' }}
      />

      {/* Radial glow */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(circle at 50% 50%, var(--primary) 0%, transparent 70%)',
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/50 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-8 text-white">
        {/* Success icon with glow */}
        <div className="mb-8 animate-scale-in">
          <div className="relative">
            {/* Glow effect */}
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-50"
              style={{ background: 'var(--gradient-primary)' }}
            />
            <CheckCircle
              className="relative w-32 h-32 text-white"
              style={{
                filter: 'drop-shadow(0 0 30px var(--primary))',
              }}
            />
          </div>
        </div>

        {/* Title with gradient */}
        <h1 className="text-7xl font-bold mb-4 text-center gradient-text animate-fade-in-up">
          ¡Listo!
        </h1>

        <p className="text-3xl mb-12 text-center text-white/80 animate-fade-in-up">
          Tus fotos están listas
        </p>

        {/* Photo preview with stagger */}
        <div className="mb-12 flex justify-center gap-4 flex-wrap max-w-4xl">
          {capturedImages.map((img, index) => (
            <div
              key={img.id}
              className={`
                w-48 h-48 rounded-2xl overflow-hidden
                transform hover:scale-110 hover:-rotate-2
                transition-all duration-300
                border-[3px] stagger-${(index % 5) + 1} animate-scale-in
              `}
              style={{
                borderColor: 'var(--primary)',
                boxShadow: 'var(--shadow-glow-magenta)',
              }}
            >
              <img
                src={img.url}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Action buttons using shadcn Button */}
        <div className="flex gap-6 mb-8 flex-wrap justify-center">
          <Button
            onClick={handlePrint}
            disabled={isPrinting}
            size="lg"
            className="
              px-8 py-6 text-xl h-auto rounded-full
              bg-white text-black hover:bg-white/90
              shadow-2xl
            "
          >
            <Printer className="w-6 h-6 mr-3" />
            {isPrinting ? 'Imprimiendo...' : 'Imprimir'}
          </Button>

          <Button
            onClick={handleDownload}
            variant="outline"
            size="lg"
            className="
              px-8 py-6 text-xl h-auto rounded-full
              glass border-white/30 text-white
              hover:bg-white/10 hover:border-white/50
              shadow-2xl
            "
          >
            <Download className="w-6 h-6 mr-3" />
            Descargar
          </Button>

          <Button
            onClick={handleReset}
            variant="outline"
            size="lg"
            className="
              px-8 py-6 text-xl h-auto rounded-full
              glass border-primary/30 text-white
              hover:bg-primary/20 hover:border-primary/50
              shadow-2xl
            "
          >
            <RotateCcw className="w-6 h-6 mr-3" />
            Nueva Sesión
          </Button>
        </div>

        {/* Countdown with pulse */}
        <div className="text-center text-white/80 glass px-8 py-4 rounded-2xl border border-white/10">
          <p className="text-lg">
            Nueva sesión automática en{' '}
            <span
              className="text-3xl font-bold animate-pulse"
              style={{
                color: countdown <= 5 ? 'var(--primary)' : 'white',
              }}
            >
              {countdown}
            </span>{' '}
            segundos
          </p>
          <p className="text-sm mt-2 text-white/60">
            O presiona "Nueva Sesión" para comenzar ahora
          </p>
        </div>
      </div>
    </div>
  );
}
