import { useAppStore } from '../store/useAppStore';

export default function CaptureScreen() {
  const { setCurrentScreen } = useAppStore();

  const handleComplete = () => {
    // Aquí irá la lógica de captura de fotos
    setCurrentScreen('success');
  };

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-gray-900 text-white">
      <div className="text-center space-y-8">
        <h1 className="text-6xl font-bold">📷 Capturando...</h1>
        <p className="text-2xl">Aquí irá la cámara y la captura de fotos</p>

        <button
          onClick={handleComplete}
          className="mt-12 px-12 py-4 bg-green-600 rounded-lg text-xl font-bold hover:bg-green-700 transition-colors"
        >
          Simular captura completa
        </button>
      </div>
    </div>
  );
}
