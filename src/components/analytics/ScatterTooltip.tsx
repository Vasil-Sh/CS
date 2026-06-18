interface ScatterData {
  odds: string | number;
  profit: string | number;
  match?: string;
  betType?: string;
}

interface TooltipPayload {
  payload: ScatterData;
}

interface ScatterTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

/** Custom tooltip for the odds-vs-profit scatter chart */
export default function ScatterTooltip({ active, payload }: ScatterTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-200">
        <p className="text-sm font-bold text-gray-900 mb-2">Коеф.: {Number(data.odds).toFixed(2)}</p>
        {data.match && (
          <p className="text-sm text-gray-700 mb-1">Ставка: {data.match}</p>
        )}
        <p className={`text-sm font-bold mb-1 ${data.profit >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
          Профіт: {data.profit >= 0 ? '+' : ''}{Number(data.profit).toFixed(2)} ₴
        </p>
        {data.betType && (
          <p className="text-sm text-gray-600">Тип: {data.betType}</p>
        )}
      </div>
    );
  }
  return null;
}
