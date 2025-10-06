# CS2 Betting Analytics Platform - MVP Todo

## Project Overview
Веб-платформа для аналізу матчів CS2 та допомоги у виборі безпечних ставок

## Core Files to Create/Modify

### 1. Main Layout & Navigation
- `src/components/Layout.tsx` - Основний макет з навігацією
- `src/components/Sidebar.tsx` - Бічна панель навігації

### 2. Dashboard Pages
- `src/pages/Dashboard.tsx` - Головна панель з оглядом
- `src/pages/Teams.tsx` - Сторінка команд та їх статистики
- `src/pages/Matches.tsx` - Список матчів та аналітика
- `src/pages/Analytics.tsx` - Детальна аналітика та рекомендації

### 3. Components
- `src/components/MatchCard.tsx` - Картка матчу
- `src/components/TeamStats.tsx` - Статистика команди
- `src/components/BettingRecommendation.tsx` - Рекомендації для ставок
- `src/components/StatsChart.tsx` - Графіки статистики

### 4. Mock Data & Utils
- `src/data/mockData.ts` - Тестові дані матчів та команд
- `src/lib/analytics.ts` - Функції для аналізу даних

## Features Implementation Priority
1. ✅ Template setup
2. 🔄 Basic layout with navigation
3. ⏳ Dashboard with match overview
4. ⏳ Teams statistics page
5. ⏳ Match analysis page
6. ⏳ Betting recommendations
7. ⏳ Analytics charts
8. ⏳ Responsive design polish

## Tech Stack
- React + TypeScript
- shadcn/ui components
- Tailwind CSS
- Recharts for analytics