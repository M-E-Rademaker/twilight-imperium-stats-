import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildDataset } from './buildDataset'
import { parseCsv } from './csv'

const factions = 'faction,full_name,icon\nSaar,The Clan of Saar,Saar\nSol,The Federation of Sol,\nYin,The Yin Brotherhood,Yin\n'
const games =
  'game_id,game_name,start_date,end_date,rounds,max_victory_points,win_category,winner_had_support,game_medium,win_description\n' +
  'b,"Second, game",2024-02-01,2024-02-10,5,10,Aktionsphase,1,online,\n' +
  'a,First,2024-01-01,2024-01-05,6,10,Statusphase,0,online,"He said ""hi"""\n'
const results =
  'game_id,player_name,faction,victory_points,starting_position\n' +
  'a,Manu,Saar,10,2\na,Eric,Sol,8,1\na,Thomas,Yin,8,3\n' +
  'b,Manu,Sol,7,1\nb,Eric,Yin,10,2\nb,Thomas,Saar,9,3\n'

describe('parseCsv', () => {
  it('handles quotes, escaped quotes, commas and CRLF', () => {
    expect(parseCsv('a,b\r\n"x, y","say ""hi"""\r\n')).toEqual([{ a: 'x, y', b: 'say "hi"' }])
  })
})

describe('buildDataset', () => {
  const ds = buildDataset({ games, results, factions })

  it('sorts games chronologically and numbers them', () => {
    expect(ds.games.map((g) => [g.id, g.index])).toEqual([['a', 1], ['b', 2]])
  })

  it('derives winner, ranks with ties, duration and description', () => {
    const a = ds.games[0]!
    expect(a.winner).toBe('Manu')
    expect(a.results.map((r) => [r.player, r.rank])).toEqual([['Manu', 1], ['Eric', 2], ['Thomas', 2]])
    expect(a.days).toBe(4)
    expect(a.description).toBe('He said "hi"')
    expect(ds.games[1]!.winnerHadSupport).toBe(true)
  })

  it('falls back to the faction id as icon name', () => {
    expect(ds.factions.Sol!.icon).toBe('Sol')
  })

  it('rejects inconsistent data with readable messages', () => {
    const bad = results.replace('b,Eric,Yin,10,2', 'b,Eric,Nope,9,2')
    expect(() => buildDataset({ games, results: bad, factions })).toThrow(/unknown faction "Nope"[\s\S]*exactly one player/)
    expect(() => buildDataset({ games, results: results + 'zzz,Manu,Saar,1,1\n', factions })).toThrow(/"zzz" not found/)
    expect(() => buildDataset({ games, results, factions }, { iconExists: () => false })).toThrow(/no icon file/)
  })
})

describe('real data', () => {
  const read = (f: string) => readFileSync(new URL(`../../data/${f}.csv`, import.meta.url), 'utf8')

  it('is valid and every game has exactly one winner', () => {
    const ds = buildDataset({ games: read('games'), results: read('results'), factions: read('factions') })
    expect(ds.games.length).toBeGreaterThanOrEqual(56)
    for (const g of ds.games) expect(g.results.filter((r) => r.winner)).toHaveLength(1)
    expect(ds.players.slice(0, 3).sort()).toEqual(['Eric', 'Manu', 'Thomas'])
  })
})
