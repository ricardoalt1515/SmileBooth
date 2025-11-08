/**
 * CountdownScreen - Animación de cuenta regresiva
 * Con captura automática al llegar a 0
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from 'react-webcam';
import { useAppStore } from '../../store/useAppStore';
import photoBoothAPI from '../../services/api';

export default function CountdownScreen() {
  const { 
    countdown, 
    setCountdown, 
    currentSession, 
    addPhoto,
    setScreen,
    setLoading,
  } = useAppStore();
  
  const [flash, setFlash] = useState(false);
  const currentPhotoNumber = currentSession ? currentSession.photos.length + 1 : 1;
  const totalPhotos = 3;

  useEffect(() => {
    // Iniciar countdown desde 3
    setCountdown(3);
    
    // Countdown automático
    let currentCount = 3;
    const timer = setInterval(() => {
      currentCount--;
      setCountdown(currentCount);
      
      if (currentCount <= 0) {
        clearInterval(timer);
        // Capturar foto cuando llegue a 0
        setTimeout(() => capturePhoto(), 100);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const capturePhoto = async () => {
    try {
      // Flash visual
      setFlash(true);
      setTimeout(() => setFlash(false), 200);

      setLoading(true);

      // Capturar foto con backend
      const response = await photoBoothAPI.capturePhoto(
        0,
        currentSession?.id
      );

      // Agregar foto a la sesión
      addPhoto(response.file_path);

      // Esperar un poco antes de continuar
      await new Promise(resolve => setTimeout(resolve, 500));

      // Decidir siguiente pantalla
      if (currentPhotoNumber < totalPhotos) {
        // Más fotos por capturar - mostrar pausa y volver a countdown
        setScreen('capture');
        setTimeout(() => {
          setScreen('countdown');
        }, 2000); // 2 segundos de pausa
      } else {
        // Ya tenemos las 3 fotos - procesar
        setScreen('processing');
        processStrip();
      }

    } catch (error) {
      console.error('Error al capturar foto:', error);
      alert('Error al capturar foto. Intenta de nuevo.');
      setScreen('start');
    } finally {
      setLoading(false);
    }
  };

  const processStrip = async () => {
    try {
      if (!currentSession || currentSession.photos.length !== 3) {
        throw new Error('Sesión inválida');
      }

      // Obtener diseño activo
      const activeDesignResponse = await photoBoothAPI.getActiveDesign();
      const designPath = activeDesignResponse.active_design?.file_path || null;

      // Componer tira con diseño
      const stripResponse = await photoBoothAPI.composeStrip(
        currentSession.photos,
        designPath,
        currentSession.id
      );

      // Imprimir automáticamente (2 copias)
      if (stripResponse.full_page_path) {
        await photoBoothAPI.printImage(stripResponse.full_page_path, null, 2);
        console.log('✅ Impresión enviada automáticamente');
      }
      
      // Mostrar pantalla de éxito
      setTimeout(() => {
        setScreen('success');
        
        // Auto-retorno al inicio después de 5 segundos
        setTimeout(() => {
          setScreen('start');
        }, 5000);
      }, 1000);

    } catch (error) {
      console.error('Error al procesar tira:', error);
      alert('Error al procesar tira. Intenta de nuevo.');
      setScreen('start');
    }
  };

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user",
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {/* Vista previa de cámara a pantalla completa */}
      <div className="absolute inset-0">
        <Webcam
          audio={false}
          width={1920}
          height={1080}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          mirrored={true}
          className="w-full h-full object-cover opacity-80"
        />
      </div>

      {/* Flash blanco */}
      {flash && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-white z-50"
        />
      )}

      {/* Overlay con countdown */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
        {/* Número del countdown */}
        {countdown > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative"
            >
              <div className="text-[280px] font-display font-black text-accent-countdown drop-shadow-[0_0_60px_rgba(96,165,250,0.8)]">
                {countdown}
              </div>
              
              {/* Glow effect */}
              <div className="absolute inset-0 blur-3xl bg-accent-countdown/30 animate-pulse" />
            </motion.div>
          </AnimatePresence>
        )}

        {/* Texto de instrucción */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 text-center"
        >
          <p className="text-3xl font-display font-semibold text-white drop-shadow-lg">
            {countdown > 0 ? 'Prepárate...' : '✨ ¡Sonríe! ✨'}
          </p>
          <p className="text-xl mt-2 text-white/80">
            Foto {currentPhotoNumber} de {totalPhotos}
          </p>
        </motion.div>

        {/* Indicador de progreso */}
        <div className="absolute bottom-20 flex gap-3">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className={`w-5 h-5 rounded-full transition-all duration-300 ${
                num < currentPhotoNumber
                  ? 'bg-accent-success shadow-lg shadow-accent-success/50 scale-125'
                  : num === currentPhotoNumber
                  ? 'bg-accent-countdown shadow-lg shadow-accent-countdown/50 scale-125 animate-pulse'
                  : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
