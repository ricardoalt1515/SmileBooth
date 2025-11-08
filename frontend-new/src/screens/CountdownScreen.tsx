import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';

export default function CountdownScreen() {
  const { countdownSeconds, setCurrentScreen } = useAppStore();
  const [count, setCount] = useState(countdownSeconds);

  useEffect(() => {
    if (count === 0) {
      setCurrentScreen('capture');
      return;
    }

    const timer = setTimeout(() => {
      setCount(count - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, setCurrentScreen]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-black text-white">
      <div className="text-center">
        <div className="text-[20rem] font-bold animate-bounce">
          {count}
        </div>
        <p className="text-4xl mt-8">¡Prepárate!</p>
      </div>
    </div>
  );
}
