import React, { useState } from 'react';
import { Trophy, Users, Calendar, Target } from 'lucide-react';
import FactionIcon from './FactionIcon';

const GameCard = ({ game, onClick }) => {
  const winner = game.players.find(p => p.winner);
  const participants = game.players.filter(p => p.victory_points !== null);

  return (
    <div
      onClick={() => onClick(game)}
      className="bg-gray-900 border border-purple-500 rounded-lg p-4 cursor-pointer hover:bg-gray-800 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1">{game.game_name}</h3>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Calendar size={14} />
            <span>{new Date(game.start_date).toLocaleDateString()}</span>
          </div>
        </div>
        {winner && (
          <div className="flex items-center gap-2 bg-yellow-500/20 px-2 py-1 rounded">
            <Trophy className="text-yellow-400 flex-shrink-0" size={16} />
            <span className="text-sm font-semibold text-yellow-400">{winner.player_name}</span>
            {winner.faction_short && (
              <FactionIcon factionShort={winner.faction_short} size={20} />
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-gray-400">
          <Users size={16} />
          <span>{game.n_players} players</span>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <Target size={16} />
          <span>{game.max_victory_points} points</span>
        </div>
      </div>

      {game.rounds && (
        <div className="mt-2 text-xs text-gray-500">
          {game.rounds} rounds
        </div>
      )}
    </div>
  );
};

const GameRow = ({ game, onClick }) => {
  const winner = game.players.find(p => p.winner);

  return (
    <tr
      onClick={() => onClick(game)}
      className="border-b border-gray-800 hover:bg-gray-800 cursor-pointer transition-colors"
    >
      <td className="px-4 py-3 text-sm text-white">{game.game_name}</td>
      <td className="px-4 py-3 text-sm text-gray-400">
        {new Date(game.start_date).toLocaleDateString()}
      </td>
      <td className="px-4 py-3 text-sm text-gray-400 text-center">{game.n_players}</td>
      <td className="px-4 py-3 text-sm text-gray-400 text-center">{game.max_victory_points}</td>
      <td className="px-4 py-3 text-sm text-gray-400 text-center">{game.rounds || '-'}</td>
      <td className="px-4 py-3 text-sm">
        {winner && (
          <div className="flex items-center gap-2">
            <Trophy className="text-yellow-400 flex-shrink-0" size={16} />
            <span className="text-yellow-400 font-semibold">{winner.player_name}</span>
            {winner.faction_short && (
              <FactionIcon factionShort={winner.faction_short} size={20} />
            )}
          </div>
        )}
      </td>
    </tr>
  );
};

const GamesList = ({ games, onGameClick }) => {
  const [view, setView] = useState('cards'); // 'cards' or 'table'

  if (!games || games.length === 0) {
    return (
      <div className="bg-gray-900 border border-purple-500 rounded-lg p-6 text-center">
        <p className="text-gray-400">No games found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-purple-400">Games</h2>
          <p className="text-sm text-gray-400">{games.length} games</p>
        </div>

        {/* View toggle - hide on mobile */}
        <div className="hidden md:flex gap-2">
          <button
            onClick={() => setView('cards')}
            className={`px-3 py-1 rounded text-sm ${
              view === 'cards'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Cards
          </button>
          <button
            onClick={() => setView('table')}
            className={`px-3 py-1 rounded text-sm ${
              view === 'table'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Table
          </button>
        </div>
      </div>

      {/* Games list */}
      {view === 'cards' || window.innerWidth < 768 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map(game => (
            <GameCard key={game.game_id} game={game} onClick={onGameClick} />
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 border border-purple-500 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-purple-400 uppercase">
                    Game
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-purple-400 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-purple-400 uppercase">
                    Players
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-purple-400 uppercase">
                    Points
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-purple-400 uppercase">
                    Rounds
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-purple-400 uppercase">
                    Winner
                  </th>
                </tr>
              </thead>
              <tbody>
                {games.map(game => (
                  <GameRow key={game.game_id} game={game} onClick={onGameClick} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamesList;
