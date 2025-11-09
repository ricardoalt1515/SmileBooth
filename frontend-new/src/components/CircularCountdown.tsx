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

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg
        className="absolute inset-0 transform -rotate-90"
        width={size}
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
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
            transition: 'stroke-dashoffset 1s linear',
            filter: `drop-shadow(0 0 10px ${color})`,
          }}
        />
      </svg>

      {/* Center number */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-9xl font-bold text-white"
          style={{
            textShadow: `0 0 30px ${color}, 0 0 60px ${color}`,
            animation: value <= 3 ? 'pulse 0.5s ease-in-out' : 'none',
          }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
