import React from 'react';
import { Trophy, Users, Target, Clock, Star, TrendingUp } from 'lucide-react';
import FactionIcon from './FactionIcon';

const StatCard = ({ icon: Icon, title, value, subtitle, color = 'purple', factionShort }) => {
  const colorClasses = {
    purple: 'border-purple-500 bg-gradient-to-br from-purple-900/50 to-gray-900',
    blue: 'border-blue-500 bg-gradient-to-br from-blue-900/50 to-gray-900',
    green: 'border-green-500 bg-gradient-to-br from-green-900/50 to-gray-900',
    orange: 'border-orange-500 bg-gradient-to-br from-orange-900/50 to-gray-900',
    pink: 'border-pink-500 bg-gradient-to-br from-pink-900/50 to-gray-900',
    cyan: 'border-cyan-500 bg-gradient-to-br from-cyan-900/50 to-gray-900'
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white mb-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        {factionShort ? (
          <FactionIcon factionShort={factionShort} size={32} />
        ) : (
          <Icon className={`text-${color}-400`} size={24} />
        )}
      </div>
    </div>
  );
};

const PlayerStatsCard = ({ playerName, stats, color }) => {
  return (
    <div className={`border border-${color}-500 bg-gradient-to-br from-${color}-900/50 to-gray-900 rounded-lg p-4`}>
      <h3 className="text-lg font-bold text-white mb-3">{playerName}</h3>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Games Played</span>
          <span className="text-white font-semibold">{stats.games}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Wins</span>
          <span className="text-white font-semibold">{stats.wins}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Win Rate</span>
          <span className={`font-bold text-${color}-400`}>
            {stats.winRate.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Avg Points</span>
          <span className="text-white font-semibold">{stats.avgPoints.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
};

const StatsOverview = ({ stats, bestFaction, mostPlayedFaction }) => {
  const { playerStats, totalGames, avgGameDuration, avgRounds } = stats;

  // Sort players by win rate for display
  const sortedPlayers = Object.entries(playerStats).sort((a, b) => b[1].winRate - a[1].winRate);

  const playerColors = {
    'Manu': 'purple',
    'Thomas': 'blue',
    'Eric': 'green',
    'Frank': 'orange',
    'Steve': 'pink',
    'Starki': 'cyan'
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={Target}
          title="Total Games"
          value={totalGames}
          color="purple"
        />
        <StatCard
          icon={Users}
          title="Players"
          value={Object.keys(playerStats).length}
          color="blue"
        />
        <StatCard
          icon={Clock}
          title="Avg Duration"
          value={`${avgGameDuration}d`}
          subtitle="days per game"
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          title="Avg Rounds"
          value={avgRounds}
          subtitle="rounds per game"
          color="orange"
        />
        {mostPlayedFaction && (
          <StatCard
            icon={Star}
            title="Most Played"
            value={mostPlayedFaction.shortName}
            subtitle={`${mostPlayedFaction.games} games`}
            color="pink"
            factionShort={mostPlayedFaction.shortName}
          />
        )}
        {bestFaction && (
          <StatCard
            icon={Trophy}
            title="Best Faction"
            value={bestFaction.shortName}
            subtitle={`${bestFaction.winRate.toFixed(0)}% WR`}
            color="cyan"
            factionShort={bestFaction.shortName}
          />
        )}
      </div>

      {/* Player Statistics */}
      <div>
        <h2 className="text-xl font-bold text-purple-400 mb-4">Player Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedPlayers.map(([playerName, playerStat]) => (
            <PlayerStatsCard
              key={playerName}
              playerName={playerName}
              stats={playerStat}
              color={playerColors[playerName] || 'purple'}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;
