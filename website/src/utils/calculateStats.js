/**
 * Calculate statistics from games data
 * @param {Array} games - Array of game objects
 * @returns {Object} Computed statistics
 */
export const calculateStats = (games, selectedPlayers = []) => {
  if (!games || games.length === 0) {
    return {
      playerStats: {},
      factionStats: {},
      totalGames: 0,
      avgGameDuration: 0,
      avgRounds: 0
    };
  }

  const hasPlayerFilter = selectedPlayers.length > 0;
  const playerStats = {};
  const factionStats = {};
  let totalDurationDays = 0;
  let totalRounds = 0;
  let gamesWithDuration = 0;
  let gamesWithRounds = 0;

  games.forEach(game => {
    // Calculate game duration
    if (game.start_date && game.end_date) {
      const start = new Date(game.start_date);
      const end = new Date(game.end_date);
      const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      totalDurationDays += durationDays;
      gamesWithDuration++;
    }

    // Count rounds
    if (game.rounds) {
      totalRounds += game.rounds;
      gamesWithRounds++;
    }

    // Process each player in the game
    game.players.forEach(p => {
      if (p.victory_points === null) return; // Player didn't participate

      // When player filter is active, only count stats for selected players
      if (hasPlayerFilter && !selectedPlayers.includes(p.player_name)) return;

      // Player statistics
      if (!playerStats[p.player_name]) {
        playerStats[p.player_name] = {
          games: 0,
          wins: 0,
          totalPoints: 0,
          winRate: 0,
          avgPoints: 0
        };
      }

      playerStats[p.player_name].games++;
      playerStats[p.player_name].totalPoints += p.victory_points;
      if (p.winner) playerStats[p.player_name].wins++;

      // Faction statistics
      if (p.faction_short) {
        if (!factionStats[p.faction_short]) {
          factionStats[p.faction_short] = {
            games: 0,
            wins: 0,
            winRate: 0,
            fullName: p.faction_full
          };
        }
        factionStats[p.faction_short].games++;
        if (p.winner) factionStats[p.faction_short].wins++;
      }
    });
  });

  // Calculate derived statistics for players
  Object.keys(playerStats).forEach(player => {
    const stats = playerStats[player];
    stats.winRate = stats.games > 0 ? (stats.wins / stats.games) * 100 : 0;
    stats.avgPoints = stats.games > 0 ? stats.totalPoints / stats.games : 0;
  });

  // Calculate derived statistics for factions
  Object.keys(factionStats).forEach(faction => {
    const stats = factionStats[faction];
    stats.winRate = stats.games > 0 ? (stats.wins / stats.games) * 100 : 0;
  });

  // Calculate averages
  const avgGameDuration = gamesWithDuration > 0 ? totalDurationDays / gamesWithDuration : 0;
  const avgRounds = gamesWithRounds > 0 ? totalRounds / gamesWithRounds : 0;

  return {
    playerStats,
    factionStats,
    totalGames: games.length,
    avgGameDuration: Math.round(avgGameDuration),
    avgRounds: Math.round(avgRounds * 10) / 10 // Round to 1 decimal
  };
};

/**
 * Calculate win rate timeline data for charts
 * @param {Array} games - Array of game objects (should be sorted by date)
 * @param {Array} players - Array of player names to track
 * @returns {Object} Timeline data per player
 */
export const calculateWinRateTimeline = (games, players) => {
  if (!games || games.length === 0) return {};

  const playerTimelines = {};

  // Initialize timelines for all players
  players.forEach(player => {
    playerTimelines[player] = {
      games: 0,
      wins: 0,
      data: []
    };
  });

  // Process games chronologically
  games.forEach((game, idx) => {
    game.players.forEach(p => {
      if (p.victory_points === null) return; // Didn't participate

      const timeline = playerTimelines[p.player_name];
      if (!timeline) return;

      timeline.games++;
      if (p.winner) timeline.wins++;

      timeline.data.push({
        gameNumber: idx + 1,
        gameId: game.game_id,
        gameName: game.game_name,
        date: game.start_date,
        winRate: (timeline.wins / timeline.games) * 100,
        wins: timeline.wins,
        games: timeline.games
      });
    });
  });

  return playerTimelines;
};

/**
 * Get best performing faction
 * @param {Object} factionStats - Faction statistics object
 * @param {number} minGames - Minimum games to consider
 * @returns {Object|null} Best faction or null
 */
export const getBestFaction = (factionStats, minGames = 3) => {
  const factions = Object.entries(factionStats)
    .filter(([_, stats]) => stats.games >= minGames)
    .sort((a, b) => b[1].winRate - a[1].winRate);

  if (factions.length === 0) return null;

  return {
    shortName: factions[0][0],
    ...factions[0][1]
  };
};

/**
 * Get most played faction
 * @param {Object} factionStats - Faction statistics object
 * @returns {Object|null} Most played faction or null
 */
export const getMostPlayedFaction = (factionStats) => {
  const factions = Object.entries(factionStats)
    .sort((a, b) => b[1].games - a[1].games);

  if (factions.length === 0) return null;

  return {
    shortName: factions[0][0],
    ...factions[0][1]
  };
};
