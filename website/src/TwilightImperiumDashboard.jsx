import React, { useState, useMemo } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { useGameData } from './hooks/useGameData';
import { applyFilters, getActiveFiltersCount } from './utils/filterGames';
import {
  calculateStats,
  calculateWinRateTimeline,
  getBestFaction,
  getMostPlayedFaction
} from './utils/calculateStats';
import FilterPanel from './components/FilterPanel';
import StatsOverview from './components/StatsOverview';
import WinRateChart from './components/WinRateChart';
import ParticipationTimeline from './components/ParticipationTimeline';
import RoundDistributionChart from './components/RoundDistributionChart';
import FactionWinRateChart from './components/FactionWinRateChart';
import GamesList from './components/GamesList';
import GameDetails from './components/GameDetails';

const TwilightImperiumDashboard = () => {
  // Load data
  const { data, loading, error } = useGameData();

  // Filter state
  const [filters, setFilters] = useState({
    players: [],
    factions: [],
    playerCount: [],
    gameType: [],
    dateRange: null
  });

  // Selected game for details modal
  const [selectedGame, setSelectedGame] = useState(null);

  // Calculate filtered data and statistics
  const filteredGames = useMemo(() => {
    if (!data) return [];
    return applyFilters(data.games, filters);
  }, [data, filters]);

  const stats = useMemo(() => {
    if (!data) return null;
    return calculateStats(filteredGames);
  }, [filteredGames, data]);

  const timelineData = useMemo(() => {
    if (!data) return {};
    return calculateWinRateTimeline(filteredGames, data.players);
  }, [filteredGames, data]);

  const bestFaction = useMemo(() => {
    if (!stats) return null;
    return getBestFaction(stats.factionStats, 3);
  }, [stats]);

  const mostPlayedFaction = useMemo(() => {
    if (!stats) return null;
    return getMostPlayedFaction(stats.factionStats);
  }, [stats]);

  const activeFiltersCount = useMemo(() => {
    return getActiveFiltersCount(filters);
  }, [filters]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-purple-400 mx-auto mb-4" size={48} />
          <p className="text-white text-lg">Loading Twilight Imperium data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-900/20 border-2 border-red-500 rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="text-red-400" size={24} />
            <h2 className="text-xl font-bold text-white">Error Loading Data</h2>
          </div>
          <p className="text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  // No data state
  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <p className="text-white text-lg">No data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
            Twilight Imperium Statistics
          </h1>
          <p className="text-gray-400 text-lg">
            Gaming Group Performance Analysis
          </p>
        </header>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Filters */}
          <FilterPanel
            filters={filters}
            setFilters={setFilters}
            players={data.players}
            factions={data.factions}
            activeFiltersCount={activeFiltersCount}
          />

          {/* Statistics Overview */}
          <StatsOverview
            stats={stats}
            bestFaction={bestFaction}
            mostPlayedFaction={mostPlayedFaction}
          />

          {/* Charts Row 1: Player Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Participation Timeline */}
            <ParticipationTimeline
              games={filteredGames}
              players={data.players}
            />

            {/* Win Rate Chart */}
            <WinRateChart
              timelineData={timelineData}
              players={data.players}
            />
          </div>

          {/* Charts Row 2: Game & Faction Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Round Distribution Chart */}
            <RoundDistributionChart
              games={filteredGames}
            />

            {/* Faction Win Rate Chart */}
            <FactionWinRateChart
              games={filteredGames}
              factions={data.factions}
              minGames={2}
            />
          </div>

          {/* Games List */}
          <GamesList
            games={filteredGames}
            onGameClick={setSelectedGame}
          />
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>Twilight Imperium Statistics Dashboard</p>
          <p className="mt-1">
            {data.games.length} games • {data.players.length} players • {data.factions.length} factions
          </p>
        </footer>
      </div>

      {/* Game Details Modal */}
      {selectedGame && (
        <GameDetails
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
        />
      )}
    </div>
  );
};

export default TwilightImperiumDashboard;
