# TI4 Stats – project notes

Static dashboard for our Twilight Imperium group (Manu, Thomas, Eric, Frank, occasionally Steve/Starki).
Live: https://ti-stats-dashboard.netlify.app · Netlify site `ti-stats-dashboard`, base directory `website/`.
UI language is **German**; code, comments and commit messages are English.

## Layout

```
data/                 source of truth (UTF-8 CSV, LF, comma separated)
  games.csv           one row per game (win_category: Statusphase|Aktionsphase|Agendaphase)
  results.csv         one row per player per game
  factions.csv        faction id, full name, icon file name
scripts/
  update_ti_stats.py  scraper: twilightwars.com -> appends to the CSVs, commits, pushes
.github/workflows/update-data.yml   runs the scraper daily (secrets TW_EMAIL, TW_PASSWORD)
website/
  build/              Vite plugin: parses + validates CSVs at build time -> `virtual:ti-data`
  src/data/           types + dataset access
  src/lib/            pure logic: filters.ts (scope + URL state), stats.ts, format.ts, players.ts
  src/components/     one file per dashboard card; ui.tsx holds shared primitives
  public/icons/factions/*.webp   128px faction icons, name = factions.csv `icon`
```

## Commands (in `website/`)

- `npm run dev` – dev server; edits to `../data/*.csv` reload the page
- `npm run check` – typecheck + lint + tests (run before committing)
- `npm run build` – production build (also validates the data)

## Domain rules

- Winner = player with `victory_points >= max_victory_points`; the build fails unless every game has exactly one.
- **Wins above expectation** (`wae`) is the headline metric: wins − Σ 1/players-in-game. Raw win rates are not comparable across 3- and 6-player games.
- Filters: *Fokus* (players / factions) restricts which results count; *Am Tisch*, player count, VP and year restrict which games count. See `buildScope` in `src/lib/filters.ts`.
- Small samples are flagged, never hidden: players < 5 games, factions/seats < 3 games (`MIN_*` in stats.ts). Win-rate curve starts after 5 games per player.
- Player colors live only in `src/lib/players.ts`; they were validated for color-blind separation on the dark surface. Change them only with the dataviz palette validator.

## Adding data

- Normally automatic (GitHub Action) or `python scripts/update_ti_stats.py` locally (needs `.env` with TW_EMAIL/TW_PASSWORD, see `.env.example`).
- New faction: add a row to `data/factions.csv` **and** an icon `website/public/icons/factions/<icon>.webp`.
- Excluded games and the core-player rule (Manu + Thomas + Eric must play) are constants in the scraper.
- Never commit credentials. The repo is public.
