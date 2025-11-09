import { useEffect, useState } from 'react';
import { CheckCircle, Printer, RotateCcw, Download } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useToastContext } from '../contexts/ToastContext';
import photoboothAPI from '../services/api';
import { useAudio, useSoundEffects } from '../hooks/useAudio';

export default function SuccessScreen() {
  const {
    capturedImages,
    stripId,        // strip_path (tira simple)
    stripImageUrl,  // full_page_path (formato 2x para imprimir)
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
    // ✅ Imprimir el FULL_PAGE_PATH (formato 2x - 2 tiras en 1 hoja)
    const pathToRint = stripImageUrl || stripId;
    
    if (!pathToRint) {
      speak('No hay strip para imprimir.', { rate: 1.0 });
      toast.error('No hay strip para imprimir');
      return;
    }

    try {
      setIsPrinting(true);
      speak('Enviando a impresora. Espera un momento.', { rate: 1.1 });
      
      // ✅ IMPRIMIR CON BACKEND
      // Usa full_page_path que tiene 2 tiras (formato 2x)
      const printResponse = await photoboothAPI.print.queue({
        file_path: pathToRint,  // full_page_path (1200x1800)
        copies: 1,  // 1 hoja = 2 tiras (cliente corta por la mitad)
      });
      
      console.log('✅ Impresión enviada:', printResponse);
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
    <div className="relative h-screen w-screen bg-gradient-to-br from-green-600 via-blue-600 to-purple-700 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-4 h-4 bg-white rounded-full opacity-70 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-8 text-white">
        <div className="mb-8 animate-bounce">
          <CheckCircle className="w-32 h-32 text-white fill-green-400" />
        </div>

        <h1 className="text-7xl font-bold mb-4 text-center animate-pulse">
          ¡Listo!
        </h1>

        <p className="text-3xl mb-12 text-center">
          Tus fotos están listas
        </p>

        <div className="mb-12 flex justify-center gap-4 flex-wrap max-w-4xl">
          {capturedImages.map((img, index) => (
            <div
              key={img.id}
              className="w-48 h-48 rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-300 border-4 border-white"
              style={{
                animation: `slideIn 0.5s ease-out ${index * 0.1}s both`,
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

        <div className="flex gap-6 mb-8">
          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className={`flex items-center gap-3 px-8 py-4 bg-white text-purple-700 rounded-full text-xl font-bold shadow-2xl hover:scale-110 transition-transform duration-300 ${
              isPrinting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Printer className="w-6 h-6" />
            {isPrinting ? 'Imprimiendo...' : 'Imprimir'}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-3 px-8 py-4 bg-white text-blue-700 rounded-full text-xl font-bold shadow-2xl hover:scale-110 transition-transform duration-300"
          >
            <Download className="w-6 h-6" />
            Descargar
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-3 px-8 py-4 bg-white text-green-700 rounded-full text-xl font-bold shadow-2xl hover:scale-110 transition-transform duration-300"
          >
            <RotateCcw className="w-6 h-6" />
            Nueva Sesión
          </button>
        </div>

        <div className="text-center text-white/80">
          <p className="text-lg">
            Nueva sesión automática en{' '}
            <span className="text-2xl font-bold">{countdown}</span> segundos
          </p>
          <p className="text-sm mt-2">O presiona &quot;Nueva Sesión&quot; para comenzar ahora</p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-100vh) rotate(360deg); }
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(50px) scale(0.8); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
