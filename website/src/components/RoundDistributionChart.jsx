import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const RoundDistributionChart = ({ games }) => {
  const roundDistribution = useMemo(() => {
    if (!games || games.length === 0) return [];

    // Count games by round
    const roundCounts = {};
    let totalGames = 0;

    games.forEach(game => {
      if (game.rounds != null) {
        roundCounts[game.rounds] = (roundCounts[game.rounds] || 0) + 1;
        totalGames++;
      }
    });

    // Convert to array and calculate percentages
    const distribution = Object.entries(roundCounts)
      .map(([round, count]) => ({
        round: parseInt(round),
        count,
        percentage: ((count / totalGames) * 100).toFixed(1)
      }))
      .sort((a, b) => a.round - b.round);

    return distribution;
  }, [games]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800/95 border-2 border-purple-500 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-1">Round {data.round}</p>
          <p className="text-purple-300">{data.count} game{data.count !== 1 ? 's' : ''}</p>
          <p className="text-pink-300 font-bold">{data.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  // Color gradient for bars
  const getBarColor = (index, total) => {
    const colors = [
      '#ec4899', // pink-500
      '#d946ef', // fuchsia-500
      '#c026d3', // fuchsia-600
      '#a855f7', // purple-500
      '#9333ea', // purple-600
      '#7c3aed', // violet-600
      '#6366f1', // indigo-500
    ];
    return colors[index % colors.length];
  };

  if (!games || games.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur border-2 border-purple-500/50 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Game Duration Distribution</h2>
        <p className="text-gray-400">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur border-2 border-purple-500/50 rounded-lg p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white mb-1">Game Duration Distribution</h2>
        <p className="text-gray-400 text-sm">Percentage of games ending in each round</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={roundDistribution}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            dataKey="round"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af' }}
            label={{ value: 'Round', position: 'insideBottom', offset: -10, fill: '#9ca3af' }}
          />
          <YAxis
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af' }}
            label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }} />
          <Bar
            dataKey="percentage"
            radius={[8, 8, 0, 0]}
          >
            {roundDistribution.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(index, roundDistribution.length)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary stats below chart */}
      <div className="mt-4 pt-4 border-t border-purple-500/30">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Total Games</p>
            <p className="text-white font-semibold text-lg">
              {roundDistribution.reduce((sum, d) => sum + d.count, 0)}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Most Common</p>
            <p className="text-white font-semibold text-lg">
              Round {roundDistribution.reduce((max, d) => d.count > max.count ? d : max, roundDistribution[0])?.round || 'N/A'}
            </p>
          </div>
          <div className="col-span-2 md:col-span-1">
            <p className="text-gray-400">Round Range</p>
            <p className="text-white font-semibold text-lg">
              {roundDistribution[0]?.round || 0} - {roundDistribution[roundDistribution.length - 1]?.round || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoundDistributionChart;
