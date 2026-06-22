interface MonthlyData {
  month: string;
  profit: number;
  cumulative: number;
}

interface MonthlyBarProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: MonthlyData;
}

/** Custom bar shape — green for positive profit, red for negative */
export default function MonthlyProfitBar(props: MonthlyBarProps) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;
  const isPositive = (payload?.profit || 0) >= 0;
  const fillColor = isPositive ? '#16A34A' : '#DC2626';
  const strokeColor = isPositive ? '#15803D' : '#B91C1C';

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fillColor}
      stroke={strokeColor}
      strokeWidth={1}
      rx={4}
      ry={4}
    />
  );
}
