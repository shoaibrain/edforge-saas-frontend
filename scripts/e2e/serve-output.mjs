/**
 * SPA static server for the consolidated `output/` dir produced by
 * scripts/build-deploy.sh (shell at root + /remotes/<mfe>/). Used by the E2E
 * CI jobs so module-federation REMOTE routes (/academics, /finance, /people)
 * actually load — a shell-only `rsbuild preview` serves no /remotes/*.
 *
 *   bash scripts/build-deploy.sh          # with placeholder VITE_COGNITO_* env
 *   node scripts/e2e/serve-output.mjs output 3000 &
 *   npx wait-on http://localhost:3000
 *
 * Serves real files (incl. remoteEntry.js with correct MIME) and falls back to
 * index.html for client routes (SPA). No dependencies.
 */

import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname, normalize, resolve } from 'node:path'

const ROOT = resolve(process.argv[2] || 'output')
const PORT = Number(process.argv[3] || 3000)
const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.map': 'application/json',
  '.txt': 'text/plain', '.webp': 'image/webp', '.mp4': 'video/mp4',
}

const tryFile = async (p) => {
  try { return (await stat(p)).isFile() ? p : null } catch { return null }
}

createServer(async (req, res) => {
  try {
    const url = decodeURIComponent((req.url || '/').split('?')[0])
    const safe = normalize(url).replace(/^(\.\.[/\\])+/, '')
    let file = await tryFile(join(ROOT, safe))
    // SPA fallback: non-file, non-asset routes → index.html (client router owns them)
    if (!file && !extname(safe)) file = await tryFile(join(ROOT, 'index.html'))
    if (!file) { res.writeHead(404); res.end('not found'); return }
    res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' })
    res.end(await readFile(file))
  } catch {
    res.writeHead(500); res.end('server error')
  }
}).listen(PORT, () => console.log(`[serve-output] ${ROOT} → http://localhost:${PORT}`))
