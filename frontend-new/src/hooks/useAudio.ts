import { useCallback, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';

// Audio URLs - usando sonidos de dominio público o generados
const AUDIO_FILES = {
  // Efectos de sonido
  click: 'data:audio/wav;base64,UklGRhIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YW4A',
  camera: 'data:audio/wav;base64,UklGRhIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YW4A',
  success: 'data:audio/wav;base64,UklGRhIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YW4A',
  countdown: 'data:audio/wav;base64,UklGRhIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YW4A',
};

type SoundEffect = keyof typeof AUDIO_FILES;

interface UseAudioReturn {
  playSound: (sound: SoundEffect) => void;
  speak: (text: string, options?: SpeechOptions) => void;
  stopSpeaking: () => void;
}

interface SpeechOptions {
  rate?: number; // Velocidad: 0.1 a 10 (1 es normal)
  pitch?: number; // Tono: 0 a 2 (1 es normal)
  volume?: number; // Volumen: 0 a 1
}

export const useAudio = (): UseAudioReturn => {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Reproducir efecto de sonido
  const playSound = useCallback((sound: SoundEffect) => {
    try {
      const audio = new Audio(AUDIO_FILES[sound]);
      audio.volume = 0.5;
      audio.play().catch(err => console.warn('Audio play failed:', err));
    } catch (error) {
      console.warn('Error playing sound:', error);
    }
  }, []);

  // Reproducir voz en español usando Web Speech API
  const speak = useCallback((text: string, options: SpeechOptions = {}) => {
    // Cancelar voz anterior si existe
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Obtener voz seleccionada del store
    const { selectedVoiceURI } = useAppStore.getState();
    const voices = window.speechSynthesis.getVoices();

    let targetVoice: SpeechSynthesisVoice | undefined;

    if (selectedVoiceURI) {
      targetVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
    }

    // Fallback: buscar voz en español
    if (!targetVoice) {
      targetVoice = voices.find(
        voice => voice.lang.startsWith('es-') || voice.lang === 'es'
      );
    }

    if (targetVoice) {
      utterance.voice = targetVoice;
    }

    utterance.lang = 'es-ES';
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;

    utteranceRef.current = utterance;

    // Esperar a que las voces estén cargadas
    if (voices.length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        const newVoices = window.speechSynthesis.getVoices();
        let newTargetVoice: SpeechSynthesisVoice | undefined;

        if (selectedVoiceURI) {
          newTargetVoice = newVoices.find(v => v.voiceURI === selectedVoiceURI);
        }

        if (!newTargetVoice) {
          newTargetVoice = newVoices.find(
            voice => voice.lang.startsWith('es-') || voice.lang === 'es'
          );
        }

        if (newTargetVoice) {
          utterance.voice = newTargetVoice;
        }
        window.speechSynthesis.speak(utterance);
      }, { once: true });
    } else {
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Detener voz
  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
  }, []);

  return {
    playSound,
    speak,
    stopSpeaking,
  };
};

// Hook para efectos de sonido simples con Web Audio API
export const useSoundEffects = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Sonido de clic/beep
  const playBeep = useCallback((frequency = 800, duration = 100) => {
    const ctx = getContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration / 1000);
  }, [getContext]);

  // Sonido de cámara/shutter
  const playShutter = useCallback(() => {
    const ctx = getContext();
    const bufferSize = ctx.sampleRate * 0.1; // 100ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generar ruido blanco para efecto de shutter
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize / 10));
    }

    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();

    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    gainNode.gain.value = 0.3;

    source.start();
  }, [getContext]);

  // Sonido de éxito/celebración
  const playSuccess = useCallback(() => {
    const ctx = getContext();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 (acorde de Do mayor)

    notes.forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      const startTime = ctx.currentTime + (index * 0.1);
      gainNode.gain.setValueAtTime(0.2, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.5);
    });
  }, [getContext]);

  // Countdown beeps (3, 2, 1)
  const playCountdown = useCallback((count: number) => {
    if (count === 0) {
      playBeep(1200, 200); // Beep más agudo y largo para el "GO"
    } else {
      playBeep(600, 150); // Beep normal para countdown
    }
  }, [playBeep]);

  return {
    playBeep,
    playShutter,
    playSuccess,
    playCountdown,
  };
};
