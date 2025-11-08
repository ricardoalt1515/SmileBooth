import { useAppStore } from '../store/useAppStore';

export default function SuccessScreen() {
  const { reset } = useAppStore();

  const handleRestart = () => {
    reset();
  };

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-gradient-to-br from-green-900 via-emerald-900 to-black text-white">
      <div className="text-center space-y-8">
        <div className="text-9xl animate-bounce">🎉</div>
        <h1 className="text-6xl font-bold">¡Éxito!</h1>
        <p className="text-2xl text-gray-300">Tus fotos están listas</p>

        <button
          onClick={handleRestart}
          className="mt-12 px-12 py-4 bg-blue-600 rounded-lg text-xl font-bold hover:bg-blue-700 transition-colors"
        >
          VOLVER AL INICIO
        </button>
      </div>
    </div>
  );
}
