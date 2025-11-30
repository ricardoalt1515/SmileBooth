import { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { ToastProvider } from './contexts/ToastContext';
import UnifiedBoothScreen from './screens/UnifiedBoothScreen';
import ProcessingScreen from './screens/ProcessingScreen';
import SuccessScreen from './screens/SuccessScreen';
import SettingsScreen from './screens/SettingsScreen';
import GalleryScreen from './screens/GalleryScreen';
import Toast from './components/Toast';
import { useToast } from './hooks/useToast';
import photoboothAPI from './services/api';
import { DEFAULT_SETTINGS_PAYLOAD } from './config/constants';

function App() {
  const {
    currentScreen,
    setCurrentScreen,
    setBackendConnected,
    clearPhotoPaths,
    resetPhotoIndex,
    loadSettings,
    addLog,
  } = useAppStore();

  const [backendError, setBackendError] = useState<boolean>(false);
  const { toasts, hideToast } = useToast();

  // Listen for settings hotkey from Electron main process
  useEffect(() => {
    const handleOpenSettings = () => {
      console.log('Opening settings screen via hotkey');
      setCurrentScreen('settings');
    };

    // Register listener if running in Electron
    if (window.electronAPI) {
      window.electronAPI.onOpenSettings(handleOpenSettings);
    }

    // Cleanup
    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeOpenSettingsListener(handleOpenSettings);
      }
    };
  }, [setCurrentScreen]);

  // Hotkey Ctrl+G para abrir galería (solo web, Electron lo maneja en main.ts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+G o Cmd+G
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        console.log('Opening gallery via hotkey');
        setCurrentScreen('gallery');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCurrentScreen]);

  // Load settings and check backend connection on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check backend health
        await photoboothAPI.healthCheck();
        console.log('✅ Backend connected');
        setBackendConnected(true);
        addLog({ level: 'info', source: 'backend', message: 'Backend conectado' });
        setBackendError(false);

        // Load consolidated config (settings + presets + templates)
        try {
          const config = await photoboothAPI.config.get();
          console.log('⚙️ Config loaded:', config);
          loadSettings(config.settings);
          // En el futuro podemos hidratar presets/templates aquí sin más requests
        } catch (configError) {
          console.warn('⚠️  Could not load config, using default settings:', configError);
          loadSettings(DEFAULT_SETTINGS_PAYLOAD);
        }
      } catch (error) {
        console.warn('⚠️  Backend not available:', error);
        setBackendConnected(false);
        addLog({ level: 'warning', source: 'backend', message: 'Backend no disponible' });
        setBackendError(true);
        // Use default settings when backend unavailable
        loadSettings(DEFAULT_SETTINGS_PAYLOAD);
      }
    };

    initializeApp();

    // Check backend health every 60 seconds usando el endpoint consolidado
    const interval = setInterval(async () => {
      try {
        await photoboothAPI.fullHealth();
        setBackendConnected(true);
        setBackendError(false);
      } catch (error) {
        setBackendConnected(false);
        addLog({ level: 'warning', source: 'backend', message: 'Backend no disponible' });
        setBackendError(true);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [setBackendConnected, loadSettings, addLog]);

  // Cleanup al volver a start
  useEffect(() => {
    if (currentScreen === 'start') {
      clearPhotoPaths();
      resetPhotoIndex();
    }
  }, [currentScreen, clearPhotoPaths, resetPhotoIndex]);

  // Screen router (sin settings, que ahora es modal)
  const renderScreen = () => {
    switch (currentScreen) {
      // UnifiedBoothScreen maneja internamente: idle, countdown, capturing, pausing
      case 'start':
      case 'countdown':
      case 'capture':
      case 'settings': // Settings es overlay, mostrar booth detrás
        return <UnifiedBoothScreen />;

      // Pantallas legacy separadas
      case 'processing':
        return <ProcessingScreen />;
      case 'success':
        return <SuccessScreen />;
      
      // Galería del evento
      case 'gallery':
        return <GalleryScreen />;

      default:
        return <UnifiedBoothScreen />;
    }
  };

  return (
    <ToastProvider>
      <div className={`h-screen w-screen ${currentScreen === 'gallery' ? 'overflow-auto' : 'overflow-hidden'}`}>
        {/* Backend error banner */}
        {backendError && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-2 text-center text-sm">
            ⚠️ Backend no disponible - Usando configuración por defecto
          </div>
        )}

        {/* Toast notifications */}
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={() => hideToast(toast.id)}
          />
        ))}

        {/* Main screen */}
        {renderScreen()}

        {/* Settings Modal Overlay */}
        {currentScreen === 'settings' && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm animate-fade-in overflow-auto">
            <div className="min-h-full">
              <SettingsScreen />
            </div>
          </div>
        )}
      </div>
    </ToastProvider>
  );
}

export default App;
