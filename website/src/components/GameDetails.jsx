import React, { useEffect } from 'react';
import { X, Trophy, Calendar, Users, Target, Clock } from 'lucide-react';

const GameDetails = ({ game, onClose }) => {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!game) return null;

  // Get participants and sort by victory points
  const participants = game.players
    .filter(p => p.victory_points !== null)
    .sort((a, b) => b.victory_points - a.victory_points);

  // Calculate game duration
  let duration = null;
  if (game.start_date && game.end_date) {
    const start = new Date(game.start_date);
    const end = new Date(game.end_date);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    duration = days;
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border-2 border-purple-500 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-800">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">{game.game_name}</h2>
            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>
                  {new Date(game.start_date).toLocaleDateString()}
                  {game.end_date && ` - ${new Date(game.end_date).toLocaleDateString()}`}
                </span>
              </div>
              {duration && (
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>{duration} days</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors ml-4"
          >
            <X size={24} />
          </button>
        </div>

        {/* Game Info */}
        <div className="p-6 border-b border-gray-800">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500/20 p-2 rounded">
                <Users className="text-purple-400" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Players</p>
                <p className="text-lg font-semibold text-white">{game.n_players}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-2 rounded">
                <Target className="text-blue-400" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Victory Points</p>
                <p className="text-lg font-semibold text-white">{game.max_victory_points}</p>
              </div>
            </div>

            {game.rounds && (
              <div className="flex items-center gap-3">
                <div className="bg-green-500/20 p-2 rounded">
                  <Clock className="text-green-400" size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Rounds</p>
                  <p className="text-lg font-semibold text-white">{game.rounds}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Players Results */}
        <div className="p-6">
          <h3 className="text-lg font-bold text-purple-400 mb-4">Results</h3>
          <div className="space-y-3">
            {participants.map((player, index) => (
              <div
                key={player.player_name}
                className={`flex items-center gap-4 p-4 rounded-lg ${
                  player.winner
                    ? 'bg-gradient-to-r from-yellow-500/20 to-gray-800 border-2 border-yellow-500'
                    : 'bg-gray-800'
                }`}
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-8 text-center">
                  {player.winner ? (
                    <Trophy className="text-yellow-400" size={24} />
                  ) : (
                    <span className="text-2xl font-bold text-gray-600">
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Faction Icon */}
                {player.faction_short && (
                  <img
                    src={`/icons/faction_icons/${player.faction_short}.png`}
                    alt={player.faction_short}
                    className="w-12 h-12 object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}

                {/* Player Info */}
                <div className="flex-1">
                  <p className="text-lg font-bold text-white">{player.player_name}</p>
                  {player.faction_full && (
                    <p className="text-sm text-gray-400">{player.faction_full}</p>
                  )}
                </div>

                {/* Victory Points */}
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-400">
                    {player.victory_points}
                  </p>
                  <p className="text-xs text-gray-500">points</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800">
          <button
            onClick={onClose}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameDetails;
