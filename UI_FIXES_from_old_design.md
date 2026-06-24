# UI-правки для блоку StrategyOverviewHeader (4 KPI картки)

Застосувати тільки ці 5 правок — **без зміни логіки, імпортів чи структури**.

---

## 1. Заголовки: `text-lg` → `text-xl`

У 4-х картках (Активна стратегія, Головна ціль, Рівень ризику, Вінрейт 30 днів) замінити:
```
text-lg font-semibold
```
на:
```
text-xl font-semibold
```

Шукати в `src/components/StrategyOverviewHeader.tsx` та `src/components/StrategyKpiCard.tsx`.

---

## 2. «Рівень ризику» — повернути `—` замість центрованого тексту

**Було (HEAD):**
```tsx
<button
  type="button"
  onClick={() => onNavigateTab('risks')}
  className="text-left bg-white border border-[#E5E7EB] hover:border-[#9CA3AF] rounded-3xl px-6 py-5 cursor-pointer group relative flex flex-col justify-between"
  style={cardBaseStyle}
  onMouseEnter={(e) => applyHover(e.currentTarget)}
  onMouseLeave={(e) => resetHover(e.currentTarget)}
>
  <div className="flex items-center gap-2 mb-5">
    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#EFF6FF]">
      <ShieldAlert className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} />
    </div>
    <span className="text-lg font-semibold text-[#111827]">Рівень ризику</span>
  </div>
  {todayRisk.level ? (
    ...
  ) : (
    <div className="flex flex-col flex-1 items-center pt-10" style={{ paddingTop: '3rem' }}>
      <span className="text-sm text-[#9CA3AF]">Мін. 3 ставки за тиждень</span>
      <div className="flex items-center gap-1 mt-2 opacity-30">
        <div className="flex-1 h-2 rounded-full bg-[#DCFCE7]" />
        <div className="flex-1 h-2 rounded-full bg-[#FEF3C7]" />
        <div className="flex-1 h-2 rounded-full bg-[#FEE2E2]" />
      </div>
    </div>
  )}
</button>
```

**Замінити на (порожній стан):**
```tsx
            <div className="py-1">
              <div className="text-3xl font-bold text-[#9CA3AF] tracking-tight mb-2">—</div>
              <div className="flex items-center gap-1 mb-2 opacity-30">
                <div className="flex-1 h-2 rounded-full bg-[#DCFCE7]" />
                <div className="flex-1 h-2 rounded-full bg-[#FEF3C7]" />
                <div className="flex-1 h-2 rounded-full bg-[#FEE2E2]" />
              </div>
              <span className="text-sm text-[#9CA3AF]">Мін. 3 ставки за тиждень</span>
            </div>
```

---

## 3. «Вінрейт 30 днів» — повернути `—`

**Було (HEAD):**
```tsx
            <div className="flex flex-col flex-1 items-center pt-10" style={{ paddingTop: '3rem' }}>
              <span className="text-sm text-[#9CA3AF]">Немає завершених ставок</span>
            </div>
```

**Замінити на:**
```tsx
            <div className="py-1">
              <div className="text-3xl font-bold text-[#9CA3AF] tracking-tight mb-2">—</div>
              <span className="text-sm text-[#9CA3AF]">Немає завершених ставок</span>
            </div>
```

---

## 4. Кольори беджів ризику (Low/Medium)

У файлі `src/components/StrategyKpiCard.tsx` — функція `riskBadgeClass`:

```tsx
// БУЛО
case 'Low': return 'bg-[#DCFCE7] text-[#6B7280]';
case 'Medium': return 'bg-[#FEF3C7] text-[#6B7280]';

// СТАЛО
case 'Low': return 'bg-[#DCFCE7] text-[#16A34A]';
case 'Medium': return 'bg-[#FEF3C7] text-[#D97706]';
```

У файлі `src/components/StrategyOverviewHeader.tsx` — колір тексту рівня ризику:

```tsx
// БУЛО
todayRisk.level === 'High' ? 'text-[#DC2626]' : todayRisk.level === 'Medium' ? 'text-[#6B7280]' : 'text-[#6B7280]'

// СТАЛО
todayRisk.level === 'High' ? 'text-[#DC2626]' : todayRisk.level === 'Medium' ? 'text-[#D97706]' : 'text-[#16A34A]'
```

---

## 5. Назва цілі: `truncate` → `break-words`

У картці «Головна ціль» (`StrategyOverviewHeader.tsx`):

```tsx
// БУЛО
<div className="text-3xl font-bold text-[#111827] tracking-tight mb-2 truncate" title={primaryGoal.name}>

// СТАЛО
<div className="text-3xl font-bold text-[#111827] tracking-tight mb-2 break-words" title={primaryGoal.name}>
```

---

## Файли, які треба редагувати:
- `src/components/StrategyOverviewHeader.tsx`
- `src/components/StrategyKpiCard.tsx`

## Візуальний результат:

| Картка | До | Після |
|---|---|---|
| Рівень ризику (порожній) | `Мін. 3 ставки...` по центру | `—` + бари + текст знизу |
| Вінрейт 30д (порожній) | `Немає завершених...` по центру | `—` + текст знизу |
| Бейдж ризику | сірий текст | зелений / помаранчевий |
| Назва цілі | обрізається `...` | переноситься |
| Заголовки карток | `text-lg` | `text-xl` |
