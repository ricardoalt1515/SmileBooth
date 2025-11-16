interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave';
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'wave',
}: SkeletonProps) {
  const baseClasses = 'bg-white/10 relative overflow-hidden';

  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: '',
  };

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${animationClasses[animation]}
        ${className}
      `}
      style={style}
    >
      {animation === 'wave' && (
        <div
          className="absolute inset-0 -translate-x-full animate-shimmer"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
            backgroundSize: '200% 100%',
          }}
        />
      )}
    </div>
  );
}

// Gallery Grid Skeleton
export function GalleryGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-6 gap-4 p-6">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="rectangular" className="aspect-[3/4]" />
      ))}
    </div>
  );
}

// Card Skeleton
export function CardSkeleton() {
  return (
    <div className="glass rounded-xl p-6 border border-white/10">
      <Skeleton variant="text" width="60%" className="mb-3" />
      <Skeleton variant="text" width="100%" className="mb-2" />
      <Skeleton variant="text" width="80%" className="mb-4" />
      <div className="flex gap-3 mt-6">
        <Skeleton variant="rectangular" width={100} height={36} />
        <Skeleton variant="rectangular" width={100} height={36} />
      </div>
    </div>
  );
}

// Photo Strip Skeleton
export function PhotoStripSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-8">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton
          key={i}
          variant="rectangular"
          className="w-full aspect-[3/4] animate-pulse"
          animation="wave"
        />
      ))}
    </div>
  );
}

// Template Grid Skeleton
export function TemplateGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-6 p-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass rounded-xl p-4 border border-white/10">
          <Skeleton variant="rectangular" className="aspect-[3/4] mb-4" />
          <Skeleton variant="text" width="70%" className="mb-2" />
          <Skeleton variant="text" width="50%" height={20} />
        </div>
      ))}
    </div>
  );
}

// List Item Skeleton
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 glass rounded-lg border border-white/10">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1">
        <Skeleton variant="text" width="40%" className="mb-2" />
        <Skeleton variant="text" width="60%" height={12} />
      </div>
      <Skeleton variant="rectangular" width={80} height={32} />
    </div>
  );
}

// Stats Card Skeleton
export function StatsCardSkeleton() {
  return (
    <div className="glass rounded-xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="text" width="40%" height={16} />
        <Skeleton variant="circular" width={40} height={40} />
      </div>
      <Skeleton variant="text" width="30%" height={40} className="mb-2" />
      <Skeleton variant="text" width="60%" height={14} />
    </div>
  );
}

// Full Page Loading Skeleton
export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Skeleton variant="text" width="30%" height={40} className="mb-4" />
          <Skeleton variant="text" width="50%" height={20} />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Skeleton;
