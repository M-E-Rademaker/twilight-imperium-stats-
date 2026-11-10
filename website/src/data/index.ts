import data from 'virtual:ti-data'
import type { Dataset, Faction, Game } from './types'

/** The whole dataset, parsed and validated at build time from ../data/*.csv. */
export const dataset: Dataset = data

export const gamesById = new Map<string, Game>(dataset.games.map((g) => [g.id, g]))

export function faction(id: string): Faction {
  return dataset.factions[id] ?? { id, name: id, icon: id }
}

export const years = [...new Set(dataset.games.map((g) => Number(g.start.slice(0, 4))))].sort()
export const playerCounts = [...new Set(dataset.games.map((g) => g.nPlayers))].sort()
export const vpTargets = [...new Set(dataset.games.map((g) => g.maxVp))].sort((a, b) => a - b)
/** factions that appear in at least one game, most played first */
export const playedFactions = [
  ...dataset.games
    .flatMap((g) => g.results.map((r) => r.faction))
    .reduce((m, f) => m.set(f, (m.get(f) ?? 0) + 1), new Map<string, number>())
    .entries(),
]
  .sort((a, b) => b[1] - a[1])
  .map(([f]) => f)
