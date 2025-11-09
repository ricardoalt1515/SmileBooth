/**
 * StripPreview - Vista previa de cómo se verá la tira de fotos
 * Muestra el layout con fotos de muestra y el diseño activo
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageIcon } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

interface StripPreviewProps {
  layout: 'vertical-3' | 'vertical-4' | 'vertical-6' | 'grid-2x2';
  printMode: 'single' | 'dual-strip';
  designPreviewUrl?: string;
  photosCount: number;
}

export default function StripPreview({ 
  layout, 
  printMode, 
  designPreviewUrl,
  photosCount 
}: StripPreviewProps) {
  const [samplePhotos, setSamplePhotos] = useState<string[]>([]);

  useEffect(() => {
    // Generar fotos de muestra
    const samples = Array.from({ length: photosCount }, (_, i) => 
      `https://via.placeholder.com/300x400/1a1a1a/ff0080?text=Foto+${i + 1}`
    );
    setSamplePhotos(samples);
  }, [photosCount]);

  const getLayoutStyles = () => {
    switch (layout) {
      case 'vertical-3':
      case 'vertical-4':
      case 'vertical-6':
        return 'flex flex-col gap-2';
      case 'grid-2x2':
        return 'grid grid-cols-2 gap-2';
      default:
        return 'flex flex-col gap-2';
    }
  };

  const renderStrip = (offset: number = 0) => (
    <div className="bg-white rounded-lg p-2 shadow-lg" style={{ aspectRatio: '1/3' }}>
      {/* Fotos */}
      <div className={`${getLayoutStyles()} h-2/3`}>
        {samplePhotos.slice(offset, offset + photosCount / (printMode === 'dual-strip' ? 2 : 1)).map((photo, index) => (
          <div 
            key={index}
            className="relative bg-gray-200 rounded overflow-hidden flex-1 flex items-center justify-center"
          >
            <ImageIcon className="w-8 h-8 text-gray-400" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-gray-400">{offset + index + 1}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Diseño/Logo */}
      <div className="h-1/3 mt-2 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
        {designPreviewUrl ? (
          <img 
            src={`${API_BASE_URL}${designPreviewUrl}`}
            alt="Diseño" 
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-center text-gray-400">
            <ImageIcon className="w-12 h-12 mx-auto mb-2" />
            <p className="text-xs">Sin diseño</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Vista Previa de Tira</CardTitle>
        <p className="text-sm text-muted-foreground">
          {printMode === 'dual-strip' ? '2 tiras lado a lado (se cortan después)' : '1 tira completa'}
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 justify-center">
          {printMode === 'dual-strip' ? (
            <>
              {/* Tira Izquierda */}
              <div className="w-32">
                <p className="text-xs text-center mb-2 text-muted-foreground">Lado Izquierdo</p>
                {renderStrip(0)}
              </div>
              {/* Línea de corte */}
              <div className="flex flex-col items-center justify-center">
                <div className="h-full w-px border-l-2 border-dashed border-muted-foreground"></div>
                <p className="text-xs text-muted-foreground rotate-90 whitespace-nowrap">✂️ Cortar aquí</p>
              </div>
              {/* Tira Derecha */}
              <div className="w-32">
                <p className="text-xs text-center mb-2 text-muted-foreground">Lado Derecho</p>
                {renderStrip(photosCount / 2)}
              </div>
            </>
          ) : (
            <div className="w-32">
              {renderStrip(0)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
          <ul className="space-y-1 text-muted-foreground">
            <li>• Layout: <span className="font-medium text-foreground">{layout}</span></li>
            <li>• Fotos: <span className="font-medium text-foreground">{photosCount}</span></li>
            <li>• Modo: <span className="font-medium text-foreground">
              {printMode === 'dual-strip' ? 'Doble (2 tiras)' : 'Simple (1 tira)'}
            </span></li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
