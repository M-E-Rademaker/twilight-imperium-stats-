# Twilight Imperium Statistics Dashboard

A modern, interactive web dashboard for tracking and visualizing Twilight Imperium game statistics for your gaming group.

## Features

- 📊 **Comprehensive Statistics**: Track wins, losses, win rates, and performance over time
- 🎯 **Advanced Filtering**: Filter games by players, factions, player count, and game type
- 📈 **Interactive Charts**:
  - Win rate progression over time
  - Player participation timeline (Gantt-style)
- 🎮 **Faction Analysis**: See which factions perform best and are played most
- 📱 **Responsive Design**: Works great on desktop, tablet, and mobile
- 🎨 **Geeky Dark Theme**: Stylish purple/pink gradient design

## Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Data Processing**: Python + pandas
- **Deployment**: Netlify (static hosting)

## Project Structure

```
project_ti_auswertung/
├── data/
│   └── raw_data.xlsx           # Source data (3 sheets: games, results, factions)
├── icons/
│   └── faction_icons/          # Faction icon images (PNG)
├── website/
│   ├── public/
│   │   ├── data/
│   │   │   └── ti_data.json    # Processed game data
│   │   └── icons/
│   │       └── faction_icons/  # Faction icons (copied)
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── utils/              # Utility functions
│   │   └── TwilightImperiumDashboard.jsx  # Main dashboard
│   └── package.json
└── process_data.py             # Data processing script
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+ with pandas and openpyxl

### Installation

1. **Install Python dependencies:**
   ```bash
   pip install pandas openpyxl
   ```

2. **Install Node.js dependencies:**
   ```bash
   cd website
   npm install
   ```

### Data Processing

Process the Excel data into JSON format:

```bash
python process_data.py
```

This will:
- Read `data/raw_data.xlsx` (games, results, factions)
- Generate `website/public/data/ti_data.json` (~33 KB)
- Create optimized data structure for fast loading

### Development

Run the development server:

```bash
cd website
npm run dev
```

Open http://localhost:5173 in your browser.

### Building for Production

Build the static site:

```bash
cd website
npm run build
```

The output will be in `website/dist/`.

### Preview Production Build

```bash
cd website
npm run preview
```

## Data Structure

### Excel File Format

**Sheet: games**
- game_id
- game_name
- start_date
- end_date
- rounds
- game_max_victory_points (10 or 14)

**Sheet: results**
- game_id
- player_name
- faction_short_name
- victory_points

**Sheet: factions**
- faction_short_name
- faction_full_name

### JSON Output Format

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
  "players": ["Eric", "Frank", "Manu", "Starki", "Steve", "Thomas"],
  "factions": [...]
}
```

## Deployment

### Netlify

1. Connect your GitHub repository to Netlify
2. Set build settings:
   - Build command: `npm run build`
   - Publish directory: `website/dist`
3. Deploy!

The `netlify.toml` configuration is already included.

### Manual Deployment

1. Build the site: `npm run build`
2. Upload the `website/dist/` folder to any static hosting service

## Updating Data

When you have new game results:

1. Update `data/raw_data.xlsx` with new games/results
2. Run the processing script: `python process_data.py`
3. The updated `ti_data.json` will be generated
4. Commit and push changes (or rebuild and redeploy)

## Features Overview

### Filter Panel
- Filter by specific players
- Filter by factions
- Filter by number of players (3-6)
- Filter by game type (10pt vs 14pt)
- Clear all filters at once

### Statistics Overview
- Total games and players
- Average game duration and rounds
- Individual player statistics (games, wins, win rate, avg points)
- Best performing faction
- Most played faction

### Charts
- **Win Rate Over Time**: Line chart showing how each player's win rate evolves
- **Participation Timeline**: Gantt-style chart showing when players were active

### Games List
- View all games (cards or table view)
- Click any game to see detailed results
- Sort and filter games

### Game Details Modal
- Full game information
- All players with factions and scores
- Winner highlighted
- Faction icons

## Customization

### Colors

Player colors are defined in components:
- Manu: Purple (#a855f7)
- Thomas: Blue (#3b82f6)
- Eric: Green (#10b981)
- Frank: Orange (#f97316)
- Steve: Pink (#ec4899)
- Starki: Cyan (#06b6d4)

Edit in `WinRateChart.jsx` and `ParticipationTimeline.jsx` to customize.

### Styling

The app uses Tailwind CSS. Modify `tailwind.config.js` for theme changes.

## Browser Support

- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- Mobile browsers: ✅

## Performance

- Initial load: < 1 second (32.9 KB data)
- Renders 30+ games smoothly
- Responsive filtering and calculations
- Optimized with React.useMemo

## License

Personal project - modify as you wish!

## Contributing

This is a personal project, but feel free to fork and adapt for your gaming group!
