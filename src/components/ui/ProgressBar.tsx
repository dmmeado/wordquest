'use client';

interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  height?: string;
  label?: string;
  showPercent?: boolean;
}

export default function ProgressBar({
  value,
  color = 'bg-primary',
  height = 'h-3',
  label,
  showPercent = false,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between mb-1 text-sm text-text-light">
          {label && <span>{label}</span>}
          {showPercent && <span>{Math.round(clamped)}%</span>}
        </div>
      )}
      <div className={`w-full ${height} bg-border rounded-full overflow-hidden`}>
        <div
          className={`${height} ${color} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
