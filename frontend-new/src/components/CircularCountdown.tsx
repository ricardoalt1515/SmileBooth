

interface CircularCountdownProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export default function CircularCountdown({
  value,
  max,
  size = 256,
  strokeWidth = 6,
  className = '',
}: CircularCountdownProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = value / max;
  const strokeDashoffset = circumference * (1 - progress);

  // Dynamic color logic
  let color = '#10b981'; // Green-500 (Default/Calm)
  if (value <= 3) color = '#f59e0b'; // Amber-500 (Warning)
  if (value <= 1) color = '#ef4444'; // Red-500 (Urgent)

  const isUrgent = value <= 1;

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Background circle (track) */}
      <svg
        className="absolute inset-0 transform -rotate-90"
        width={size}
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress circle */}
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
            transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease',
            filter: `drop-shadow(0 0 8px ${color})`,
          }}
        />
      </svg>

      {/* Center number */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`
            font-bold text-white
            transition-all duration-300
            ${isUrgent ? 'animate-heartbeat' : ''}
          `}
          style={{
            fontSize: size * 0.4,
            textShadow: `0 4px 12px rgba(0,0,0,0.5)`,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </span>
      </div>

      {/* CSS for heartbeat animation */}
      <style>{`
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        .animate-heartbeat {
          animation: heartbeat 0.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
