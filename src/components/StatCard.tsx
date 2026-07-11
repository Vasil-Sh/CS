import { type ReactNode, useState, memo } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  subtext?: string;
  valueColor?: string;
  subIcon?: ReactNode;
  onClick?: () => void;
  /** Показувати зелений/червоний hint залежно від value */
  trend?: "up" | "down" | "neutral";
  /** Додаткове значення (напр. USD профіт другим рядком) */
  extraValue?: string;
  extraSubtext?: string;
  extraValueColor?: string;
  extraSubIcon?: ReactNode;
}

const StatCardMemo = memo(function StatCard({
  icon,
  label,
  value,
  subtext,
  valueColor = "text-[#111827]",
  subIcon,
  onClick,
  trend,
  extraValue,
  extraSubtext,
  extraValueColor = "text-[#D97706]",
  extraSubIcon,
}: StatCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 transition-all duration-300 ease-out cursor-default overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-[#D1D5DB] ${onClick ? "cursor-pointer" : ""}`}
      style={{ transform: isHovered ? "translateY(-3px)" : "translateY(0)" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-lg font-semibold text-[#111827]">{label}</span>
      </div>
      {extraValue ? (
        <>
          <div className="flex items-baseline justify-between gap-3 mb-1">
            <div className={`text-4xl font-bold tracking-tight ${valueColor}`}>
              {value}
            </div>
            <div
              className={`text-4xl font-bold tracking-tight ${extraValueColor}`}
            >
              {extraValue}
            </div>
          </div>
          {subtext && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {subIcon}
                <span className="text-sm text-[#9CA3AF]">{subtext}</span>
              </div>
              {extraSubtext && (
                <div className="flex items-center gap-2">
                  {extraSubIcon}
                  <span className="text-sm text-[#9CA3AF]">{extraSubtext}</span>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <div
            className={`text-4xl font-bold tracking-tight mb-1 ${valueColor}`}
          >
            {value}
          </div>
          {subtext && (
            <div className="flex items-center gap-2">
              {subIcon}
              <span className="text-sm text-[#9CA3AF]">{subtext}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
});

export default StatCardMemo;
