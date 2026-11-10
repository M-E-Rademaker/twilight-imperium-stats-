import { useCallback, useEffect, useRef, useState } from 'react'
import { filtersFromParams, filtersToParams, type Filters } from '../lib/filters'

function read() {
  const params = new URLSearchParams(window.location.search)
  return { filters: filtersFromParams(params), game: params.get('g') }
}

function buildUrl(filters: Filters, game: string | null): string {
  const params = filtersToParams(filters, new URLSearchParams(window.location.search))
  if (game) params.set('g', game)
  else params.delete('g')
  const qs = params.toString().replaceAll('%2C', ',')
  return `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`
}

/**
 * Filters and the opened game live in the URL, so every view can be shared
 * as a link. Opening a game from the page pushes a history entry, so the
 * browser's back button (or swipe-back on iOS) closes it again.
 */
export function useUrlState() {
  const [filters, setFilters] = useState(() => read().filters)
  const [game, setGame] = useState(() => read().game)
  const pushNext = useRef(false)
  const pushedGame = useRef(false)

  useEffect(() => {
    const url = buildUrl(filters, game)
    if (url === `${window.location.pathname}${window.location.search}${window.location.hash}`) return
    if (pushNext.current) {
      window.history.pushState(null, '', url)
      pushedGame.current = true
    } else {
      window.history.replaceState(null, '', url)
    }
    pushNext.current = false
  }, [filters, game])

  useEffect(() => {
    const onPop = () => {
      const s = read()
      pushedGame.current = false
      setFilters(s.filters)
      setGame(s.game)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const openGame = useCallback(
    (id: string) => {
      if (!game) pushNext.current = true
      setGame(id)
    },
    [game],
  )

  const closeGame = useCallback(() => {
    if (pushedGame.current) window.history.back() // popstate clears the game
    else setGame(null)
  }, [])

  return { filters, setFilters, game, openGame, closeGame }
}
