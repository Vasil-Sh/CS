import { type ReactNode } from 'react';

const cardBaseStyle: React.CSSProperties = {
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  transform: 'translateY(0)',
};

const cardHoverStyle: React.CSSProperties = {
  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
  transform: 'translateY(-2px)',
};

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  subtext?: string;
  valueColor?: string;
  subIcon?: ReactNode;
  onClick?: () => void;
}

export default function StatCard({
  icon,
  label,
  value,
  subtext,
  valueColor = 'text-[#111827]',
  subIcon,
  onClick,
}: StatCardProps) {
  return (
    <div
      className={`bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 group${onClick ? ' cursor-pointer' : ''}`}
      style={cardBaseStyle}
      onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
      onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
      onClick={onClick}
    >
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
