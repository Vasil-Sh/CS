with open('src/components/analytics/BalanceTracker.tsx', 'r', encoding='utf-8') as f:
    t = f.read()

# Target text to find
old = "                animation: isGrowing || isStable\n                  ? 'waves 3s linear infinite'\n                  : 'shimmer 3s ease-in-out infinite',"

# Replacement with backgroundSize before it
new = "                backgroundSize: isGrowing || isStable ? '200% 100%' : undefined,\n                animation: isGrowing || isStable\n                  ? 'waves 3s linear infinite'\n                  : 'shimmer 3s ease-in-out infinite',"

count = t.count(old)
print(f"Found {count} matches")
if count == 1:
    t = t.replace(old, new)
    print("Replaced")
elif count == 0:
    print("NOT FOUND")
    # debug
    idx = t.find("waves 3s linear infinite")
    if idx > 0:
        print(repr(t[idx-60:idx+60]))

with open('src/components/analytics/BalanceTracker.tsx', 'w', encoding='utf-8') as f:
    f.write(t)
print("Done")
