import type { Game, WinCategory } from '../data/types'
import { WIN_CATEGORIES } from '../data/types'
import type { Row } from './filters'

/** Below this many games a player's numbers are flagged as "wenig Daten". */
export const MIN_PLAYER_GAMES = 5
/** Below this many games a faction / seat is flagged as "wenig Daten". */
export const MIN_GROUP_GAMES = 3
/** The win-rate curve starts after this many games per player (too noisy before). */
export const WIN_RATE_WARMUP = 5

/**
 * Basic aggregate for any group of results.
 * `expected` is the number of wins a player would have with equal chances:
 * the sum of 1 / (players in game). It makes 3- and 6-player games comparable.
 */
export interface Tally {
  games: number
  wins: number
  expected: number
  vpShare: number // sum of vp / maxVp
  rankSum: number
}

export interface Rates {
  games: number
  wins: number
  winRate: number
  expectedRate: number
  /** wins minus expected wins ("Siege über Erwartung") */
  wae: number
  /** wins / expected wins; 1 = average */
  performance: number
  avgVpShare: number
  avgRank: number
}

const emptyTally = (): Tally => ({ games: 0, wins: 0, expected: 0, vpShare: 0, rankSum: 0 })

function add(t: Tally, row: Row) {
  t.games++
  if (row.result.winner) t.wins++
  t.expected += 1 / row.game.nPlayers
  t.vpShare += Math.min(1, row.result.vp / row.game.maxVp)
  t.rankSum += row.result.rank
}

export function rates(t: Tally): Rates {
  const g = Math.max(t.games, 1)
  return {
    games: t.games,
    wins: t.wins,
    winRate: t.wins / g,
    expectedRate: t.expected / g,
    wae: t.wins - t.expected,
    performance: t.expected > 0 ? t.wins / t.expected : 0,
    avgVpShare: t.vpShare / g,
    avgRank: t.rankSum / g,
  }
}

export function groupBy<K>(rows: Row[], key: (r: Row) => K): Map<K, Tally> {
  const out = new Map<K, Tally>()
  for (const row of rows) {
    const k = key(row)
    let t = out.get(k)
    if (!t) out.set(k, (t = emptyTally()))
    add(t, row)
  }
  return out
}

export const overall = (rows: Row[]): Rates => rates(groupBy(rows, () => 0).get(0) ?? emptyTally())

// ---------------------------------------------------------------- players

export interface PlayerStat extends Rates {
  player: string
  /** last up to 5 results, oldest first */
  form: { won: boolean; gameId: string }[]
  favoriteFaction: { faction: string; games: number } | null
}

export function playerStats(rows: Row[]): PlayerStat[] {
  const byPlayer = new Map<string, Row[]>()
  for (const row of rows) {
    const list = byPlayer.get(row.result.player) ?? []
    list.push(row)
    byPlayer.set(row.result.player, list)
  }

  return [...byPlayer.entries()]
    .map(([player, list]) => {
      const factions = [...groupBy(list, (r) => r.result.faction).entries()]
      const fav = factions.sort((a, b) => b[1].games - a[1].games || b[1].wins - a[1].wins)[0]
      return {
        player,
        ...rates(groupBy(list, () => 0).get(0)!),
        form: list.slice(-5).map((r) => ({ won: r.result.winner, gameId: r.game.id })),
        favoriteFaction: fav ? { faction: fav[0], games: fav[1].games } : null,
      }
    })
    .sort((a, b) => b.wae - a.wae || b.winRate - a.winRate)
}

// ---------------------------------------------------------------- factions / seats

export interface GroupStat extends Rates {
  key: string
}

export function factionStats(rows: Row[]): GroupStat[] {
  return [...groupBy(rows, (r) => r.result.faction).entries()].map(([key, t]) => ({ key, ...rates(t) }))
}

export function seatStats(rows: Row[]): (Rates & { seat: number })[] {
  return [...groupBy(rows, (r) => r.result.seat).entries()]
    .map(([seat, t]) => ({ seat, ...rates(t) }))
    .sort((a, b) => a.seat - b.seat)
}

// ---------------------------------------------------------------- timeline

export interface TimelinePoint {
  t: number
  gameId: string
  name: string
  start: string
  /** per player: cumulative win rate (only after warm-up) */
  wr: Record<string, number>
  /** per player: cumulative wins above expectation */
  wae: Record<string, number>
}

export function winRateTimeline(rows: Row[]): TimelinePoint[] {
  const acc = new Map<string, Tally>()
  const points: TimelinePoint[] = []
  let current: TimelinePoint | null = null

  for (const row of rows) {
    if (!current || current.gameId !== row.game.id) {
      current = { t: Date.parse(`${row.game.end}T00:00:00Z`), gameId: row.game.id, name: row.game.name, start: row.game.start, wr: {}, wae: {} }
      points.push(current)
    }
    const p = row.result.player
    let t = acc.get(p)
    if (!t) acc.set(p, (t = emptyTally()))
    add(t, row)
    if (t.games >= WIN_RATE_WARMUP) current.wr[p] = t.wins / t.games
    current.wae[p] = t.wins - t.expected
  }
  return points
}

// ---------------------------------------------------------------- head to head

export interface Duel {
  shared: number
  /** games where row player finished ahead of column player (ties count half) */
  ahead: number
  wins: number
}

export function headToHead(games: Game[], players: string[]): Map<string, Map<string, Duel>> {
  const out = new Map<string, Map<string, Duel>>(players.map((p) => [p, new Map()]))
  for (const g of games) {
    for (const a of g.results) {
      const row = out.get(a.player)
      if (!row) continue
      for (const b of g.results) {
        if (a.player === b.player || !out.has(b.player)) continue
        const d = row.get(b.player) ?? { shared: 0, ahead: 0, wins: 0 }
        d.shared++
        d.ahead += a.rank < b.rank ? 1 : a.rank === b.rank ? 0.5 : 0
        if (a.winner) d.wins++
        row.set(b.player, d)
      }
    }
  }
  return out
}

// ---------------------------------------------------------------- how games are won

export interface WinTypeStat {
  key: string
  total: number
  byCategory: Record<WinCategory, number>
  withSupport: number
}

export function winTypes(rows: Row[]): { overall: WinTypeStat; players: WinTypeStat[] } {
  const make = (key: string): WinTypeStat => ({
    key,
    total: 0,
    byCategory: Object.fromEntries(WIN_CATEGORIES.map((c) => [c, 0])) as Record<WinCategory, number>,
    withSupport: 0,
  })
  const all = make('Alle')
  const per = new Map<string, WinTypeStat>()
  for (const { game, result } of rows) {
    if (!result.winner) continue
    let s = per.get(result.player)
    if (!s) per.set(result.player, (s = make(result.player)))
    for (const t of [all, s]) {
      t.total++
      t.byCategory[game.winCategory]++
      if (game.winnerHadSupport) t.withSupport++
    }
  }
  return { overall: all, players: [...per.values()].sort((a, b) => b.total - a.total) }
}

// ---------------------------------------------------------------- records

export interface StreakRecord {
  player: string
  length: number
  ongoing: boolean
}

function longestStreak(rows: Row[], won: boolean): StreakRecord | null {
  const byPlayer = new Map<string, Row[]>()
  for (const r of rows) byPlayer.set(r.result.player, [...(byPlayer.get(r.result.player) ?? []), r])
  let best: StreakRecord | null = null
  for (const [player, list] of byPlayer) {
    let run = 0
    list.forEach((r, i) => {
      run = r.result.winner === won ? run + 1 : 0
      const ongoing = i === list.length - 1
      if (run > 0 && (!best || run > best.length || (run === best.length && ongoing))) best = { player, length: run, ongoing }
    })
  }
  return best
}

export interface GameRecord {
  game: Game
  value: number
  ties: number
}

function extreme(games: Game[], value: (g: Game) => number, dir: 'max' | 'min'): GameRecord | null {
  if (!games.length) return null
  const sign = dir === 'max' ? 1 : -1
  let best: Game | null = null
  let bestVal = -Infinity
  let ties = 0
  for (const g of games) {
    const v = sign * value(g)
    if (v > bestVal) {
      best = g
      bestVal = v
      ties = 1
    } else if (v === bestVal) {
      best = g // latest wins the tie (games are chronological)
      ties++
    }
  }
  return best ? { game: best, value: sign * bestVal, ties } : null
}

export const margin = (g: Game) => (g.results[0]?.vp ?? 0) - (g.results[1]?.vp ?? 0)

export interface Records {
  winStreak: StreakRecord | null
  lossStreak: StreakRecord | null
  biggestWin: GameRecord | null
  closest: GameRecord | null
  quickest: GameRecord | null
  longest: GameRecord | null
  mostRounds: GameRecord | null
  /** most often finished one point short of victory */
  nearMiss: { player: string; count: number; total: number } | null
}

export function records(games: Game[], rows: Row[]): Records {
  const nearMisses = rows.filter(({ game, result }) => !result.winner && result.vp === game.maxVp - 1)
  const top = [...countBy(nearMisses, (r) => r.result.player).entries()].sort((a, b) => b[1] - a[1])[0]

  return {
    nearMiss: top ? { player: top[0], count: top[1], total: nearMisses.length } : null,
    winStreak: longestStreak(rows, true),
    lossStreak: longestStreak(rows, false),
    biggestWin: extreme(games, margin, 'max'),
    closest: extreme(games, margin, 'min'),
    quickest: extreme(games, (g) => g.days, 'min'),
    longest: extreme(games, (g) => g.days, 'max'),
    mostRounds: extreme(games, (g) => g.rounds, 'max'),
  }
}

// ---------------------------------------------------------------- misc

export function countBy<T, K>(items: T[], key: (t: T) => K): Map<K, number> {
  const out = new Map<K, number>()
  for (const item of items) out.set(key(item), (out.get(key(item)) ?? 0) + 1)
  return out
}

export const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
