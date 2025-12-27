# CS2 Betting Tracker

A comprehensive betting tracking and analytics platform for CS2 (Counter-Strike 2) with advanced features for managing bets, analyzing performance, and setting goals.

## 🚀 Features

### 📊 Betting Management
- **Add Bets**: Record single and express (parlay) bets with detailed information
- **Multi-Currency Support**: Track bets in UAH and USD with automatic exchange rate conversion
- **Real-time Updates**: Mark bets as Win/Loss with automatic profit calculation
- **Express Bets**: Support for multi-event express bets with expandable details view
- **Goal Tracking**: Link bets to specific goals for better organization

### 💰 Bankroll Management
- **Initial Bankroll Setup**: Set your starting bankroll amount
- **Current Bank Display**: Real-time display of current bankroll with gradient card design
- **Profit Tracking**: Automatic calculation of total profit/loss
- **Daily Reset**: Automatic daily reset functionality for fresh tracking

### 📈 Analytics & Statistics
- **Performance Dashboard**: Comprehensive analytics with multiple visualization types
- **ROI Analysis**: Track Return on Investment across different bet types
- **Win Rate Tracking**: Monitor your success rate over time
- **Profit by Strategy**: Analyze which betting strategies perform best
- **Monthly Trends**: View profit trends by month

### 🎯 Goals System
- **Multiple Goal Types**: Amount-based, Ladder, ROI, and Win Rate goals
- **Progress Tracking**: Visual progress bars for each goal
- **Goal Status**: Active, Completed, and Failed goal tracking
- **Bet Linking**: Associate bets with specific goals

### 📱 User Interface
- **Modern Design**: Clean, gradient-based UI with Tailwind CSS
- **Responsive Layout**: Fully responsive design for desktop and mobile
- **Dark/Light Themes**: Support for both light and dark color schemes
- **Smooth Animations**: Polished transitions and hover effects
- **Interactive Tables**: Sortable, filterable tables with expandable rows

## 🛠️ Technology Stack

- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Hooks (useState, useEffect, useMemo, useCallback)
- **Data Persistence**: LocalStorage + Google Sheets integration
- **Build Tool**: Vite
- **Icons**: Lucide React
- **Notifications**: Sonner (toast notifications)

## 📦 Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm run dev

# Build for production
pnpm run build

# Lint code
pnpm run lint
```

## 🏗️ Project Structure

```
src/
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── BettingHistory.tsx     # Betting history component
│   ├── CS2BettingForm.tsx     # Bet creation form
│   ├── StrategyOverview.tsx   # Strategy analysis
│   ├── BetShareModal.tsx      # Share bet modal
│   └── InitialBankModal.tsx   # Bankroll setup modal
├── pages/
│   ├── MyBets.tsx            # Main betting page (REFACTORED)
│   ├── Analytics.tsx         # Analytics dashboard
│   ├── Goals.tsx             # Goals management
│   ├── Matches.tsx           # Match listings
│   └── Admin.tsx             # Admin panel
├── lib/
│   ├── realGoogleSheets.ts   # Google Sheets integration
│   ├── userDataService.ts    # User data management
│   └── bankrollService.ts    # Bankroll calculations
└── types/
    └── betting.ts            # TypeScript type definitions
```

## 🔄 Recent Refactoring (v2.0)

### Code Optimization
- **Performance Improvements**:
  - Converted all callbacks to `useCallback` hooks to prevent unnecessary re-renders
  - Implemented `useMemo` for expensive computations (sorting, filtering)
  - Optimized state management with proper dependency arrays

- **Type Safety**:
  - Added proper TypeScript interfaces for all components
  - Removed all `any` types and replaced with specific types
  - Created `StatCardProps` interface for reusable stat cards

- **Code Organization**:
  - Extracted `StatCard` component for better reusability
  - Moved constants to top-level (`DEFAULT_STATS`)
  - Improved function naming and structure
  - Better separation of concerns

- **Removed Unused Code**:
  - Cleaned up duplicate state initializations
  - Removed redundant effect dependencies
  - Eliminated unnecessary loading states
  - Simplified data fetching logic

### New Features
- **Timestamp-based Sorting**: Bets now sort by creation timestamp (`createdAt`) for accurate chronological order
- **Express Bet Details**: Fixed expandable express bet details rendering directly under bet rows
- **Improved UI**: Enhanced visual hierarchy with better color coding for pending bets
- **Better Performance**: Reduced bundle size from 1,139.86 kB to 1,136.51 kB (-3.35 kB)

## 📊 Key Components

### MyBets Page (Refactored)
The main betting management page with:
- **8 Stat Cards**: Current Bank, Total Bets, Profit, Win Rate, Active, Wins, Losses, Average ROI
- **Sortable Table**: Pending bets first, then by creation time (newest first)
- **Express Bet Support**: Expandable details for multi-event bets
- **Action Buttons**: Win/Loss marking, Share functionality
- **Three Tabs**: Add Bet, History, Strategies

### Performance Optimizations
```typescript
// Before: Direct computation in render
const sortedBets = [...recentBets].sort((a, b) => { ... });

// After: Memoized computation
const sortedBets = useMemo(() => 
  [...recentBets].sort((a, b) => { ... }),
  [recentBets]
);

// Before: Inline function
onClick={() => updateBetResult(bet, 'Win')}

// After: Memoized callback
const updateBetResult = useCallback(async (bet, result) => { ... }, [deps]);
```

## 🎨 Design System

### Color Palette
- **Primary**: Blue gradient (from-blue-500 via-purple-500 to-pink-500)
- **Success**: Green (#10b981)
- **Warning**: Amber (#f59e0b)
- **Error**: Red (#ef4444)
- **Info**: Cyan (#06b6d4)

### Typography
- **Headings**: font-bold, tracking-tight
- **Body**: font-medium
- **Stats**: text-3xl font-semibold

## 🔐 Data Management

### LocalStorage Keys
- `currentUser`: Current logged-in user
- `{user}_mybets_data`: User's bet history
- `{user}_mybets_stats`: User's statistics
- `{user}_goals`: User's goals
- `{user}_bankroll`: Bankroll information

### Google Sheets Integration
- Real-time data sync with Google Sheets
- Automatic backup of all betting data
- Support for multiple users

## 📝 Usage Examples

### Adding a Single Bet
```typescript
// Fill in the CS2BettingForm:
- Date: 2024-01-15
- Match: Team A vs Team B
- Bet Type: Match Winner
- Selection: Team A
- Odds: 2.50
- Amount: 100 UAH
- Format: Single
```

### Adding an Express Bet
```typescript
// Express bet with 3 events:
Event 1: Team A vs Team B | Match Winner: Team A @1.80
Event 2: Team C vs Team D | Over 2.5 Maps: Yes @1.65
Event 3: Team E vs Team F | First Map Winner: Team E @1.90
Total Odds: 5.64
```

## 🐛 Bug Fixes

### v2.0 Fixes
1. **Express Bet Details**: Fixed issue where details wouldn't open when clicking "Деталі" button
2. **Sorting Order**: Implemented proper timestamp-based sorting with `createdAt` field
3. **TypeScript Errors**: Resolved all `any` type errors for better type safety
4. **Performance**: Optimized re-renders with proper memoization

## 🚀 Deployment

The application is deployed and accessible at the configured URL. All changes are automatically synced to the GitHub repository.

### Build Information
- **CSS Size**: 93.73 kB (gzip: 14.88 kB)
- **JS Size**: 1,136.51 kB (gzip: 312.97 kB)
- **Build Time**: ~7.7 seconds

## 🤝 Contributing

This is a private project. For any issues or feature requests, please contact the development team.

## 📄 License

Private - All rights reserved

## 🔗 Links

- **GitHub Repository**: https://github.com/Vasil-Sh/CS.git
- **Documentation**: See inline code comments for detailed documentation

---

**Last Updated**: December 27, 2024
**Version**: 2.0.0 (Refactored)
**Commit**: `10e761d` - Виправлено відкриття деталей експрес-ставок