with open('src/components/analytics/BalanceTracker.tsx', 'r', encoding='utf-8') as f:
    t = f.read()

# Change border on both game blocks: #F3F4F6 → #E5E7EB
c1 = t.count('border border-[#F3F4F6]')
print(f'border instances: {c1}')
# Only change the ones in the game summary section (the 2 game cards)
# Target: the specific pattern that matches game cards
t = t.replace(
    'rounded-xl px-3 py-2.5 bg-[#F9FAFB] border border-[#F3F4F6]',
    'rounded-xl px-3 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB]'
)

# Change "—" to "Немає даних"
c2 = t.count('>—<')
print(f'— instances: {c2}')
t = t.replace(
    '<p className="text-sm text-[#D1D5DB]">—</p>',
    '<p className="text-xs text-[#9CA3AF]">Немає даних</p>'
)

with open('src/components/analytics/BalanceTracker.tsx', 'w', encoding='utf-8') as f:
    f.write(t)
print('Done')
