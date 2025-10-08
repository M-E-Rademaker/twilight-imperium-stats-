# Twilight Imperium Statistics Dashboard - Project Understanding

## Project Goal
Build a client-side web application to visualize Twilight Imperium game statistics for a gaming group over the past 2 years.

## Technical Stack
- **Frontend Framework**: React 19 with Vite
- **Styling**: Tailwind CSS
- **Charts/Visualization**: Recharts
- **Icons**: Lucide-react
- **Deployment**: Netlify (static hosting, no server-side computation)
- **Current Status**: Basic React app structure exists with placeholder data

## Data Structure

### Raw Data Source
Excel file (`data/raw_data.xlsx`) with 3 sheets:
1. **results**: Player results for each game (game_id, player_name, victory_points, faction_short_name)
2. **games**: Game metadata (game_id, game_name, start_date, end_date, rounds, game_max_victory_points)
3. **factions**: Faction details (faction_short_name, faction_full_name)

### Processed Data Fields
After joining the three sheets, each record contains:
- `game_id`: Unique game identifier
- `game_name`: Name of the game
- `game_max_victory_points`: Win condition (10 or 14 points)
- `game_n_players`: Number of players in game (3-6)
- `start_date`: When game started
- `end_date`: When game ended
- `rounds`: Number of rounds played
- `player_name`: Player name (Manu, Thomas, Eric, Frank, Steve, Starki)
- `faction_short_name`: Short faction name
- `faction_full_name`: Full faction name
- `victory_points`: Points scored by player (null if didn't participate)
- `participated`: Boolean indicating if player participated
- `winner`: Boolean indicating if player won (victory_points == game_max_victory_points)
- `cumulated_n_participated`: Running count of games played by player
- `cumulated_n_winner`: Running count of wins by player
- `cumulated_overall_win_rate`: Running win rate (wins/games played)

### Player Information
Main players: **Manu** (in all games), **Thomas**, **Eric**, **Frank**
Additional players: **Steve**, **Starki** (appear in some games)

### Assets
- Faction icons available in `icons/faction_icons/` (PNG files for each faction)

## Key Requirements

### Primary Metric
**Win Rate**: Number of wins / Number of games played

### Filtering & Comparison Dimensions
Users should be able to filter/compare statistics by:
1. **Faction played**: Show stats for specific factions
2. **Number of players**: Filter by games with 3, 4, or 5 players
3. **Player composition**: Filter by which combination of players participated
4. **Game type**: Filter by 10-point vs 14-point games

### Required Visualizations

#### 1. Player Participation Timeline
- X-axis: Player names
- Y-axis: Time
- Visual representation showing when each player was involved in at least one game
- Purpose: See player activity patterns over time

#### 2. Win Rate Over Time
- Track each player's win rate progression
- Show how win rates change as more games are played
- Allows tracking improvement/decline in performance

#### 3. Overall Statistics (implied)
- Total games played per player
- Total wins per player
- Current win rate per player
- Faction statistics

## Current Implementation Status

### Existing Files
- `website/src/TwilightImperiumDashboard.jsx`: Main dashboard component (256 lines) with embedded test data
- `website/src/App.jsx`: Simple wrapper importing the dashboard
- `website/src/index.css`: Tailwind imports
- `website/package.json`: Dependencies installed (React, Recharts, Lucide-react, Tailwind)
- `_archive/data_processing.py`: Python script for data processing (reference implementation)

### Existing Styling
- User likes the current geeky styling and color choices
- Uses Tailwind CSS

## Open Questions & Considerations

### Data Processing
1. **Data Format**: Need to decide optimal format for client-side loading
   - JSON (current approach in existing code)
   - CSV (lighter weight)
   - Consider data size and parsing performance

2. **Data Location**: Where to store processed data
   - `website/public/` (accessible via fetch)
   - `website/src/` (imported as module)

3. **Data Updates**: Process for updating statistics when new games are played
   - Re-run Python script manually
   - Build step in CI/CD pipeline

### Implementation Approach
1. **Data Processing Pipeline**:
   - Use Python script to process Excel → output format
   - Store processed data in website
   - Load data in React app on mount

2. **State Management**:
   - Local React state with useState for filters
   - useMemo for computed/filtered data
   - No need for complex state management (Redux, etc.)

3. **Component Structure**:
   - Keep TwilightImperiumDashboard as main component
   - Consider breaking into smaller sub-components:
     - Filter panel
     - Stat cards
     - Charts (participation timeline, win rate over time)
     - Player comparison table

4. **Faction Icons**:
   - Need to copy faction icons from `icons/faction_icons/` to `website/public/` or `website/src/assets/`
   - Reference in faction displays

## Implementation Plan (High-Level)

### Phase 1: Data Pipeline
1. Process Excel data using provided Python script
2. Export to optimal format (JSON recommended for ease)
3. Place in website/public for fetch access

### Phase 2: Core Features
1. Load data on app mount
2. Implement filtering system:
   - Player selector
   - Faction filter
   - Number of players filter
   - Game type filter (10 vs 14 points)
   - Player composition filter
3. Calculate derived statistics based on filters

### Phase 3: Visualizations
1. Player participation timeline chart
2. Win rate over time line chart
3. Overall statistics cards
4. Optional: Faction performance comparison

### Phase 4: Polish & Deployment
1. Responsive design refinement
2. Loading states and error handling
3. Deploy to Netlify
4. Test with real data

## Notes
- Application must be completely self-contained (no backend required)
- All computation happens client-side in browser
- Data is static (updated by rebuilding/redeploying)
- Should work well with Netlify's static hosting

## Requirements Clarifications (from user)

1. **Data Pipeline**: Build efficient pipeline from Excel → Website (target: < 5 sec load time)
2. **Faction Icons**: Use alongside faction names in UI
3. **Existing Code**: Keep styling/look & feel, but rebuild functionality from scratch
4. **Participation Timeline**:
   - Time on X-axis (dates)
   - Player names on Y-axis
   - Colored rectangular blocks showing activity ranges (Gantt-style)
   - Each player has their own color
5. **Drill-down**: Yes - show detailed game information when clicking on games
6. **Mobile**: Must be responsive for iPhone 15 and similar devices

---

# IMPLEMENTATION PLAN

## Architecture Overview

### Data Layer
```
Excel (raw_data.xlsx)
  ↓ [Python processing script]
JSON files in website/public/data/
  ↓ [React fetch on mount]
Application state (React)
```

### Component Hierarchy
```
App
└── TwilightImperiumDashboard
    ├── FilterPanel (collapsible on mobile)
    ├── StatsOverview (summary cards)
    ├── ParticipationTimeline (Gantt-style chart)
    ├── WinRateChart (line chart over time)
    ├── GamesList (with drill-down)
    └── GameDetails (modal/drawer)
```

## Phase 1: Data Pipeline Setup

### 1.1 Process Excel Data
**Goal**: Create optimized JSON data for fast client-side loading

**Input**: `data/raw_data.xlsx` (3 sheets: results, games, factions)

**Output**: `website/public/data/ti_data.json`

**Data Structure**:
```json
{
  "games": [
    {
      "game_id": "...",
      "game_name": "...",
      "start_date": "2023-05-26",
      "end_date": "2023-07-13",
      "rounds": 6,
      "max_victory_points": 10,
      "n_players": 4,
      "players": [
        {
          "player_name": "Manu",
          "faction_short": "Jol",
          "faction_full": "The Universities of Jol-Nar",
          "victory_points": 10,
          "winner": true
        }
      ]
    }
  ],
  "players": ["Manu", "Thomas", "Eric", "Frank", "Steve", "Starki"],
  "factions": [
    {
      "short": "Jol",
      "full": "The Universities of Jol-Nar",
      "icon": "/icons/faction_icons/Jol Nar.png"
    }
  ]
}
```

**Script Tasks**:
- Read 3 sheets from Excel
- Join data on game_id and player_name
- Structure into nested format (games with embedded player results)
- Extract unique players and factions
- Output minified JSON
- Estimated size: ~50-100KB (should load in <1 sec)

### 1.2 Copy Faction Icons
**Source**: `icons/faction_icons/*.png`
**Destination**: `website/public/icons/faction_icons/`

**Script**: Simple file copy operation

## Phase 2: Core Application Setup

### 2.1 Data Loading Infrastructure
**File**: `website/src/hooks/useGameData.js`

```javascript
export const useGameData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/data/ti_data.json')
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
};
```

### 2.2 Clean Dashboard Component
**File**: `website/src/TwilightImperiumDashboard.jsx`

- Remove hardcoded sample data
- Implement data loading hook
- Add loading spinner
- Add error boundary
- Keep existing color scheme and styling approach

### 2.3 Filter State Management
**File**: `website/src/TwilightImperiumDashboard.jsx`

```javascript
const [filters, setFilters] = useState({
  players: [], // empty = all players
  factions: [], // empty = all factions
  playerCount: [], // e.g., [3, 4, 5]
  gameType: [], // [10, 14]
  dateRange: null,
  playerComposition: [] // specific combinations
});
```

## Phase 3: Components Implementation

### 3.1 FilterPanel Component
**File**: `website/src/components/FilterPanel.jsx`

**Features**:
- Multi-select for players (checkboxes)
- Multi-select for factions (checkboxes with icons)
- Toggle buttons for player count (3, 4, 5, 6)
- Toggle buttons for game type (10pt, 14pt)
- Date range picker (optional)
- "Clear all filters" button
- Collapsible on mobile (hamburger menu or accordion)

**Styling**:
- Tailwind with existing color scheme
- Mobile: slide-in drawer or expandable section
- Desktop: sidebar or top bar

### 3.2 StatsOverview Component
**File**: `website/src/components/StatsOverview.jsx`

**Features**:
- Grid of stat cards (responsive: 1 col mobile, 2-4 cols desktop)
- Cards show:
  - Total games (filtered)
  - Total wins per player (filtered)
  - Win rate per player (filtered)
  - Most played faction
  - Best performing faction
  - Average game duration

**Computation**:
```javascript
const stats = useMemo(() => {
  const filteredGames = applyFilters(data.games, filters);
  return calculateStats(filteredGames);
}, [data, filters]);
```

### 3.3 ParticipationTimeline Component
**File**: `website/src/components/ParticipationTimeline.jsx`

**Visualization**: Gantt-style chart
- **X-axis**: Time (date range from first to last game)
- **Y-axis**: Player names
- **Bars**: Colored rectangles showing when each player was active
  - Start: First game participation date
  - End: Last game participation date
  - Or: Multiple bars if there are gaps in participation

**Implementation Options**:
1. Custom SVG (most control)
2. Recharts with custom shape components
3. Victory charts (Gantt support)

**Interactivity**:
- Hover: Show date range
- Click: Filter to that player
- Responsive: Rotate to vertical bars on mobile if needed

**Data Processing**:
```javascript
const timelineData = useMemo(() => {
  return players.map(player => {
    const playerGames = games.filter(g =>
      g.players.some(p => p.player_name === player && p.victory_points !== null)
    );

    return {
      player,
      periods: calculateActivePeriods(playerGames),
      color: getPlayerColor(player)
    };
  });
}, [data, filters]);
```

### 3.4 WinRateChart Component
**File**: `website/src/components/WinRateChart.jsx`

**Visualization**: Multi-line chart
- **X-axis**: Game number or date
- **Y-axis**: Win rate (0-100%)
- **Lines**: One per player (or filtered players)

**Data Processing**:
```javascript
const winRateData = useMemo(() => {
  // For each player, calculate cumulative win rate over time
  const playerTimelines = {};

  games.forEach((game, idx) => {
    game.players.forEach(p => {
      if (!playerTimelines[p.player_name]) {
        playerTimelines[p.player_name] = {
          games: 0,
          wins: 0,
          data: []
        };
      }

      const pt = playerTimelines[p.player_name];
      if (p.victory_points !== null) {
        pt.games++;
        if (p.winner) pt.wins++;

        pt.data.push({
          gameNumber: idx + 1,
          date: game.start_date,
          winRate: (pt.wins / pt.games) * 100
        });
      }
    });
  });

  return playerTimelines;
}, [data, filters]);
```

**Library**: Recharts (LineChart)

**Features**:
- Toggle players on/off (legend)
- Tooltip showing exact win rate at point
- Responsive
- Color-coded per player (consistent with timeline)

### 3.5 GamesList Component
**File**: `website/src/components/GamesList.jsx`

**Features**:
- Table or card list of games (responsive)
- Show: game name, date, winner, # players, rounds
- Sortable by date, name, etc.
- Clickable rows → opens GameDetails
- Pagination or virtual scrolling if many games
- Filter based on current filters

**Mobile**: Card layout instead of table

### 3.6 GameDetails Component
**File**: `website/src/components/GameDetails.jsx`

**Implementation**: Modal on desktop, full-screen drawer on mobile

**Content**:
- Game name (prominent)
- Date range and duration
- Number of rounds
- Victory condition (10/14 points)
- Player table:
  - Rank (1st, 2nd, etc.)
  - Player name
  - Faction (with icon)
  - Victory points
  - Winner badge/highlight
- Close button
- Navigation (previous/next game)

**Styling**:
- Use existing Tailwind theme
- Highlight winner with special styling
- Faction icons next to faction names

## Phase 4: Data Processing & Filtering

### 4.1 Filter Application Function
**File**: `website/src/utils/filterGames.js`

```javascript
export const applyFilters = (games, filters) => {
  return games.filter(game => {
    // Player filter
    if (filters.players.length > 0) {
      const hasPlayer = game.players.some(p =>
        filters.players.includes(p.player_name) && p.victory_points !== null
      );
      if (!hasPlayer) return false;
    }

    // Faction filter
    if (filters.factions.length > 0) {
      const hasFaction = game.players.some(p =>
        filters.factions.includes(p.faction_short)
      );
      if (!hasFaction) return false;
    }

    // Player count filter
    if (filters.playerCount.length > 0) {
      if (!filters.playerCount.includes(game.n_players)) return false;
    }

    // Game type filter
    if (filters.gameType.length > 0) {
      if (!filters.gameType.includes(game.max_victory_points)) return false;
    }

    // Date range filter
    if (filters.dateRange) {
      const gameDate = new Date(game.start_date);
      if (gameDate < filters.dateRange.start || gameDate > filters.dateRange.end) {
        return false;
      }
    }

    return true;
  });
};
```

### 4.2 Statistics Calculator
**File**: `website/src/utils/calculateStats.js`

```javascript
export const calculateStats = (games) => {
  const playerStats = {};
  const factionStats = {};

  games.forEach(game => {
    game.players.forEach(p => {
      if (p.victory_points === null) return; // didn't participate

      // Player stats
      if (!playerStats[p.player_name]) {
        playerStats[p.player_name] = { games: 0, wins: 0, totalPoints: 0 };
      }
      playerStats[p.player_name].games++;
      playerStats[p.player_name].totalPoints += p.victory_points;
      if (p.winner) playerStats[p.player_name].wins++;

      // Faction stats
      if (p.faction_short) {
        if (!factionStats[p.faction_short]) {
          factionStats[p.faction_short] = { games: 0, wins: 0 };
        }
        factionStats[p.faction_short].games++;
        if (p.winner) factionStats[p.faction_short].wins++;
      }
    });
  });

  // Calculate win rates
  Object.keys(playerStats).forEach(player => {
    playerStats[player].winRate =
      (playerStats[player].wins / playerStats[player].games) * 100;
  });

  Object.keys(factionStats).forEach(faction => {
    factionStats[faction].winRate =
      (factionStats[faction].wins / factionStats[faction].games) * 100;
  });

  return { playerStats, factionStats };
};
```

## Phase 5: Styling & Responsiveness

### 5.1 Mobile-First Approach
- Start with mobile layout (320px - 480px)
- Progressively enhance for tablet (768px+)
- Full layout for desktop (1024px+)

### 5.2 Breakpoints (Tailwind)
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    }
  }
}
```

### 5.3 Layout Patterns

**Mobile (< 768px)**:
- Single column layout
- Filters in collapsible drawer/section
- Stats cards stacked vertically
- Charts full-width with scroll
- Game list as cards
- Game details full-screen modal

**Desktop (≥ 768px)**:
- Filters in sidebar or top bar
- Stats cards in 2-4 column grid
- Charts side-by-side
- Game list as table
- Game details in centered modal

### 5.4 Touch Interactions
- Larger tap targets (min 44x44px)
- Swipe to close modals
- Touch-friendly sliders/toggles
- Smooth scrolling

## Phase 6: Performance Optimization

### 6.1 Code Splitting
```javascript
// Lazy load heavy components
const GameDetails = lazy(() => import('./components/GameDetails'));
const ParticipationTimeline = lazy(() => import('./components/ParticipationTimeline'));
```

### 6.2 Memoization
- Use `useMemo` for expensive calculations (filtering, stats)
- Use `useCallback` for event handlers passed to children
- Use `React.memo` for pure components

### 6.3 Data Optimization
- Minify JSON output
- Consider using date strings instead of ISO format (shorter)
- Remove unnecessary fields
- If data exceeds 100KB, consider splitting into multiple files

### 6.4 Image Optimization
- Compress faction icons (use WebP if possible, with PNG fallback)
- Lazy load images below the fold
- Use appropriate sizes (don't need huge icons)

## Phase 7: Testing & Deployment

### 7.1 Testing Checklist
- [ ] Load time < 5 seconds on 3G connection
- [ ] All filters work correctly
- [ ] Charts render on mobile and desktop
- [ ] Game details modal works
- [ ] Responsive on iPhone 15 (390x844px)
- [ ] Responsive on iPad (768x1024px)
- [ ] Responsive on desktop (1920x1080px)
- [ ] Cross-browser (Chrome, Safari, Firefox)
- [ ] Touch interactions work
- [ ] Keyboard navigation works
- [ ] No console errors

### 7.2 Build & Deploy
```bash
cd website
npm run build
# Test locally
npm run preview
# Deploy to Netlify (via git push or CLI)
```

### 7.3 Netlify Configuration
**File**: `website/netlify.toml`
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Phase 8: Future Enhancements (Optional)

1. **Advanced Analytics**:
   - Faction matchup analysis (which factions win against which)
   - Player vs player head-to-head stats
   - Round duration analysis
   - Victory point distribution charts

2. **Data Updates**:
   - Admin panel to add new games (using form)
   - Export functionality (CSV/JSON download)
   - Share specific views (URL params for filters)

3. **Visualization Enhancements**:
   - Animated transitions
   - 3D charts (if appropriate)
   - Heatmaps for faction performance
   - Network graphs for player interactions

4. **Accessibility**:
   - ARIA labels
   - Keyboard navigation
   - Screen reader support
   - High contrast mode

---

## Development Timeline Estimate

- **Phase 1** (Data Pipeline): 2-3 hours
- **Phase 2** (Core Setup): 2-3 hours
- **Phase 3** (Components): 6-8 hours
- **Phase 4** (Filtering): 2-3 hours
- **Phase 5** (Styling): 3-4 hours
- **Phase 6** (Optimization): 2-3 hours
- **Phase 7** (Testing): 2-3 hours

**Total**: 19-27 hours of development work

---

## Next Steps

1. Create Python script for data processing
2. Generate processed JSON data
3. Copy faction icons to public folder
4. Setup basic React app structure
5. Implement components iteratively
6. Test and refine
7. Deploy to Netlify
