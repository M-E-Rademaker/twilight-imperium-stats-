import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const StartingPositionChart = ({ games }) => {
  const { chartData, overallExpected } = useMemo(() => {
    if (!games || games.length === 0) return { chartData: [], overallExpected: 0 };

    // For each starting position, track wins and total appearances
    const positionStats = {};

    games.forEach(game => {
      const playersWithPos = game.players.filter(
        p => p.starting_position != null && p.victory_points != null
      );
      if (playersWithPos.length === 0) return;

      playersWithPos.forEach(player => {
        const pos = player.starting_position;
        if (!positionStats[pos]) {
          positionStats[pos] = { wins: 0, total: 0, expectedWinSum: 0 };
        }
        positionStats[pos].total += 1;
        positionStats[pos].expectedWinSum += 1 / playersWithPos.length;
        if (player.winner) {
          positionStats[pos].wins += 1;
        }
      });
    });

    // Convert to array
    const data = Object.entries(positionStats)
      .map(([pos, stats]) => ({
        position: parseInt(pos),
        winRate: parseFloat(((stats.wins / stats.total) * 100).toFixed(1)),
        expectedRate: parseFloat(((stats.expectedWinSum / stats.total) * 100).toFixed(1)),
        wins: stats.wins,
        total: stats.total,
      }))
      .sort((a, b) => a.position - b.position);

    // Overall expected win rate (average across all positions weighted by appearances)
    const totalEntries = data.reduce((sum, d) => sum + d.total, 0);
    const totalExpectedSum = data.reduce((sum, d) => sum + (d.expectedRate * d.total / 100), 0);
    const avgExpected = totalEntries > 0 ? (totalExpectedSum / totalEntries) * 100 : 0;

    return { chartData: data, overallExpected: parseFloat(avgExpected.toFixed(1)) };
  }, [games]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800/95 border-2 border-purple-500 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-1">Position {data.position} (moving {getOrdinal(data.position)})</p>
          <p className="text-purple-300">Win Rate: <span className="font-bold">{data.winRate}%</span></p>
          <p className="text-gray-400 text-sm">Expected: {data.expectedRate}%</p>
          <p className="text-pink-300">{data.wins} win{data.wins !== 1 ? 's' : ''} / {data.total} game{data.total !== 1 ? 's' : ''}</p>
        </div>
      );
    }
    return null;
  };

  const getOrdinal = (n) => {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  };

  const getBarColor = (winRate, expectedRate) => {
    const diff = winRate - expectedRate;
    if (diff > 10) return '#10b981'; // green - significantly above expected
    if (diff > 0) return '#a855f7';  // purple - slightly above expected
    if (diff > -10) return '#f97316'; // orange - slightly below expected
    return '#ef4444'; // red - significantly below expected
  };

  if (!games || games.length === 0 || chartData.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur border-2 border-purple-500/50 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Starting Position vs Win Rate</h2>
        <p className="text-gray-400">No data available</p>
      </div>
    );
  }

  const bestPos = chartData.reduce((best, d) => d.winRate > best.winRate ? d : best, chartData[0]);
  const worstPos = chartData.reduce((worst, d) => d.winRate < worst.winRate ? d : worst, chartData[0]);

  return (
    <div className="bg-gray-800/50 backdrop-blur border-2 border-purple-500/50 rounded-lg p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white mb-1">Starting Position vs Win Rate</h2>
        <p className="text-gray-400 text-sm">Does moving first give you an advantage?</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            dataKey="position"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af' }}
            label={{ value: 'Starting Position', position: 'insideBottom', offset: -10, fill: '#9ca3af' }}
            tickFormatter={(val) => `${getOrdinal(val)}`}
          />
          <YAxis
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af' }}
            label={{ value: 'Win Rate (%)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
            domain={[0, 'auto']}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }} />
          <ReferenceLine
            y={overallExpected}
            stroke="#6b7280"
            strokeDasharray="5 5"
            label={{ value: `Expected (${overallExpected}%)`, fill: '#6b7280', fontSize: 12, position: 'right' }}
          />
          <Bar
            dataKey="winRate"
            radius={[8, 8, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.winRate, entry.expectedRate)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary stats below chart */}
      <div className="mt-4 pt-4 border-t border-purple-500/30">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Best Position</p>
            <p className="text-white font-semibold text-lg">
              {getOrdinal(bestPos.position)} ({bestPos.winRate}%)
            </p>
          </div>
          <div>
            <p className="text-gray-400">Worst Position</p>
            <p className="text-white font-semibold text-lg">
              {getOrdinal(worstPos.position)} ({worstPos.winRate}%)
            </p>
          </div>
          <div className="col-span-2 md:col-span-1">
            <p className="text-gray-400">Data Points</p>
            <p className="text-white font-semibold text-lg">
              {chartData.reduce((sum, d) => sum + d.total, 0)} entries
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartingPositionChart;
