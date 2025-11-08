import { useAppStore } from '../store/useAppStore';

export default function StartScreen() {
  const { setCurrentScreen } = useAppStore();

  const handleStart = () => {
    setCurrentScreen('countdown');
  };

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
      <div className="text-center space-y-8">
        <h1 className="text-7xl font-bold animate-pulse">📸 Photobooth</h1>
        <p className="text-2xl text-gray-300">¡Captura tus mejores momentos!</p>

        <button
          onClick={handleStart}
          className="mt-12 px-16 py-6 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full text-3xl font-bold hover:scale-110 transition-transform duration-300 shadow-2xl"
        >
          INICIAR SESIÓN
        </button>

        <div className="mt-8 text-sm text-gray-400">
          <p>Presiona el botón para comenzar</p>
        </div>
      </div>
    </div>
  );
}
