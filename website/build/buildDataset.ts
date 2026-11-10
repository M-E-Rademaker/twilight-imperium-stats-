import { parseCsv } from './csv.ts'
import { WIN_CATEGORIES, type Dataset, type Faction, type Game, type Result, type WinCategory } from '../src/data/types.ts'

export interface CsvSources {
  games: string
  results: string
  factions: string
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function int(value: string | undefined, what: string): number {
  const n = Number(value)
  if (value === undefined || value === '' || !Number.isInteger(n)) {
    throw new Error(`${what}: expected an integer, got "${value ?? ''}"`)
  }
  return n
}

function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000)
}

/**
 * Turn the three CSV files into the dataset the app consumes.
 * Throws with a readable message on any inconsistency so a broken data
 * commit fails the build instead of silently deploying wrong numbers.
 */
export function buildDataset(src: CsvSources, opts: { iconExists?: (icon: string) => boolean } = {}): Dataset {
  const errors: string[] = []
  const check = (ok: unknown, msg: string) => {
    if (!ok) errors.push(msg)
  }

  const factions: Record<string, Faction> = {}
  for (const row of parseCsv(src.factions)) {
    const id = row.faction ?? ''
    check(id, 'factions.csv: empty faction id')
    check(!factions[id], `factions.csv: duplicate faction "${id}"`)
    const icon = row.icon || id
    if (opts.iconExists) check(opts.iconExists(icon), `factions.csv: no icon file for "${id}" (${icon}.webp)`)
    factions[id] = { id, name: row.full_name || id, icon }
  }

  const resultsByGame = new Map<string, Omit<Result, 'rank' | 'winner'>[]>()
  for (const [i, row] of parseCsv(src.results).entries()) {
    const where = `results.csv line ${i + 2}`
    try {
      const faction = row.faction ?? ''
      check(factions[faction], `${where}: unknown faction "${faction}" (add it to factions.csv)`)
      const list = resultsByGame.get(row.game_id ?? '') ?? []
      list.push({
        player: row.player_name ?? '',
        faction,
        vp: int(row.victory_points, `${where} victory_points`),
        seat: int(row.starting_position, `${where} starting_position`),
      })
      resultsByGame.set(row.game_id ?? '', list)
    } catch (e) {
      errors.push((e as Error).message)
    }
  }

  const games: Game[] = []
  const seen = new Set<string>()
  for (const [i, row] of parseCsv(src.games).entries()) {
    const where = `games.csv line ${i + 2} (${row.game_name || row.game_id})`
    try {
      const id = row.game_id ?? ''
      check(id && !seen.has(id), `${where}: missing or duplicate game_id`)
      seen.add(id)
      const start = row.start_date ?? ''
      const end = row.end_date ?? ''
      check(DATE_RE.test(start) && DATE_RE.test(end), `${where}: dates must be YYYY-MM-DD`)
      check(end >= start, `${where}: end_date before start_date`)
      const maxVp = int(row.max_victory_points, `${where} max_victory_points`)
      const winCategory = row.win_category as WinCategory
      check(WIN_CATEGORIES.includes(winCategory), `${where}: unknown win_category "${row.win_category}"`)

      const raw = resultsByGame.get(id) ?? []
      resultsByGame.delete(id)
      check(raw.length >= 3, `${where}: needs at least 3 results, found ${raw.length}`)
      check(new Set(raw.map((r) => r.player)).size === raw.length, `${where}: a player appears twice`)
      check(new Set(raw.map((r) => r.seat)).size === raw.length, `${where}: duplicate starting_position`)

      const sorted = [...raw].sort((a, b) => b.vp - a.vp || a.seat - b.seat)
      const results: Result[] = sorted.map((r) => ({
        ...r,
        rank: 1 + sorted.filter((o) => o.vp > r.vp).length,
        winner: r.vp >= maxVp,
      }))
      const winners = results.filter((r) => r.winner)
      check(winners.length === 1, `${where}: expected exactly one player with ${maxVp} VP, found ${winners.length}`)

      games.push({
        id,
        index: 0,
        name: row.game_name ?? id,
        start,
        end,
        days: dayDiff(start, end),
        rounds: int(row.rounds, `${where} rounds`),
        maxVp,
        nPlayers: results.length,
        winCategory,
        winnerHadSupport: row.winner_had_support === '1',
        medium: row.game_medium || 'online',
        description: row.win_description || null,
        winner: winners[0]?.player ?? '',
        results,
      })
    } catch (e) {
      errors.push((e as Error).message)
    }
  }

  for (const orphan of resultsByGame.keys()) errors.push(`results.csv: game_id "${orphan}" not found in games.csv`)
  if (errors.length) throw new Error(`Invalid game data:\n  - ${errors.join('\n  - ')}`)

  games.sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end))
  games.forEach((g, i) => (g.index = i + 1))

  const played = new Map<string, number>()
  for (const g of games) for (const r of g.results) played.set(r.player, (played.get(r.player) ?? 0) + 1)
  const players = [...played.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([p]) => p)

  return { games, players, factions, builtAt: new Date().toISOString() }
}
