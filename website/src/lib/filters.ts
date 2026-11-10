import type { Game, Result } from '../data/types'

export interface Filters {
  /** Focus: only count results of these players */
  players: string[]
  /** Only games in which all of these players took part */
  table: string[]
  /** With `table`: the line-up must match exactly */
  exact: boolean
  /** Focus: only count results played with these factions */
  factions: string[]
  /** Number of players in the game */
  counts: number[]
  /** Victory point target (10 / 14) */
  vp: number[]
  /** Calendar year of the game start */
  years: number[]
}

export const EMPTY_FILTERS: Filters = {
  players: [],
  table: [],
  exact: false,
  factions: [],
  counts: [],
  vp: [],
  years: [],
}

export interface Row {
  game: Game
  result: Result
}

/**
 * What the dashboard is looking at.
 * - `games`: games passing the game-level filters (and containing a focused result)
 * - `rows`:  one row per (game, player) result that passes the focus filters
 */
export interface Scope {
  games: Game[]
  rows: Row[]
}

export const gameYear = (g: Game) => Number(g.start.slice(0, 4))

export function matchesGame(g: Game, f: Filters): boolean {
  if (f.counts.length && !f.counts.includes(g.nPlayers)) return false
  if (f.vp.length && !f.vp.includes(g.maxVp)) return false
  if (f.years.length && !f.years.includes(gameYear(g))) return false
  if (f.table.length) {
    const present = new Set(g.results.map((r) => r.player))
    if (!f.table.every((p) => present.has(p))) return false
    if (f.exact && present.size !== f.table.length) return false
  }
  return true
}

export function matchesResult(r: Result, f: Filters): boolean {
  if (f.players.length && !f.players.includes(r.player)) return false
  if (f.factions.length && !f.factions.includes(r.faction)) return false
  return true
}

export function buildScope(all: Game[], f: Filters): Scope {
  const games: Game[] = []
  const rows: Row[] = []
  for (const game of all) {
    if (!matchesGame(game, f)) continue
    const focused = game.results.filter((r) => matchesResult(r, f))
    if (!focused.length) continue
    games.push(game)
    for (const result of focused) rows.push({ game, result })
  }
  return { games, rows }
}

export function activeFilterCount(f: Filters): number {
  return [f.players, f.table, f.factions, f.counts, f.vp, f.years].filter((a) => a.length > 0).length
}

export function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

// ---------------------------------------------------------------- URL state

const KEYS = { players: 'p', table: 't', factions: 'f', counts: 'n', vp: 'v', years: 'y' } as const

export function filtersToParams(f: Filters, params = new URLSearchParams()): URLSearchParams {
  for (const [field, key] of Object.entries(KEYS) as [keyof typeof KEYS, string][]) {
    const value = f[field]
    if (value.length) params.set(key, value.join(','))
    else params.delete(key)
  }
  if (f.exact && f.table.length) params.set('x', '1')
  else params.delete('x')
  return params
}

export function filtersFromParams(params: URLSearchParams): Filters {
  const list = (key: string) => (params.get(key) ?? '').split(',').filter(Boolean)
  const nums = (key: string) => list(key).map(Number).filter(Number.isFinite)
  return {
    players: list(KEYS.players),
    table: list(KEYS.table),
    exact: params.get('x') === '1',
    factions: list(KEYS.factions),
    counts: nums(KEYS.counts),
    vp: nums(KEYS.vp),
    years: nums(KEYS.years),
  }
}
