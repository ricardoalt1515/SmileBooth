import { useEffect, useState } from 'react';

interface CircularCountdownProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
}

export default function CircularCountdown({
  value,
  max,
  size = 256,
  strokeWidth = 8,
  color = '#ff0080',
  className = '',
}: CircularCountdownProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = value / max;
  const strokeDashoffset = circumference * (1 - progress);
  const isUrgent = value <= 3;
  const isFinalSecond = value === 1;

  // State for particle effects
  const [particles, setParticles] = useState<Array<{ id: number; angle: number }>>([]);

  useEffect(() => {
    if (isUrgent) {
      // Generate particles for urgent state
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        angle: (i * 360) / 12,
      }));
      setParticles(newParticles);
    } else {
      setParticles([]);
    }
  }, [isUrgent]);

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer glow layer */}
      <div
        className="absolute inset-0 rounded-full opacity-50 blur-xl transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
          opacity: isUrgent ? 1 : 0.3,
        }}
      />

      {/* Particles for urgent countdown */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full animate-pulse"
          style={{
            background: color,
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) rotate(${particle.angle}deg) translateY(-${size / 2 + 20}px)`,
            boxShadow: `0 0 10px ${color}`,
            animation: 'particle-float 1s ease-out infinite',
            animationDelay: `${particle.id * 0.1}s`,
          }}
        />
      ))}

      {/* Background circles */}
      <svg
        className="absolute inset-0 transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Outer decorative circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius + strokeWidth / 2}
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={1}
          fill="none"
        />

        {/* Main background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Secondary progress ring (subtle) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius + strokeWidth}
          stroke={color}
          strokeWidth={2}
          fill="none"
          strokeDasharray={circumference * 1.1}
          strokeDashoffset={strokeDashoffset * 1.1}
          strokeLinecap="round"
          opacity={0.3}
          style={{
            transition: 'stroke-dashoffset 1s linear, opacity 0.3s',
          }}
        />

        {/* Main progress circle with enhanced glow */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1s linear',
            filter: isUrgent
              ? `drop-shadow(0 0 20px ${color}) drop-shadow(0 0 40px ${color})`
              : `drop-shadow(0 0 10px ${color})`,
          }}
        />

        {/* Animated gradient overlay (optional visual enhancement) */}
        <defs>
          <linearGradient id="countdown-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor="#9f00ff" stopOpacity="0.8" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center number with enhanced effects */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`
            text-9xl font-bold text-white
            transition-all duration-300
            ${isUrgent ? 'scale-110' : 'scale-100'}
            ${isFinalSecond ? 'animate-bounce-smooth' : isUrgent ? 'animate-glow-pulse' : ''}
          `}
          style={{
            textShadow: isUrgent
              ? `0 0 20px ${color},
                 0 0 40px ${color},
                 0 0 60px ${color},
                 0 0 80px ${color}`
              : `0 0 30px ${color}, 0 0 60px ${color}`,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </span>
      </div>

      {/* Pulsing ring for final second */}
      {isFinalSecond && (
        <div
          className="absolute inset-0 rounded-full animate-ripple"
          style={{
            border: `2px solid ${color}`,
            opacity: 0.6,
          }}
        />
      )}

      {/* Inner shadow for depth */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          boxShadow: `inset 0 0 40px rgba(0, 0, 0, 0.5)`,
        }}
      />
    </div>
  );
}
