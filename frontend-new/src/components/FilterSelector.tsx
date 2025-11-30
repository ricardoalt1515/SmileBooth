import { useAppStore } from '../store/useAppStore';
import { Button } from '@/components/ui/button';
import { Sparkles, Palette, Contrast, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

const FILTERS = [
    { id: 'none', label: 'Normal', icon: Palette, css: '' },
    { id: 'bw', label: 'B&W', icon: Contrast, css: 'grayscale(100%)' },
    { id: 'sepia', label: 'Sepia', icon: Sun, css: 'sepia(100%)' },
    { id: 'glam', label: 'Glam', icon: Sparkles, css: 'brightness(1.1) contrast(1.1) saturate(1.2)' },
];

interface FilterSelectorProps {
    value?: string;
    onChange?: (value: string) => void;
}

export default function FilterSelector({ value, onChange }: FilterSelectorProps) {
    const { photoFilter, setSettings } = useAppStore();
    const currentFilter = value ?? photoFilter;

    return (
        <div className="flex items-center justify-center gap-4 p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-500">
            {FILTERS.map((filter) => {
                const Icon = filter.icon;
                const isActive = currentFilter === filter.id;

                return (
                    <div key={filter.id} className="flex flex-col items-center gap-2">
                        <Button
                            variant={isActive ? "default" : "outline"}
                            size="lg"
                            onClick={() => onChange ? onChange(filter.id) : setSettings({ photoFilter: filter.id })}
                            className={cn(
                                "w-16 h-16 rounded-full transition-all duration-300 transform hover:scale-110 border-2",
                                isActive
                                    ? "bg-primary border-primary text-primary-foreground shadow-[0_0_20px_rgba(255,215,0,0.5)]"
                                    : "bg-black/50 border-white/20 text-white hover:bg-white/10 hover:border-white/50"
                            )}
                        >
                            <Icon className="w-8 h-8" />
                        </Button>
                        <span className={cn(
                            "text-xs font-medium tracking-wider uppercase",
                            isActive ? "text-primary" : "text-gray-400"
                        )}>
                            {filter.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
