/**
 * App Principal - PhotoBooth
 * Manejo de flujo de pantallas optimizado
 */
import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import StartScreen from './components/screens/StartScreen';
import CountdownScreen from './components/screens/CountdownScreen';
import CaptureScreen from './components/screens/CaptureScreen';
import photoBoothAPI from './services/api';

function App() {
  const { currentScreen } = useAppStore();

  // Verificar conexión con backend al iniciar
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const isHealthy = await photoBoothAPI.healthCheck();
        if (isHealthy) {
          console.log('✅ Backend conectado');
        } else {
          console.warn('⚠️  Backend no responde');
        }
      } catch (error) {
        console.error('❌ Error al conectar con backend:', error);
      }
    };

    checkBackend();
  }, []);

  // Renderizar pantalla actual
  const renderScreen = () => {
    switch (currentScreen) {
      case 'start':
        return <StartScreen />;
      
      case 'countdown':
        return <CountdownScreen />;
      
      case 'capture':
        return <CaptureScreen />;
      
      case 'processing':
        return <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-primary-500 mx-auto mb-6"></div>
            <p className="text-3xl font-display font-semibold text-gray-700">
              Creando tu tira...
            </p>
          </div>
        </div>;
      
      case 'success':
        return <div className="flex items-center justify-center h-screen bg-gradient-to-br from-accent-success to-primary-500">
          <div className="text-center text-white">
            <div className="text-9xl mb-6 animate-bounce-in">🎉</div>
            <h1 className="text-6xl font-display font-extrabold mb-4">
              ¡Listo!
            </h1>
            <p className="text-3xl">
              Recoge tus fotos en la impresora
            </p>
          </div>
        </div>;
      
      default:
        return <StartScreen />;
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden">
      {renderScreen()}
    </div>
  );
}

export default App;
