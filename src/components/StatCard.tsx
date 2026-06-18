import { type ReactNode, useState } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  subtext?: string;
  valueColor?: string;
  subIcon?: ReactNode;
  onClick?: () => void;
  /** Показувати зелений/червоний hint залежно від value */
  trend?: 'up' | 'down' | 'neutral';
}

export default function StatCard({
  icon,
  label,
  value,
  subtext,
  valueColor = 'text-[#111827]',
  subIcon,
  onClick,
  trend,
}: StatCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const trendGlow = trend === 'up'
    ? 'hover:shadow-[0_0_24px_rgba(34,197,94,0.15)] hover:border-[#BBF7D0]'
    : trend === 'down'
    ? 'hover:shadow-[0_0_24px_rgba(239,68,68,0.12)] hover:border-[#FECACA]'
    : 'hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-[#D1D5DB]';

  return (
    <div
      className={`relative bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 transition-all duration-300 ease-out cursor-default overflow-hidden ${trendGlow} ${onClick ? 'cursor-pointer' : ''}`}
      style={{ transform: isHovered ? 'translateY(-3px)' : 'translateY(0)' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Animated gradient bar on hover */}
      <div
        className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-3xl transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        } ${
          trend === 'up' ? 'bg-gradient-to-r from-[#22C55E] via-[#4ADE80] to-[#22C55E]' :
          trend === 'down' ? 'bg-gradient-to-r from-[#EF4444] via-[#F87171] to-[#EF4444]' :
          'bg-gradient-to-r from-[#3B82F6] via-[#60A5FA] to-[#3B82F6]'
        }`}
      />

      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-lg font-semibold text-[#111827]">{label}</span>
      </div>
      <div className={`text-4xl font-bold tracking-tight mb-2 ${valueColor}`}>
        {value}
      </div>
      {subtext && (
        <div className="flex items-center gap-2">
          {subIcon}
          <span className="text-sm text-[#9CA3AF]">{subtext}</span>
        </div>
      )}
    </div>
  );
}
