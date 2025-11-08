import { useAppStore } from './store/useAppStore';
import StartScreen from './screens/StartScreen';
import CountdownScreen from './screens/CountdownScreen';
import CaptureScreen from './screens/CaptureScreen';
import SuccessScreen from './screens/SuccessScreen';

function App() {
  const { currentScreen } = useAppStore();

  // Screen router
  const renderScreen = () => {
    switch (currentScreen) {
      case 'start':
        return <StartScreen />;
      case 'countdown':
        return <CountdownScreen />;
      case 'capture':
        return <CaptureScreen />;
      case 'success':
        return <SuccessScreen />;
      default:
        return <StartScreen />;
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden">
      {renderScreen()}
    </div>
  );
}

export default App;
