with open('src/components/analytics/BalanceTracker.tsx', 'r', encoding='utf-8') as f:
    t = f.read()

# Find the animation line and insert backgroundSize before it
# Target: the exact lines around the animation ternary
old_section = """                animation: isGrowing || isStable
                  ? 'waves 3s linear infinite'
                  : 'shimmer 3s ease-in-out infinite',"""

new_section = """                backgroundSize: isGrowing || isStable ? '200% 100%' : undefined,
                animation: isGrowing || isStable
                  ? 'waves 3s linear infinite'
                  : 'shimmer 3s ease-in-out infinite',"""

if old_section in t:
    t = t.replace(old_section, new_section)
    print('Added backgroundSize before animation')
else:
    print('Section NOT FOUND')
    idx = t.find('waves 3s linear infinite')
    if idx > 0:
        print(repr(t[idx-50:idx+80]))

with open('src/components/analytics/BalanceTracker.tsx', 'w', encoding='utf-8') as f:
    f.write(t)
print('Done')
