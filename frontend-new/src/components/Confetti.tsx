import { useEffect, useState, useMemo } from 'react';

interface ConfettiProps {
  active?: boolean;
  count?: number;
  duration?: number;
  colors?: string[];
}

interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  rotation: number;
  wobble: number;
  yOffset?: number;
}

export default function Confetti({
  active = true,
  count = 50,
  duration = 3000,
  colors = ['#ff0080', '#00ffff', '#9f00ff', '#00ff00', '#ffff00', '#ff6b00'],
}: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  // Stabilize colors array to prevent infinite re-renders
  const colorKey = useMemo(() => JSON.stringify(colors), [JSON.stringify(colors)]);

  useEffect(() => {
    if (!active) {
      setPieces([]);
      return;
    }

    // Generate confetti pieces with random properties
    const newPieces: ConfettiPiece[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100, // 0-100%
      delay: Math.random() * 200, // 0-200ms delay
      duration: duration + Math.random() * 1000, // duration ± 500ms
      size: 8 + Math.random() * 8, // 8-16px
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360, // Initial rotation
      wobble: Math.random() * 100 - 50, // -50 to 50px horizontal movement
    }));

    setPieces(newPieces);

    // Clear confetti after animation completes
    const timeout = setTimeout(() => {
      setPieces([]);
    }, duration + 1000);

    return () => clearTimeout(timeout);
  }, [active, count, duration, colorKey]);

  if (!active || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute -top-4"
          style={{
            left: `${piece.left}%`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            animation: `confetti-fall ${piece.duration}ms linear forwards`,
            animationDelay: `${piece.delay}ms`,
            transform: `rotate(${piece.rotation}deg)`,
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
            opacity: 0.9,
            boxShadow: `0 0 ${piece.size / 2}px ${piece.color}`,
            // Custom properties for animation
            ['--wobble' as string]: `${piece.wobble}px`,
            ['--rotation' as string]: `${Math.random() * 720 - 360}deg`,
          }}
        />
      ))}

      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 1;
          }
          10% {
            opacity: 0.9;
          }
          90% {
            opacity: 0.5;
          }
          100% {
            transform: translateY(100vh) translateX(var(--wobble)) rotate(var(--rotation));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

// Confetti burst variant - shoots from bottom center
export function ConfettiBurst({
  active = true,
  count = 30,
  duration = 2000,
  colors = ['#ff0080', '#00ffff', '#9f00ff', '#00ff00', '#ffff00'],
}: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  // Stabilize colors array to prevent infinite re-renders
  const colorKey = useMemo(() => JSON.stringify(colors), [JSON.stringify(colors)]);

  useEffect(() => {
    if (!active) {
      setPieces([]);
      return;
    }

    // Generate confetti pieces that burst outward
    const newPieces: ConfettiPiece[] = Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2; // Distribute evenly in circle
      const velocity = 200 + Math.random() * 300; // 200-500px
      const spread = Math.random() * 0.3 - 0.15; // Add randomness to angle

      return {
        id: i,
        left: 50, // Start from center
        delay: Math.random() * 100,
        duration: duration + Math.random() * 500,
        size: 8 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        wobble: Math.cos(angle + spread) * velocity, // X movement
        yOffset: Math.sin(angle + spread) * velocity * -1, // Y movement (negative = up)
      };
    });

    setPieces(newPieces);

    const timeout = setTimeout(() => {
      setPieces([]);
    }, duration + 1000);

    return () => clearTimeout(timeout);
  }, [active, count, duration, colorKey]);

  if (!active || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute bottom-1/4 left-1/2"
          style={{
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            animation: `confetti-burst ${piece.duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
            animationDelay: `${piece.delay}ms`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            opacity: 0,
            boxShadow: `0 0 ${piece.size / 2}px ${piece.color}`,
            ['--x-pos' as string]: `${piece.wobble}px`,
            ['--y-pos' as string]: `${piece.yOffset ?? 0}px`,
            ['--rotation' as string]: `${Math.random() * 720}deg`,
          }}
        />
      ))}

      <style>{`
        @keyframes confetti-burst {
          0% {
            transform: translate(-50%, 0) rotate(0deg);
            opacity: 1;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translate(calc(-50% + var(--x-pos)), var(--y-pos)) rotate(var(--rotation));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
