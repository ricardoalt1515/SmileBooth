/**
 * Pantalla de Inicio - OPTIMIZADA
 * - Live preview simple
 * - Un botón gigante
 * - Mínimo consumo de recursos
 */
import { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function StartScreen() {
  const webcamRef = useRef<Webcam>(null);
  const { startSession, settings } = useAppStore();
  const [isWebcamReady, setIsWebcamReady] = useState(false);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user",
  };

  const handleStartSession = () => {
    // Vibración sutil en dispositivos compatibles
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    startSession();
  };

  return (
    <div className="relative w-screen h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-center p-8">
      {/* Header con logo/settings (opcional) */}
      <div className="absolute top-6 right-6">
        <button
          className="p-3 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
          onClick={() => {
            // TODO: Abrir settings
            console.log('Settings clicked');
          }}
        >
          ⚙️
        </button>
      </div>

      {/* Preview de cámara */}
      <div className="relative mb-8 rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
        <Webcam
          ref={webcamRef}
          audio={false}
          width={640}
          height={480}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          onUserMedia={() => setIsWebcamReady(true)}
          onUserMediaError={(error) => {
            console.error('Error al acceder a la cámara:', error);
          }}
          mirrored={true}
          className="w-[640px] h-[480px] object-cover"
        />

        {/* Loading overlay mientras carga la cámara */}
        {!isWebcamReady && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Iniciando cámara...</p>
            </div>
          </div>
        )}
      </div>

      {/* Título */}
      <h1 className="text-5xl font-display font-bold text-gray-800 mb-3 text-center">
        ¡Toma tus Fotos!
      </h1>
      <p className="text-2xl text-gray-600 mb-12 text-center">
        Serán 3 fotos en una tira
      </p>

      {/* Botón principal GIGANTE */}
      <button
        onClick={handleStartSession}
        disabled={!isWebcamReady}
        className="group relative w-[400px] h-[120px] bg-gradient-to-r from-primary-500 to-primary-600 
                   hover:from-primary-600 hover:to-primary-700 disabled:from-gray-400 disabled:to-gray-500
                   text-white rounded-[60px] shadow-[0_8px_20px_rgba(255,107,157,0.4)]
                   hover:shadow-[0_12px_30px_rgba(255,107,157,0.5)] hover:scale-105
                   active:scale-100 disabled:scale-100
                   transition-all duration-300 ease-out
                   flex items-center justify-center gap-4
                   font-display font-extrabold text-3xl tracking-wide
                   animate-pulse-slow
                   disabled:cursor-not-allowed disabled:animate-none"
      >
        <Camera className="w-12 h-12" />
        <span>INICIAR SESIÓN</span>
      </button>

      {/* Indicador si la cámara no está lista */}
      {!isWebcamReady && (
        <p className="mt-4 text-sm text-gray-500 text-center">
          Esperando cámara...
        </p>
      )}
    </div>
  );
}
