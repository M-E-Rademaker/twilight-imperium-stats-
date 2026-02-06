import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const FactionWinRateChart = ({ games, factions, minGames = 2, selectedPlayers = [] }) => {
  const hasPlayerFilter = selectedPlayers.length > 0;

  const factionStats = useMemo(() => {
    if (!games || games.length === 0) return [];

    // Calculate stats for each faction
    const stats = {};

    games.forEach(game => {
      game.players.forEach(player => {
        // When player filter is active, only count stats for the selected players
        if (hasPlayerFilter && !selectedPlayers.includes(player.player_name)) {
          return;
        }

        if (player.faction_short && player.victory_points !== null) {
          if (!stats[player.faction_short]) {
            stats[player.faction_short] = {
              faction_short: player.faction_short,
              faction_full: player.faction_full,
              games: 0,
              wins: 0
            };
          }
          stats[player.faction_short].games++;
          if (player.winner) {
            stats[player.faction_short].wins++;
          }
        }
      });
    });

    // Convert to array, calculate win rates, and filter by minimum games
    const factionArray = Object.values(stats)
      .filter(f => f.games >= minGames)
      .map(f => ({
        ...f,
        winRate: ((f.wins / f.games) * 100).toFixed(1)
      }))
      .sort((a, b) => b.winRate - a.winRate);

    return factionArray;
  }, [games, minGames, hasPlayerFilter, selectedPlayers]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800/95 border-2 border-purple-500 rounded-lg p-3 shadow-lg max-w-xs">
          <p className="text-white font-semibold mb-2">{data.faction_full}</p>
          <div className="space-y-1 text-sm">
            <p className="text-purple-300">
              Win Rate: <span className="font-bold text-pink-300">{data.winRate}%</span>
            </p>
            <p className="text-purple-300">
              Wins: <span className="font-semibold text-white">{data.wins}</span> / {data.games} games
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Color based on win rate (gradient from red to green)
  const getBarColor = (winRate) => {
    if (winRate >= 50) return '#10b981'; // green-500 - high win rate
    if (winRate >= 40) return '#8b5cf6'; // purple-500 - good win rate
    if (winRate >= 30) return '#ec4899'; // pink-500 - medium win rate
    if (winRate >= 20) return '#f97316'; // orange-500 - low win rate
    return '#ef4444'; // red-500 - very low win rate
  };

  if (!games || games.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur border-2 border-purple-500/50 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Faction Win Rates</h2>
        <p className="text-gray-400">No data available</p>
      </div>
    );
  }

  if (factionStats.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur border-2 border-purple-500/50 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Faction Win Rates</h2>
        <p className="text-gray-400">No factions with {minGames}+ games</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur border-2 border-purple-500/50 rounded-lg p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white mb-1">
          Faction Win Rates
          {hasPlayerFilter && (
            <span className="ml-2 text-sm font-medium text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">
              {selectedPlayers.join(', ')}
            </span>
          )}
        </h2>
        <p className="text-gray-400 text-sm">
          {hasPlayerFilter
            ? `Personal win rates for ${selectedPlayers.join(', ')} (minimum ${minGames} games)`
            : `Performance by faction (minimum ${minGames} games)`
          }
        </p>
      </div>

      <ResponsiveContainer width="100%" height={Math.max(300, factionStats.length * 30 + 100)}>
        <BarChart
          data={factionStats}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            type="number"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af' }}
            label={{ value: 'Win Rate (%)', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
            domain={[0, 100]}
          />
          <YAxis
            type="category"
            dataKey="faction_short"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            width={110}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }} />
          <Bar
            dataKey="winRate"
            radius={[0, 8, 8, 0]}
          >
            {factionStats.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(parseFloat(entry.winRate))} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary stats */}
      <div className="mt-4 pt-4 border-t border-purple-500/30">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Factions Played</p>
            <p className="text-white font-semibold text-lg">
              {factionStats.length}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Best Faction</p>
            <p className="text-white font-semibold text-lg">
              {factionStats[0]?.faction_short || 'N/A'}
            </p>
          </div>
          <div className="col-span-2 md:col-span-1">
            <p className="text-gray-400">Top Win Rate</p>
            <p className="text-white font-semibold text-lg">
              {factionStats[0]?.winRate || 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FactionWinRateChart;
