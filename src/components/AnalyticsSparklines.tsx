/** Bank balance trend — always renders */
export default function BankSparkline({ data }: { data: { balance: number }[] }) {
  const vals = (data && data.length >= 2)
    ? data.map(d => d.balance)
    : [0, 1];
  const mn = Math.min(...vals);
  const rng = Math.max(...vals) - mn || 1;
  const points = vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i / (vals.length - 1)) * 100} ${24 - ((v - mn) / rng) * 20}`).join(' ');
  const up = vals[vals.length - 1] >= vals[0];
  const stroke = up ? '#447afc' : '#EF4444';
  const fill = up ? 'rgba(68,122,252,0.10)' : 'rgba(239,68,68,0.10)';
  return (
    <div className="mt-3" style={{ height: 32, overflow: 'visible' }}>
      <svg width="100%" height="32" viewBox="0 0 100 32" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
        <path d={`${points} L 100 32 L 0 32 Z`} fill={fill} />
        <path d={points} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

/** 7-day profit sparkline — always renders */
export function ProfitSparkline({ bets }: { bets: { date: string; profit: number }[] }) {
  const days: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const profit = (bets || []).filter(b => { try { return new Date(b.date).toISOString().split('T')[0] === key; } catch { return false; } }).reduce((s, b) => s + (b.profit || 0), 0);
    days.push(profit);
  }
  const mx = Math.max(...days.map(Math.abs));
  const rng = mx || 1;
  const points = days.map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i / 6) * 100} ${16 - (v / rng) * 12}`).join(' ');
  const up = days[6] >= 0;
  const stroke = up ? '#22C55E' : '#EF4444';
  const fill = up ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)';
  return (
    <div className="mt-3" style={{ height: 32, overflow: 'visible' }}>
      <svg width="100%" height="32" viewBox="0 0 100 32" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
        <path d={`${points} L 100 32 L 0 32 Z`} fill={fill} />
        <path d={points} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
