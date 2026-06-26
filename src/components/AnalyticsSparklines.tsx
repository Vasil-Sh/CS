/** Inline SVG sparkline — bypasses SWC caching issues */
export default function BankSparkline({ data }: { data: { balance: number }[] }) {
  if (!data || data.length < 2) return null;
  const vals = data.map(d => d.balance);
  const mn = Math.min(...vals);
  const rng = Math.max(...vals) - mn || 1;
  const ys = vals.map(v => 24 - ((v - mn) / rng) * 20);
  const d = ys.map((y, i) => `${i === 0 ? 'M' : 'L'} ${(i / (vals.length - 1)) * 100} ${y}`).join(' ');
  const area = d + ' L 100 28 L 0 28 Z';
  const up = vals[vals.length - 1] >= vals[0];
  return (
    <div className="mt-2" style={{ height: 28 }}>
      <svg width="100%" height="28" viewBox="0 0 100 28" preserveAspectRatio="none">
        <path d={area} fill={up ? 'rgba(68,122,252,0.06)' : 'rgba(239,68,68,0.06)'} />
        <path d={d} fill="none" stroke={up ? '#447afc' : '#EF4444'} strokeWidth="1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

export function ProfitSparkline({ bets }: { bets: { date: string; profit: number }[] }) {
  if (!bets || bets.length === 0) return null;
  const days: number[] = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const key = d.toISOString().split('T')[0]; days.push((bets.filter(b => { try { return new Date(b.date).toISOString().split('T')[0] === key; } catch { return false; } }).reduce((s, b) => s + (b.profit || 0), 0))); }
  const mx = Math.max(...days.map(Math.abs));
  const rng = mx || 1;
  const ys = days.map(v => 14 - (v / rng) * 12);
  const pathD = ys.map((y, i) => `${i === 0 ? 'M' : 'L'} ${(i / 6) * 100} ${y}`).join(' ');
  const areaD = pathD + ' L 100 28 L 0 28 Z';
  const up = days[6] >= 0;
  return (
    <div className="mt-2" style={{ height: 28 }}>
      <svg width="100%" height="28" viewBox="0 0 100 28" preserveAspectRatio="none">
        <path d={areaD} fill={up ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)'} />
        <path d={pathD} fill="none" stroke={up ? '#22C55E' : '#EF4444'} strokeWidth="1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
