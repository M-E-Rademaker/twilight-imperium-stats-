export type WinCategory = 'Statusphase' | 'Aktionsphase' | 'Agendaphase'

export const WIN_CATEGORIES: WinCategory[] = ['Statusphase', 'Aktionsphase', 'Agendaphase']

export interface Faction {
  id: string
  name: string
  /** file name (without extension) in public/icons/factions */
  icon: string
}

export interface Result {
  player: string
  faction: string
  vp: number
  /** starting position / speaker order, 1-based */
  seat: number
  /** 1 = winner; equal VP share a rank */
  rank: number
  winner: boolean
}

export interface Game {
  id: string
  /** chronological position, 1-based */
  index: number
  name: string
  start: string // YYYY-MM-DD
  end: string // YYYY-MM-DD
  days: number
  rounds: number
  maxVp: number
  nPlayers: number
  winCategory: WinCategory
  winnerHadSupport: boolean
  medium: string
  description: string | null
  winner: string
  /** sorted by rank, then seat */
  results: Result[]
}

export interface Dataset {
  games: Game[]
  /** sorted by number of games played, descending */
  players: string[]
  factions: Record<string, Faction>
  builtAt: string
}
