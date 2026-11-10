import { useEffect } from 'react'
import { Award, CalendarDays, ChevronLeft, ChevronRight, Hourglass, Link2, Repeat, Target, Trophy, Users } from 'lucide-react'
import type { Game } from '../data/types'
import { faction } from '../data'
import { fmtDate, plural } from '../lib/format'
import { playerColor } from '../lib/players'
import { FactionIcon, Modal, ModalHeader } from './ui'
import type { ReactNode } from 'react'

interface Props {
  game: Game | null
  /** the list prev/next navigates through (current scope, chronological) */
  sequence: Game[]
  onNavigate: (id: string) => void
  onClose: () => void
}

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-space/50 px-3 py-2">
      <span className="text-purple-300">{icon}</span>
      <div className="min-w-0">
        <div className="text-[11px] text-ink-3">{label}</div>
        <div className="truncate text-sm font-medium text-ink">{value}</div>
      </div>
    </div>
  )
}

export function GameDetails({ game, sequence, onNavigate, onClose }: Props) {
  const pos = game ? sequence.findIndex((g) => g.id === game.id) : -1
  const prev = pos > 0 ? sequence[pos - 1] : undefined
  const next = pos >= 0 && pos < sequence.length - 1 ? sequence[pos + 1] : undefined

  useEffect(() => {
    if (!game) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && prev) onNavigate(prev.id)
      if (e.key === 'ArrowRight' && next) onNavigate(next.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [game, prev, next, onNavigate])

  return (
    <Modal open={!!game} onClose={onClose} labelledBy="game-title" wide>
      {game && (
        <>
          <ModalHeader
            id="game-title"
            onClose={onClose}
            actions={
              <button
                onClick={() => navigator.clipboard?.writeText(window.location.href)}
                className="-m-1 rounded-lg p-2 text-ink-3 hover:bg-white/5 hover:text-ink"
                title="Link kopieren"
                aria-label="Link zu diesem Spiel kopieren"
              >
                <Link2 size={18} />
              </button>
            }
          >
            <p className="font-display text-[11px] tracking-widest text-purple-300 uppercase">Spiel #{game.index}</p>
            <h3 className="mt-0.5 text-xl font-semibold text-ink">{game.name}</h3>
          </ModalHeader>

          <div className="scrollbar-thin overflow-y-auto overscroll-contain p-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Fact icon={<CalendarDays size={16} />} label="Zeitraum" value={`${fmtDate(game.start)} – ${fmtDate(game.end)}`} />
              <Fact icon={<Hourglass size={16} />} label="Dauer" value={plural(game.days, 'Tag', 'Tage')} />
              <Fact icon={<Repeat size={16} />} label="Runden" value={game.rounds} />
              <Fact icon={<Users size={16} />} label="Spieler" value={game.nPlayers} />
              <Fact icon={<Target size={16} />} label="Siegpunkte" value={`${game.maxVp} VP`} />
              <Fact icon={<Award size={16} />} label="Sieg in" value={`${game.winCategory}${game.winnerHadSupport ? ' · mit Support' : ''}`} />
            </div>

            {game.description && (
              <blockquote className="mt-4 rounded-xl border-l-2 border-gold bg-gold/5 px-4 py-3 text-sm text-ink-2">
                <span className="mb-1 block text-xs text-ink-3">So wurde gewonnen</span>
                {game.description}
              </blockquote>
            )}

            <h4 className="mt-5 mb-2 text-xs font-semibold tracking-wider text-purple-200 uppercase">Ergebnis</h4>
            <ol className="space-y-2">
              {game.results.map((r) => (
                <li
                  key={r.player}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                    r.winner ? 'border border-gold/60 bg-gradient-to-r from-gold/15 to-transparent' : 'bg-space/50'
                  }`}
                >
                  <span className="w-6 text-center font-display text-lg text-ink-3 tabular">
                    {r.winner ? <Trophy size={20} className="mx-auto text-gold" /> : r.rank}
                  </span>
                  <FactionIcon id={r.faction} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 font-semibold text-ink">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: playerColor(r.player) }} />
                      {r.player}
                    </div>
                    <div className="truncate text-xs text-ink-3">
                      {faction(r.faction).name} · Startplatz {r.seat}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-semibold text-ink tabular">{r.vp}</div>
                    <div className="h-1 w-14 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, (r.vp / game.maxVp) * 100)}%`, backgroundColor: playerColor(r.player) }} />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-line p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              disabled={!prev}
              onClick={() => prev && onNavigate(prev.id)}
              className="inline-flex min-h-10 items-center gap-1 rounded-lg px-3 text-sm text-ink-2 hover:bg-white/5 disabled:opacity-30"
            >
              <ChevronLeft size={18} /> Älter
            </button>
            <span className="text-xs text-ink-3 tabular">{pos >= 0 ? `${pos + 1} / ${sequence.length}` : ''}</span>
            <button
              disabled={!next}
              onClick={() => next && onNavigate(next.id)}
              className="inline-flex min-h-10 items-center gap-1 rounded-lg px-3 text-sm text-ink-2 hover:bg-white/5 disabled:opacity-30"
            >
              Neuer <ChevronRight size={18} />
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}
