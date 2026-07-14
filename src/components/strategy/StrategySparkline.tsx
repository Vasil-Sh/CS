/** Pure component: SVG sparkline chart for profit history */
export default function StrategySparkline({ profitHistory }: { profitHistory?: number[] }) {
  if (!profitHistory || profitHistory.length < 2) {
    return <div className="h-10 flex items-center justify-center text-xs text-gray-400">Немає даних</div>;
  }

  const max = Math.max(...profitHistory);
  const min = Math.min(...profitHistory);
  const range = max - min || 1;
  const padding = 4;
  const width = 200;
  const height = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = profitHistory.map((value, index) => {
    const x = padding + (index / (profitHistory.length - 1)) * chartWidth;
    const y = padding + (1 - (value - min) / range) * chartHeight;
    return { x, y };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaD = pathD + ` L ${points[points.length - 1].x.toFixed(1)} ${height} L ${points[0].x.toFixed(1)} ${height} Z`;
  const lastValue = profitHistory[profitHistory.length - 1];
  const firstValue = profitHistory[0];
  const trend = lastValue >= firstValue ? 'up' : 'down';
  const strokeColor = trend === 'up' ? '#22C55E' : '#EF4444';
  const fillColor = trend === 'up' ? '#22C55E' : '#EF4444';
  const gradientId = `sparkline-grad-${Math.random().toString(36).substr(2, 9)}`;
  const lastPoint = points[points.length - 1];

  return (
    <div className="relative h-10">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={fillColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#${gradientId})`} />
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <circle cx={lastPoint.x} cy={lastPoint.y} r="3" fill={strokeColor} vectorEffect="non-scaling-stroke" />
        <circle cx={lastPoint.x} cy={lastPoint.y} r="5" fill={strokeColor} opacity="0.3" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
