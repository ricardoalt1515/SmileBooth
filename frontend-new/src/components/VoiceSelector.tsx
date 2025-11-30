import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Play, Loader2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function VoiceSelector() {
    const { selectedVoiceURI, setSettings, voiceRate, voicePitch, voiceVolume } = useAppStore();
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        const loadVoices = () => {
            const available = window.speechSynthesis.getVoices();
            if (available.length > 0) {
                // Filtrar SOLO voces en Español de México (y fallback a español general si no hay)
                const mexicanVoices = available.filter(v => v.lang === 'es-MX');
                const otherSpanish = available.filter(v => v.lang.startsWith('es') && v.lang !== 'es-MX');

                // Prioridad: MX > Otros Español
                const finalVoices = [...mexicanVoices, ...otherSpanish];

                setVoices(finalVoices);
                setIsLoading(false);
            }
        };

        loadVoices();

        // Chrome a veces carga las voces asíncronamente
        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    const handleVoiceChange = (uri: string) => {
        setSettings({ selectedVoiceURI: uri });
    };

    const handleTestVoice = () => {
        if (!selectedVoiceURI) return;

        const voice = voices.find(v => v.voiceURI === selectedVoiceURI);
        if (!voice) return;

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance("Hola, soy tu asistente de fotos. ¿Qué tal sueno?");
        utterance.voice = voice;
        utterance.rate = voiceRate;
        utterance.pitch = voicePitch;
        utterance.volume = voiceVolume;

        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);

        window.speechSynthesis.speak(utterance);
    };

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando voces...
            </div>
        );
    }

    return (
        <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-2">
                <Select value={selectedVoiceURI || ''} onValueChange={handleVoiceChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecciona una voz" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        {voices.map((voice) => (
                            <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                                <span className="flex items-center gap-2">
                                    {voice.name}
                                    <span className="text-xs text-muted-foreground">({voice.lang})</span>
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Button
                variant="outline"
                size="icon"
                onClick={handleTestVoice}
                disabled={!selectedVoiceURI || isPlaying}
                title="Probar voz"
            >
                {isPlaying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            </Button>
        </div>
    );
}
