import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PLAYER_COLORS = {
  'Manu': '#a855f7',
  'Thomas': '#3b82f6',
  'Eric': '#10b981',
  'Frank': '#f97316',
  'Steve': '#ec4899',
  'Starki': '#06b6d4'
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div className="bg-gray-900 border border-purple-500 rounded p-3 shadow-lg">
        <p className="text-sm text-gray-400 mb-2">Game #{data.gameNumber}</p>
        {data.gameName && <p className="text-xs text-gray-500 mb-2">{data.gameName}</p>}
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1">
            <span className="text-sm" style={{ color: entry.color }}>
              {entry.name}:
            </span>
            <span className="text-sm font-semibold text-white">
              {entry.value.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const WinRateChart = ({ timelineData, players }) => {
  const [visiblePlayers, setVisiblePlayers] = useState(
    players.reduce((acc, player) => ({ ...acc, [player]: true }), {})
  );

  // Prepare data for the chart
  // Find all game numbers that exist across all players
  const allGameNumbers = new Set();
  Object.values(timelineData).forEach(timeline => {
    timeline.data.forEach(point => allGameNumbers.add(point.gameNumber));
  });

  // Create chart data points
  const chartData = Array.from(allGameNumbers)
    .sort((a, b) => a - b)
    .map(gameNumber => {
      const dataPoint = { gameNumber };

      players.forEach(player => {
        const timeline = timelineData[player];
        if (timeline && timeline.data.length > 0) {
          // Find the data point for this game number or the most recent before it
          const playerData = timeline.data.find(d => d.gameNumber === gameNumber);
          if (playerData) {
            dataPoint[player] = playerData.winRate;
            dataPoint.gameName = playerData.gameName;
          }
        }
      });

      return dataPoint;
    })
    .filter(point => {
      // Only include points where at least one player has data
      return players.some(player => point[player] !== undefined);
    });

  const togglePlayer = (player) => {
    setVisiblePlayers(prev => ({
      ...prev,
      [player]: !prev[player]
    }));
  };

  return (
    <div className="bg-gray-900 border border-purple-500 rounded-lg p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-purple-400 mb-2">Win Rate Over Time</h2>
        <p className="text-sm text-gray-400">Track how each player's win rate evolves</p>
      </div>

      {/* Player toggles */}
      <div className="flex flex-wrap gap-2 mb-4">
        {players.map(player => {
          const timeline = timelineData[player];
          const hasData = timeline && timeline.data.length > 0;

          if (!hasData) return null;

          return (
            <button
              key={player}
              onClick={() => togglePlayer(player)}
              className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                visiblePlayers[player]
                  ? 'text-white'
                  : 'text-gray-500 opacity-50'
              }`}
              style={{
                backgroundColor: visiblePlayers[player] ? PLAYER_COLORS[player] : '#374151'
              }}
            >
              {player}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="gameNumber"
            stroke="#9ca3af"
            label={{ value: 'Game Number', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
          />
          <YAxis
            stroke="#9ca3af"
            label={{ value: 'Win Rate (%)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {players.map(player => {
            const timeline = timelineData[player];
            const hasData = timeline && timeline.data.length > 0;

            if (!hasData || !visiblePlayers[player]) return null;

            return (
              <Line
                key={player}
                type="monotone"
                dataKey={player}
                stroke={PLAYER_COLORS[player]}
                strokeWidth={2}
                dot={{ fill: PLAYER_COLORS[player], r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WinRateChart;
