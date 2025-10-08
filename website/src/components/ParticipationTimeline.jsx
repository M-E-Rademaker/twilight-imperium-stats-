import React from 'react';

const PLAYER_COLORS = {
  'Manu': '#a855f7',
  'Thomas': '#3b82f6',
  'Eric': '#10b981',
  'Frank': '#f97316',
  'Steve': '#ec4899',
  'Starki': '#06b6d4'
};

const ParticipationTimeline = ({ games, players }) => {
  // Calculate date range
  const allDates = games
    .filter(g => g.start_date)
    .map(g => new Date(g.start_date));

  if (allDates.length === 0) {
    return (
      <div className="bg-gray-900 border border-purple-500 rounded-lg p-4">
        <h2 className="text-xl font-bold text-purple-400">Participation Timeline</h2>
        <p className="text-gray-400 mt-2">No data available</p>
      </div>
    );
  }

  const minDate = new Date(Math.min(...allDates));
  const maxDate = new Date(Math.max(...allDates));
  const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));

  // Calculate participation periods for each player
  const playerTimelines = players.map(player => {
    const playerGames = games.filter(g =>
      g.players.some(p => p.player_name === player && p.victory_points !== null)
    );

    if (playerGames.length === 0) {
      return { player, periods: [] };
    }

    // Group consecutive games into periods
    const periods = [];
    let currentPeriod = null;

    playerGames.forEach(game => {
      const gameDate = new Date(game.start_date);

      if (!currentPeriod) {
        currentPeriod = {
          start: gameDate,
          end: gameDate,
          games: [game]
        };
      } else {
        // If game is within 60 days of current period end, extend the period
        const daysSinceLastGame = (gameDate - currentPeriod.end) / (1000 * 60 * 60 * 24);
        if (daysSinceLastGame <= 60) {
          currentPeriod.end = gameDate;
          currentPeriod.games.push(game);
        } else {
          periods.push(currentPeriod);
          currentPeriod = {
            start: gameDate,
            end: gameDate,
            games: [game]
          };
        }
      }
    });

    if (currentPeriod) {
      periods.push(currentPeriod);
    }

    return { player, periods };
  }).filter(timeline => timeline.periods.length > 0);

  const getPosition = (date) => {
    const daysSinceStart = (date - minDate) / (1000 * 60 * 60 * 24);
    return (daysSinceStart / totalDays) * 100;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  return (
    <div className="bg-gray-900 border border-purple-500 rounded-lg p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-purple-400 mb-2">Participation Timeline</h2>
        <p className="text-sm text-gray-400">
          When each player was active ({formatDate(minDate)} - {formatDate(maxDate)})
        </p>
      </div>

      <div className="space-y-4">
        {playerTimelines.map(({ player, periods }) => (
          <div key={player} className="relative">
            {/* Player name */}
            <div className="flex items-center mb-2">
              <div className="w-20 text-sm font-semibold text-white">{player}</div>
              <div className="flex-1 text-xs text-gray-500">
                {periods.reduce((sum, p) => sum + p.games.length, 0)} games
              </div>
            </div>

            {/* Timeline bar */}
            <div className="relative h-8 bg-gray-800 rounded">
              {periods.map((period, idx) => {
                const startPos = getPosition(period.start);
                const endPos = getPosition(period.end);
                const width = Math.max(endPos - startPos, 1); // Minimum 1% width

                return (
                  <div
                    key={idx}
                    className="absolute h-full rounded cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                      left: `${startPos}%`,
                      width: `${width}%`,
                      backgroundColor: PLAYER_COLORS[player]
                    }}
                    title={`${formatDate(period.start)} - ${formatDate(period.end)} (${period.games.length} games)`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs text-white font-semibold">
                        {period.games.length}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Time axis */}
      <div className="mt-4 relative h-8">
        <div className="absolute inset-x-0 top-0 border-t border-gray-700" />
        <div className="flex justify-between text-xs text-gray-500 pt-2">
          <span>{formatDate(minDate)}</span>
          <span>{formatDate(maxDate)}</span>
        </div>
      </div>
    </div>
  );
};

export default ParticipationTimeline;
