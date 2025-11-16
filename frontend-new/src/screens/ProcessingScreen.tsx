import { useEffect, useState } from 'react';
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
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 300);

    speak('Estamos creando tu tira de fotos. Espera un momento por favor.', { rate: 1.0 });

    const processImages = async () => {
      try {
        setIsLoading(true);

        // Get active template
        let designPath: string | null = null;
        let activeTemplate = null;
        try {
          activeTemplate = await photoboothAPI.templates.getActive();
          if (activeTemplate) {
            designPath = activeTemplate.design_file_path || null;
            console.log('✅ Template activo:', {
              name: activeTemplate.name,
              layout: activeTemplate.layout,
              design_position: activeTemplate.design_position,
              background_color: activeTemplate.background_color,
              photo_spacing: activeTemplate.photo_spacing,
              design_path: designPath,
            });
          }
        } catch (error) {
          console.warn('⚠️  No hay template activo, usando configuración por defecto');
        }

        // Compose strip with backend
        const stripResponse = await photoboothAPI.image.composeStrip({
          photo_paths: photoPaths,
          design_path: designPath,
          session_id: sessionId || undefined,
          layout: activeTemplate?.layout,
          design_position: activeTemplate?.design_position,
          background_color: activeTemplate?.background_color,
          photo_spacing: activeTemplate?.photo_spacing,
        });

        console.log('✅ Strip creado:', stripResponse);

        if (stripResponse.success) {
          setStripData(stripResponse.strip_path, stripResponse.full_page_path);
        }

        // Complete progress bar
        setProgress(100);

        // Small UX pause
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Move to success screen
        setCurrentScreen('success');
      } catch (error) {
        console.error('❌ Error processing images:', error);
        setError(error instanceof Error ? error.message : 'Error al procesar imágenes');
        speak('Error al procesar las fotos. Por favor intenta de nuevo.', { rate: 1.0 });

        setTimeout(() => {
          setCurrentScreen('start');
        }, 3000);
      } finally {
        setIsLoading(false);
        clearInterval(progressInterval);
      }
    };

    processImages();

    return () => clearInterval(progressInterval);
  }, [capturedImages, photoPaths, sessionId, setStripData, setCurrentScreen, setIsLoading, setError, speak]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-black text-white relative overflow-hidden">
      {/* Animated gradient mesh background */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: 'var(--gradient-mesh)',
        }}
      />

      {/* Radial glow */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(circle at 50% 50%, var(--primary) 0%, transparent 70%)',
        }}
      />

      <div className="text-center space-y-8 relative z-10">
        {/* Spinning loader with multiple rings */}
        <div className="relative w-40 h-40 mx-auto">
          {/* Outer ring */}
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
            style={{
              borderTopColor: 'var(--primary)',
              borderRightColor: 'var(--cyan-accent)',
              animationDuration: '1.5s',
              filter: 'drop-shadow(0 0 20px var(--primary))',
            }}
          />

          {/* Middle ring */}
          <div
            className="absolute inset-4 rounded-full border-4 border-transparent animate-spin"
            style={{
              borderTopColor: 'var(--purple-accent)',
              borderLeftColor: 'var(--cyan-accent)',
              animationDuration: '2s',
              animationDirection: 'reverse',
              filter: 'drop-shadow(0 0 15px var(--purple-accent))',
            }}
          />

          {/* Inner glow */}
          <div className="absolute inset-8 rounded-full bg-primary/20 animate-pulse" />

          {/* Center icon - animated */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-5xl animate-bounce-smooth">📸</div>
          </div>
        </div>

        {/* Title with gradient */}
        <h1 className="text-6xl font-bold gradient-text animate-fade-in-up">
          Creando tu tira de fotos...
        </h1>

        <p className="text-2xl text-white/70 animate-fade-in-up">
          ¡Esto solo tomará un momento!
        </p>

        {/* Enhanced progress bar */}
        <div className="mt-12 w-[500px] mx-auto">
          <div className="relative h-3 bg-white/10 rounded-full overflow-hidden glass">
            <div
              className="h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden"
              style={{
                width: `${progress}%`,
                background: 'var(--gradient-primary)',
                boxShadow: 'var(--shadow-glow-magenta)',
              }}
            >
              {/* Shimmer effect */}
              <div
                className="absolute inset-0 animate-shimmer"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
                  backgroundSize: '200% 100%',
                }}
              />
            </div>
          </div>
          <div className="mt-2 text-center text-sm text-white/50">
            {Math.round(progress)}% completado
          </div>
        </div>

        {/* Photo thumbnails with enhanced animations */}
        <div className="mt-12 flex justify-center gap-4">
          {capturedImages.map((img, index) => (
            <div
              key={index}
              className="relative group"
              style={{
                animation: `float 3s ease-in-out infinite`,
                animationDelay: `${index * 0.3}s`,
              }}
            >
              <div
                className="w-24 h-24 rounded-xl overflow-hidden border-[3px] shadow-2xl transition-all duration-300 group-hover:scale-110"
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

              {/* Checkmark overlay */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg animate-scale-in">
                <span className="text-white text-sm font-bold">✓</span>
              </div>
            </div>
          ))}
        </div>

        {/* Processing steps indicator */}
        <div className="mt-8 flex items-center justify-center gap-2 text-white/50 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>Combinando fotos</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full bg-cyan-accent animate-pulse"
              style={{ animationDelay: '0.2s' }}
            />
            <span>Aplicando diseño</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full bg-purple-accent animate-pulse"
              style={{ animationDelay: '0.4s' }}
            />
            <span>Optimizando calidad</span>
          </div>
        </div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: `${3 + i * 0.3}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
