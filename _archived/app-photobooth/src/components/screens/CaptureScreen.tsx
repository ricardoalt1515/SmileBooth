/**
 * CaptureScreen - Pantalla de pausa entre fotos
 * Muestra la foto capturada y prepara para la siguiente
 */
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function CaptureScreen() {
  const { currentSession } = useAppStore();
  
  const currentPhotoNumber = currentSession ? currentSession.photos.length : 0;
  const totalPhotos = 3;

  return (
    <div className="relative w-screen h-screen bg-gradient-to-br from-accent-success/20 to-primary-100 flex flex-col items-center justify-center">
      {/* Checkmark animado */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="mb-8"
      >
        <div className="w-32 h-32 bg-accent-success rounded-full flex items-center justify-center shadow-2xl">
          <Check className="w-20 h-20 text-white" strokeWidth={3} />
        </div>
      </motion.div>

      {/* Mensaje */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <h1 className="text-5xl font-display font-bold text-gray-800 mb-3">
          ✅ Foto {currentPhotoNumber} lista
        </h1>
        
        {currentPhotoNumber < totalPhotos ? (
          <>
            <p className="text-2xl text-gray-600 mb-8">
              Prepárate para la siguiente
            </p>
            
            {/* Indicador de progreso */}
            <div className="flex gap-3 justify-center">
              {[1, 2, 3].map((num) => (
                <div
                  key={num}
                  className={`w-6 h-6 rounded-full transition-all duration-300 ${
                    num <= currentPhotoNumber
                      ? 'bg-accent-success shadow-lg scale-125'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </>
        ) : (
          <p className="text-2xl text-gray-600">
            Procesando tus fotos...
          </p>
        )}
      </motion.div>

      {/* Countdown visual hasta siguiente foto */}
      {currentPhotoNumber < totalPhotos && (
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2 }}
          className="absolute bottom-0 left-0 h-2 bg-accent-success"
        />
      )}
    </div>
  );
}
