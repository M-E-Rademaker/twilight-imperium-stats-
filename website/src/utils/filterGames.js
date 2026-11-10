/**
 * Apply filters to games data
 * @param {Array} games - Array of game objects
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered games
 */
export const applyFilters = (games, filters) => {
  if (!games) return [];

  return games.filter(game => {
    // Player filter - check if any selected player participated
    if (filters.players && filters.players.length > 0) {
      const hasPlayer = game.players.some(p =>
        filters.players.includes(p.player_name) && p.victory_points !== null
      );
      if (!hasPlayer) return false;
    }

    // Faction filter - check if any selected faction was played
    if (filters.factions && filters.factions.length > 0) {
      const hasFaction = game.players.some(p =>
        p.faction_short && filters.factions.includes(p.faction_short)
      );
      if (!hasFaction) return false;
    }

    // Player count filter
    if (filters.playerCount && filters.playerCount.length > 0) {
      if (!filters.playerCount.includes(game.n_players)) return false;
    }

    // Game type filter (max victory points: 10 or 14)
    if (filters.gameType && filters.gameType.length > 0) {
      if (!filters.gameType.includes(game.max_victory_points)) return false;
    }

    // Date range filter
    if (filters.dateRange) {
      const gameDate = new Date(game.start_date);
      if (filters.dateRange.start && gameDate < new Date(filters.dateRange.start)) {
        return false;
      }
      if (filters.dateRange.end && gameDate > new Date(filters.dateRange.end)) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Get active filters count for display
 * @param {Object} filters - Filter criteria
 * @returns {number} Number of active filters
 */
export const getActiveFiltersCount = (filters) => {
  let count = 0;
  if (filters.players && filters.players.length > 0) count++;
  if (filters.factions && filters.factions.length > 0) count++;
  if (filters.playerCount && filters.playerCount.length > 0) count++;
  if (filters.gameType && filters.gameType.length > 0) count++;
  if (filters.dateRange && (filters.dateRange.start || filters.dateRange.end)) count++;
  return count;
};
