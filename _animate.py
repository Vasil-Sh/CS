with open('src/components/analytics/BalanceTracker.tsx', 'r', encoding='utf-8') as f:
    t = f.read()

# Fix 1: Add useState/useEffect import
t = t.replace(
    "import { Info } from 'lucide-react';",
    "import { useState, useEffect } from 'react';\nimport { Info } from 'lucide-react';"
)
print('Fix1: added react import')

# Fix 2: Add state + Enter handler
marker = "  const hasBets = allTimeHigh > 0;"
state_code = """  // Animation variant: 0=gradientGlow 1=waveFlow 2=breathe 3=sparkle 4=heartbeat 5=stripes
  const [animVariant, setAnimVariant] = useState(0);
  const animNames = ['Світіння', 'Хвиля', 'Дихання', 'Іскри', 'Пульс', 'Смуги'];
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.repeat) {
        setAnimVariant(v => (v + 1) % 6);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

"""
t = t.replace(marker, state_code + marker)
print('Fix2: added state + Enter handler')

# Fix 3: Replace the bar styles
old_bar = """              style={{
                width: `${Math.min(percentOfPeak, 100)}%`,
                background: isGrowing || isStable
                  ? 'linear-gradient(90deg, #10B981, #34D399, #6EE7B7, #34D399)'
                  : isDipping
                  ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                  : 'linear-gradient(90deg, #EF4444, #F87171)',
                backgroundSize: '200% 100%',
                animation: isGrowing || isStable
                  ? 'gradientGlow 2s ease-in-out infinite'
                  : 'shimmer 3s ease-in-out infinite',
              }}"""

new_bar = """              style={{
                width: `${Math.min(percentOfPeak, 100)}%`,
                ...(isGrowing || isStable
                  ? animVariant === 5
                    ? {
                        background: 'repeating-linear-gradient(45deg, #10B981, #10B981 10px, #34D399 10px, #34D399 20px)',
                        backgroundSize: '40px 40px',
                        animation: 'stripes 1.5s linear infinite',
                      }
                    : animVariant === 4
                    ? {
                        background: 'linear-gradient(90deg, #10B981, #34D399)',
                        animation: 'heartbeat 1.2s ease-in-out infinite',
                        transformOrigin: 'center',
                      }
                    : animVariant === 3
                    ? {
                        background: 'linear-gradient(90deg, #10B981 0%, #34D399 25%, #6EE7B7 50%, #34D399 75%, #10B981 100%)',
                        backgroundSize: '300% 100%',
                        animation: 'sparkle 2s ease-in-out infinite',
                      }
                    : animVariant === 2
                    ? {
                        background: 'linear-gradient(90deg, #10B981, #34D399)',
                        animation: 'breathe 2s ease-in-out infinite',
                      }
                    : animVariant === 1
                    ? {
                        background: 'linear-gradient(90deg, #10B981 0%, #34D399 25%, #6EE7B7 50%, #34D399 75%, #10B981 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'waveFlow 2.5s linear infinite',
                      }
                    : {
                        background: 'linear-gradient(90deg, #10B981, #34D399, #6EE7B7, #34D399)',
                        backgroundSize: '200% 100%',
                        animation: 'gradientGlow 2s ease-in-out infinite',
                      }
                  : {
                      background: isDipping
                        ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                        : 'linear-gradient(90deg, #EF4444, #F87171)',
                      animation: 'shimmer 3s ease-in-out infinite',
                    }),
              }}"""

if old_bar in t:
    t = t.replace(old_bar, new_bar)
    print('Fix3: updated bar styles')
else:
    print('Fix3: NOT FOUND')
    idx = t.find('Math.min(percentOfPeak')
    if idx > 0:
        print(t[idx:idx+200])

# Fix 4: Add indicator badge next to title
title_marker = '>Трекер балансу</span>'
indicator = '>Трекер балансу</span>\n          <span className="text-[10px] text-[#9CA3AF] bg-[#F3F4F6] px-2 py-0.5 rounded-full font-medium ml-2">{animNames[animVariant]}</span>'
t = t.replace(title_marker, indicator)
print('Fix4: added indicator')

with open('src/components/analytics/BalanceTracker.tsx', 'w', encoding='utf-8') as f:
    f.write(t)
print('Done')
