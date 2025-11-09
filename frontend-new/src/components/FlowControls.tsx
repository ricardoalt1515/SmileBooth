import { RotateCcw, ArrowRight, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';

interface FlowControlsProps {
  mode: 'reviewing' | 'preview-final' | 'success';
  onRepeat?: () => void;
  onContinue?: () => void;
  onPrint?: () => void;
  onReprint?: () => void;
  disabled?: boolean;
}

export default function FlowControls({
  mode,
  onRepeat,
  onContinue,
  onPrint,
  onReprint,
  disabled = false,
}: FlowControlsProps) {
  const [showRepeatDialog, setShowRepeatDialog] = useState(false);
  const [showReprintDialog, setShowReprintDialog] = useState(false);

  const handleRepeatClick = () => {
    setShowRepeatDialog(true);
  };

  const handleConfirmRepeat = () => {
    setShowRepeatDialog(false);
    onRepeat?.();
  };

  const handleReprintClick = () => {
    setShowReprintDialog(true);
  };

  const handleConfirmReprint = () => {
    setShowReprintDialog(false);
    onReprint?.();
  };

  return (
    <>
      {/* Controles flotantes */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
        <div className="flex gap-4 pointer-events-auto" data-mode="kiosk">
          {/* Botón Repetir (solo en reviewing y preview-final) */}
          {(mode === 'reviewing' || mode === 'preview-final') && onRepeat && (
            <Button
              onClick={handleRepeatClick}
              disabled={disabled}
              variant="outline"
              size="lg"
              className="h-16 px-8 text-lg bg-black/80 backdrop-blur-sm border-2 border-white/30 hover:border-red-500 hover:bg-red-500/20 text-white transition-all"
            >
              <RotateCcw className="w-6 h-6 mr-2" />
              Repetir Sesión
            </Button>
          )}

          {/* Botón Continuar (solo en reviewing) */}
          {mode === 'reviewing' && onContinue && (
            <Button
              onClick={onContinue}
              disabled={disabled}
              size="lg"
              className="h-16 px-8 text-lg bg-[#ff0080] hover:bg-[#ff0080]/90 text-white transition-all shadow-lg shadow-[#ff0080]/50"
            >
              Continuar
              <ArrowRight className="w-6 h-6 ml-2" />
            </Button>
          )}

          {/* Botón Imprimir (solo en preview-final) */}
          {mode === 'preview-final' && onPrint && (
            <Button
              onClick={onPrint}
              disabled={disabled}
              size="lg"
              className="h-16 px-8 text-lg bg-[#ff0080] hover:bg-[#ff0080]/90 text-white transition-all shadow-lg shadow-[#ff0080]/50"
            >
              <Printer className="w-6 h-6 mr-2" />
              Imprimir
            </Button>
          )}

          {/* Botón Reimprimir (solo en success) */}
          {mode === 'success' && onReprint && (
            <Button
              onClick={handleReprintClick}
              disabled={disabled}
              variant="outline"
              size="lg"
              className="h-16 px-8 text-lg bg-black/80 backdrop-blur-sm border-2 border-white/30 hover:border-[#ff0080] hover:bg-[#ff0080]/20 text-white transition-all"
            >
              <Printer className="w-6 h-6 mr-2" />
              Reimprimir
            </Button>
          )}
        </div>
      </div>

      {/* Dialog: Confirmar Repetir */}
      <Dialog open={showRepeatDialog} onOpenChange={setShowRepeatDialog}>
        <DialogContent className="bg-black/95 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl">¿Repetir sesión?</DialogTitle>
            <DialogDescription className="text-gray-400 text-lg">
              Se descartarán todas las fotos actuales y comenzarás una nueva sesión desde cero.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRepeatDialog(false)}
              className="bg-transparent border-gray-600 text-white hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRepeat}
              className="bg-red-600 hover:bg-red-700"
            >
              Sí, Repetir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar Reimprimir */}
      <Dialog open={showReprintDialog} onOpenChange={setShowReprintDialog}>
        <DialogContent className="bg-black/95 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl">¿Reimprimir fotos?</DialogTitle>
            <DialogDescription className="text-gray-400 text-lg">
              Se enviará una copia adicional de tus fotos a la impresora.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowReprintDialog(false)}
              className="bg-transparent border-gray-600 text-white hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmReprint}
              className="bg-[#ff0080] hover:bg-[#ff0080]/90"
            >
              Sí, Reimprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
