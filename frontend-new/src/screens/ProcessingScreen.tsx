import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import photoboothAPI from '../services/api';
import { useAudio } from '../hooks/useAudio';

export default function ProcessingScreen() {
  const {
    capturedImages,
    setStripData,
    setCurrentScreen,
    setIsLoading,
    setError,
  } = useAppStore();

  const { speak } = useAudio();

  const { photoPaths, sessionId } = useAppStore();

  useEffect(() => {
    // Mensaje de procesamiento
    speak('Estamos creando tu tira de fotos. Espera un momento por favor.', { rate: 1.0 });

    const processImages = async () => {
      try {
        setIsLoading(true);

        // ✅ OBTENER DISEÑO DEL TEMPLATE ACTIVO
        let designPath: string | null = null;
        try {
          const activeTemplate = await photoboothAPI.templates.getActive();
          if (activeTemplate?.design_file_path) {
            designPath = activeTemplate.design_file_path;
            console.log('✅ Usando diseño del template:', designPath);
          }
        } catch (error) {
          console.warn('⚠️  No hay template activo con diseño, continuando sin diseño');
        }

        // ✅ COMPONER STRIP CON BACKEND
        // Backend crea: strip_path (600x1800) y full_page_path (1200x1800 con 2 tiras)
        const stripResponse = await photoboothAPI.image.composeStrip({
          photo_paths: photoPaths, // Rutas del backend
          design_path: designPath,
          session_id: sessionId || undefined,
        });

        console.log('✅ Strip creado:', stripResponse);

        // Guardar rutas en store
        if (stripResponse.success) {
          setStripData(
            stripResponse.strip_path,      // Tira simple
            stripResponse.full_page_path   // Formato 2x para imprimir
          );
        }

        // Pequeña pausa para UX
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Move to success screen
        setCurrentScreen('success');

      } catch (error) {
        console.error('❌ Error processing images:', error);
        setError(error instanceof Error ? error.message : 'Error al procesar imágenes');
        speak('Error al procesar las fotos. Por favor intenta de nuevo.', { rate: 1.0 });
        
        // Volver a inicio después de error
        setTimeout(() => {
          setCurrentScreen('start');
        }, 3000);
      } finally {
        setIsLoading(false);
      }
    };

    processImages();
  }, [capturedImages, photoPaths, sessionId, setStripData, setCurrentScreen, setIsLoading, setError, speak]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
      <div className="text-center space-y-8">
        <Loader2 className="w-32 h-32 animate-spin text-purple-400 mx-auto" />
        
        <h1 className="text-6xl font-bold">
          Creando tu tira de fotos...
        </h1>
        
        <p className="text-2xl text-gray-300">
          ¡Esto solo tomará un momento!
        </p>

        {/* Progress animation */}
        <div className="mt-12 w-96 mx-auto">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full animate-[pulse_2s_ease-in-out_infinite]" />
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-2">
          {capturedImages.map((img, index) => (
            <div
              key={index}
              className="w-20 h-20 rounded-lg overflow-hidden border-2 border-purple-500 shadow-lg animate-pulse"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <img
                src={img.url}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
