# Twilight Imperium – Gruppenstatistik

Statistik-Dashboard unserer Twilight-Imperium-Runde: **https://ti-stats-dashboard.netlify.app**

- **Rangliste** mit „Siegen über Erwartung“ – fair über 3er- bis 6er-Partien hinweg, inkl. Formkurve
- **Verlauf** der Siege über Erwartung bzw. Win-Rate pro Spieler
- **Fraktionen** mit Win-Rate, Erwartungswert und Detailansicht aller Partien
- **Duelle**: Wer landet wie oft vor wem?
- **Rekorde**, **Aktivität**, **Siegphasen**, **Startposition**, **Spiellänge**
- **Filter** (Fokus-Spieler, Besetzung am Tisch, Fraktion, Spielerzahl, VP, Jahr) – stehen in der URL, Links lassen sich teilen
- Spieldetails mit Vor/Zurück-Navigation, optimiert fürs Handy

## Technik

React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · Recharts · Vitest. Statisch auf Netlify gehostet.

Die Spieldaten liegen als CSV in [`data/`](data). Beim Build liest ein Vite-Plugin die Dateien,
prüft sie (z. B. genau ein Sieger pro Spiel, bekannte Fraktionen) und bettet sie ins Bundle ein.
Fehlerhafte Daten lassen den Build scheitern, statt falsche Zahlen zu veröffentlichen.

## Entwicklung

```bash
cd website
npm install
npm run dev      # http://localhost:5173
npm run check    # Typecheck, Lint, Tests
npm run build
```

Benötigt Node.js ≥ 22.12.

## Neue Spiele

Ein GitHub-Workflow ([`update-data.yml`](.github/workflows/update-data.yml)) prüft täglich twilightwars.com auf
neu beendete Gruppenspiele, ergänzt die CSVs und committet. Netlify baut daraufhin neu.
Manuell auslösbar unter *Actions → Update game data → Run workflow* (optional mit einer Game-ID).

Lokal:

```bash
pip install -r scripts/requirements.txt
python -m playwright install chromium
cp .env.example .env               # Zugangsdaten eintragen – .env wird nie committet
python scripts/update_ti_stats.py  # --dry-run, --no-push, <game_id> siehe --help
```

Spielbeschreibungen („So wurde gewonnen“) können jederzeit direkt in `data/games.csv` in der Spalte
`win_description` ergänzt werden, auch über den GitHub-Editor.
