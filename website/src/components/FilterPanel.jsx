import React, { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import FactionIcon from './FactionIcon';

const FilterPanel = ({ filters, setFilters, players, factions, activeFiltersCount }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const togglePlayer = (player) => {
    setFilters(prev => ({
      ...prev,
      players: prev.players.includes(player)
        ? prev.players.filter(p => p !== player)
        : [...prev.players, player]
    }));
  };

  const toggleFaction = (faction) => {
    setFilters(prev => ({
      ...prev,
      factions: prev.factions.includes(faction)
        ? prev.factions.filter(f => f !== faction)
        : [...prev.factions, faction]
    }));
  };

  const togglePlayerCount = (count) => {
    setFilters(prev => ({
      ...prev,
      playerCount: prev.playerCount.includes(count)
        ? prev.playerCount.filter(c => c !== count)
        : [...prev.playerCount, count]
    }));
  };

  const toggleGameType = (type) => {
    setFilters(prev => ({
      ...prev,
      gameType: prev.gameType.includes(type)
        ? prev.gameType.filter(t => t !== type)
        : [...prev.gameType, type]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      players: [],
      factions: [],
      playerCount: [],
      gameType: [],
      dateRange: null
    });
  };

  return (
    <div className="bg-gray-900 border border-purple-500 rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer bg-gray-800 hover:bg-gray-750"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-purple-400">Filters</h2>
          {activeFiltersCount > 0 && (
            <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearAllFilters();
              }}
              className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-700 transition-colors"
            >
              Clear All
            </button>
          )}
          {isExpanded ? (
            <ChevronUp className="text-purple-400" size={20} />
          ) : (
            <ChevronDown className="text-purple-400" size={20} />
          )}
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Players Filter */}
          <div>
            <h3 className="text-sm font-semibold text-purple-300 mb-2">Players</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {players.map(player => (
                <button
                  key={player}
                  onClick={() => togglePlayer(player)}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    filters.players.includes(player)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {player}
                </button>
              ))}
            </div>
          </div>

          {/* Player Count Filter */}
          <div>
            <h3 className="text-sm font-semibold text-purple-300 mb-2">Number of Players</h3>
            <div className="flex gap-2">
              {[3, 4, 5, 6].map(count => (
                <button
                  key={count}
                  onClick={() => togglePlayerCount(count)}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    filters.playerCount.includes(count)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {count}P
                </button>
              ))}
            </div>
          </div>

          {/* Game Type Filter */}
          <div>
            <h3 className="text-sm font-semibold text-purple-300 mb-2">Game Type</h3>
            <div className="flex gap-2">
              {[10, 14].map(type => (
                <button
                  key={type}
                  onClick={() => toggleGameType(type)}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    filters.gameType.includes(type)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {type} Points
                </button>
              ))}
            </div>
          </div>

          {/* Factions Filter */}
          <div>
            <h3 className="text-sm font-semibold text-purple-300 mb-2">
              Factions ({filters.factions.length} selected)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
              {factions.map(faction => (
                <button
                  key={faction.short}
                  onClick={() => toggleFaction(faction.short)}
                  className={`px-2 py-2 rounded text-xs font-medium transition-colors text-left flex items-center gap-2 ${
                    filters.factions.includes(faction.short)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                  title={faction.full}
                >
                  <FactionIcon factionShort={faction.short} size={24} />
                  <span className="truncate">{faction.short}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
