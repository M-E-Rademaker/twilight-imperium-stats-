/**
 * Player colors. Same hues as the original dashboard, re-stepped so the four
 * regulars stay distinguishable for color-blind viewers on the dark surface
 * (validated: all-pairs CVD ΔE ≥ 8.8 for Manu/Thomas/Eric/Frank).
 * Color always follows the player, never their rank or position in a list.
 */
const PLAYER_COLORS: Record<string, string> = {
  Manu: '#a970ee',
  Thomas: '#2b5fd9',
  Eric: '#0f9b6c',
  Frank: '#e0661a',
  Steve: '#d6408e',
  Starki: '#0e93ad',
}

const FALLBACK = '#8b8a99'

export function playerColor(player: string): string {
  return PLAYER_COLORS[player] ?? FALLBACK
}
