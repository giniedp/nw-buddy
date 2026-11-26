// Zips the app build (dist/app) into tools/bin/viewer.zip, which nwbt serves at `/` (see tools/nwbt/commands/serve/cmd.go)
// index.html sits at the top of the archive. Usage: node scripts/zip-app.mjs [outFile]
import { zipSync } from 'fflate'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const input = path.join(root, 'dist', 'app')
const output = path.resolve(process.argv[2] || path.join(root, '..', '..', 'tools', 'bin', 'viewer.zip'))

if (!fs.existsSync(path.join(input, 'index.html'))) {
  console.error(`no app build at ${input}, run the app build first`)
  process.exit(1)
}

const files = {}
for (const entry of fs.readdirSync(input, { recursive: true, withFileTypes: true })) {
  // no sourcemaps in the archive, should a build still emit them
  if (!entry.isFile() || entry.name.endsWith('.map')) {
    continue
  }
  const file = path.join(entry.parentPath, entry.name)
  const name = path.relative(input, file).split(path.sep).join('/')
  // already compressed formats are stored as is
  const level = /\.(png|jpe?g|webp|ktx2|zip|gz|br|woff2?)$/i.test(name) ? 0 : 6
  files[name] = [fs.readFileSync(file), { level }]
}

fs.mkdirSync(path.dirname(output), { recursive: true })
const zip = zipSync(files)
fs.writeFileSync(output, zip)
console.log(`${Object.keys(files).length} files, ${(zip.byteLength / 1024 / 1024).toFixed(1)} MB -> ${output}`)
