import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import type { Plugin } from 'vite'
import { buildDataset } from './buildDataset.ts'

const VIRTUAL_ID = 'virtual:ti-data'
const RESOLVED_ID = '\0' + VIRTUAL_ID

/**
 * Exposes ../data/*.csv as `import data from 'virtual:ti-data'`.
 * The CSVs are parsed and validated at build time (and on change in dev),
 * so the browser receives ready-to-use JSON inside the bundle.
 */
export function tiData(): Plugin {
  const here = path.dirname(fileURLToPath(import.meta.url))
  const dataDir = path.resolve(here, '../../data')
  const iconDir = path.resolve(here, '../public/icons/factions')
  const files = {
    games: path.join(dataDir, 'games.csv'),
    results: path.join(dataDir, 'results.csv'),
    factions: path.join(dataDir, 'factions.csv'),
  }

  return {
    name: 'ti-data',
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined
    },
    load(id) {
      if (id !== RESOLVED_ID) return
      for (const file of Object.values(files)) this.addWatchFile(file)
      const dataset = buildDataset(
        {
          games: readFileSync(files.games, 'utf8'),
          results: readFileSync(files.results, 'utf8'),
          factions: readFileSync(files.factions, 'utf8'),
        },
        { iconExists: (icon) => existsSync(path.join(iconDir, `${icon}.webp`)) },
      )
      return `export default ${JSON.stringify(dataset)}`
    },
    configureServer(server) {
      server.watcher.add(Object.values(files))
      server.watcher.on('change', (file) => {
        if (!Object.values(files).includes(path.resolve(file))) return
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      })
    },
  }
}
