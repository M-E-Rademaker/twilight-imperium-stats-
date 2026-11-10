import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildDataset } from '../../build/buildDataset'
import type { Game, Result } from '../data/types'
import { buildScope, EMPTY_FILTERS, filtersFromParams, filtersToParams, type Filters } from './filters'
import { headToHead, playerStats, records, seatStats, winRateTimeline, WIN_RATE_WARMUP } from './stats'

let n = 0
function game(results: [string, string, number][], extra: Partial<Game> = {}): Game {
  n++
  const sorted = [...results].sort((a, b) => b[2] - a[2])
  const rs: Result[] = sorted.map(([player, faction, vp], i) => ({
    player,
    faction,
    vp,
    seat: i + 1,
    rank: 1 + sorted.filter((o) => o[2] > vp).length,
    winner: vp >= 10,
  }))
  return {
    id: `g${n}`,
    index: n,
    name: `Game ${n}`,
    start: `2024-01-${String(n).padStart(2, '0')}`,
    end: `2024-01-${String(n).padStart(2, '0')}`,
    days: 0,
    rounds: 5,
    maxVp: 10,
    nPlayers: rs.length,
    winCategory: 'Statusphase',
    winnerHadSupport: false,
    medium: 'online',
    description: null,
    winner: rs.find((r) => r.winner)!.player,
    results: rs,
    ...extra,
  }
}

const f = (patch: Partial<Filters>): Filters => ({ ...EMPTY_FILTERS, ...patch })

const games = [
  game([['A', 'Saar', 10], ['B', 'Sol', 8], ['C', 'Yin', 6]]),
  game([['A', 'Sol', 9], ['B', 'Saar', 10], ['C', 'Yin', 9], ['D', 'Hacan', 4]]),
  game([['A', 'Saar', 10], ['B', 'Yin', 7], ['C', 'Sol', 7]]),
]

describe('buildScope', () => {
  it('table filter requires all listed players; exact requires the same line-up', () => {
    expect(buildScope(games, f({ table: ['A', 'B'] })).games).toHaveLength(3)
    expect(buildScope(games, f({ table: ['A', 'B', 'C'], exact: true })).games.map((g) => g.id)).toEqual(['g1', 'g3'])
  })

  it('faction focus counts only results played with that faction', () => {
    const scope = buildScope(games, f({ factions: ['Saar'] }))
    expect(scope.rows.map((r) => `${r.result.player}:${r.result.faction}`)).toEqual(['A:Saar', 'B:Saar', 'A:Saar'])
    const [a] = playerStats(scope.rows)
    expect(a).toMatchObject({ player: 'A', games: 2, wins: 2 })
  })

  it('round-trips through URL params', () => {
    const filters = f({ players: ['A'], table: ['A', 'B'], exact: true, factions: ["Vuil'Raith"], counts: [3], vp: [14], years: [2025] })
    expect(filtersFromParams(new URLSearchParams(filtersToParams(filters).toString()))).toEqual(filters)
  })
})

describe('stats', () => {
  const { rows } = buildScope(games, EMPTY_FILTERS)

  it('computes expected wins from table size', () => {
    const b = playerStats(rows).find((p) => p.player === 'B')!
    expect(b.games).toBe(3)
    expect(b.wins).toBe(1)
    expect(b.expectedRate).toBeCloseTo((1 / 3 + 1 / 4 + 1 / 3) / 3)
    expect(b.wae).toBeCloseTo(1 - (1 / 3 + 1 / 4 + 1 / 3))
  })

  it('head to head counts finishing order with ties as half', () => {
    const h2h = headToHead(games, ['A', 'B', 'C'])
    expect(h2h.get('A')!.get('C')).toEqual({ shared: 3, ahead: 2.5, wins: 2 })
    expect(h2h.get('B')!.get('C')).toEqual({ shared: 3, ahead: 2.5, wins: 1 })
  })

  it('win-rate curve starts only after the warm-up', () => {
    const many = Array.from({ length: WIN_RATE_WARMUP + 1 }, () => game([['A', 'Saar', 10], ['B', 'Sol', 1], ['C', 'Yin', 1]]))
    const points = winRateTimeline(buildScope(many, EMPTY_FILTERS).rows)
    expect(points.findIndex((p) => p.wr.A !== undefined)).toBe(WIN_RATE_WARMUP - 1)
    expect(points[0]!.wae.A).toBeCloseTo(2 / 3)
  })

  it('finds streaks and near misses', () => {
    const r = records(games, rows)
    expect(r.winStreak).toEqual({ player: 'A', length: 1, ongoing: true })
    expect(r.lossStreak?.player).toBe('C')
    expect(r.nearMiss).toEqual({ player: 'A', count: 1, total: 2 })
  })

  it('seat stats aggregate by starting position', () => {
    expect(seatStats(rows).map((s) => s.seat)).toEqual([1, 2, 3, 4])
  })
})

describe('real data sanity', () => {
  const read = (name: string) => readFileSync(new URL(`../../../data/${name}.csv`, import.meta.url), 'utf8')
  const ds = buildDataset({ games: read('games'), results: read('results'), factions: read('factions') })
  const first56 = ds.games.slice(0, 56)

  it('reproduces the numbers from the review (first 56 games)', () => {
    const stats = playerStats(buildScope(first56, EMPTY_FILTERS).rows)
    const eric = stats.find((s) => s.player === 'Eric')!
    expect(eric.games).toBe(55)
    expect(eric.wins).toBe(20)
    expect(eric.wae).toBeCloseTo(3.3, 1)
  })
})
