// Builds the transmog editor's stage (character/stage.glb) from the game files, see README.md.
//   node tools/stage/build.mjs [--from=export|process|analyze|shrink|publish] [--out=<models root>] [--accept-export]
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cubeToKtx2 } from './cube-ktx2.mjs'
import { embedKtx2Textures, readGlb, readGlbJson, writeGlb } from './glb-json.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '../..')
const WORK = join(ROOT, '.nwbt/stage')
const NWBT = process.env.NWBT_URL || 'http://127.0.0.1:8000'
const config = JSON.parse(readFileSync(join(HERE, 'config.json'), 'utf8'))

const option = (name) => process.argv.find((it) => it.startsWith(`--${name}=`))?.slice(name.length + 3)
const STEPS = ['export', 'process', 'analyze', 'shrink', 'publish']
const from = option('from') || 'export'
if (!STEPS.includes(from)) {
  throw new Error(`--from: one of ${STEPS.join(', ')}`)
}
const OUT = option('out') || join(ROOT, 'dist/nw-cdn/models')

const files = {
  png: join(WORK, 'png', config.export.file),
  dds: join(WORK, 'dds', config.export.file),
  trimmed: join(WORK, 'stage-trimmed.glb'),
  analysis: join(WORK, 'analysis.json'),
  small: join(WORK, 'stage-small.glb'),
}
const actions = {
  export: () => {
    exportLevel(join(WORK, 'png'), [])
    // only for the formats of the textures
    exportLevel(join(WORK, 'dds'), ['--dds', '--texture-size', '64'])
    checkExport()
  },
  process: () => node('process.mjs', files.png, files.trimmed),
  analyze: () => node('analyze.mjs', files.trimmed, files.analysis),
  shrink: () => node('shrink.mjs', files.trimmed, files.analysis, files.dds, files.small),
  publish: () => publish(join(OUT, 'character/stage.glb')),
}
mkdirSync(WORK, { recursive: true })
for (const step of STEPS.slice(STEPS.indexOf(from))) {
  console.log(`== ${step}`)
  const start = Date.now()
  await actions[step]()
  console.log(`== ${step} done in ${Math.round((Date.now() - start) / 1000)} s`)
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd: ROOT, stdio: 'inherit' })
  if (result.status !== 0) {
    throw new Error(`${command} ${args[0]} failed (${result.status ?? result.error})`)
  }
}

function node(script, ...args) {
  run(process.execPath, [join(HERE, script), ...args])
}

function exportLevel(target, extra) {
  const { level, box, exclude, sequence } = config.export
  run('go', [
    'run',
    './tools/nwbt',
    'models',
    'entities',
    '--level',
    level,
    `--box=${box}`,
    ...exclude.flatMap((it) => ['--exclude', it]),
    ...sequence.flatMap((it) => ['--sequence', it]),
    '--binary',
    '--embed',
    '--lights',
    ...extra,
    '-o',
    target,
  ])
}

/**
 * data/frame.json names nodes and materials by their index in the export: a changed export (game patch, nwbt change)
 * must not pass silently. `--accept-export` stores the signature of the current one.
 */
function checkExport() {
  const signature = exportSignature(files.png)
  if (exportSignature(files.dds) !== signature) {
    throw new Error('the png and the dds export differ in their nodes or materials')
  }
  if (process.argv.includes('--accept-export')) {
    config.export.signature = signature
    writeFileSync(join(HERE, 'config.json'), JSON.stringify(config, null, 2) + '\n')
    console.log('export signature stored')
    return
  }
  if (signature !== config.export.signature) {
    throw new Error(
      `the export has other nodes or materials than data/frame.json was made for: rerun blender_frame.py, or check the ` +
        `result and accept it with --accept-export (${signature})`,
    )
  }
}

function exportSignature(file) {
  const json = readGlbJson(file)
  const nodes = json.nodes.map((it) => [it.name, it.mesh != null])
  const materials = json.materials.map((it) => [it.name, it.extensions?.EXT_nw_mtl_ref])
  return createHash('sha1')
    .update(JSON.stringify([nodes, materials]))
    .digest('hex')
}

/**
 * Embeds the cubes of the probes as the viewer loads them (ProbeCubeLoader): the cube with merged mips and its _diff
 * sibling, converted from BC6H to RGB9E5 KTX2 (any WebGPU device). The probe's `cubemapTexture` and
 * `cubemapDiffuseTexture` are their texture indices, `cubemap` stays the game path (the cube's name).
 */
async function publish(target) {
  const source = readFileSync(files.small)
  const diffuseCube = (it) => it.replace(/_cm\.dds$/, '_cm_diff.dds')
  const cubemaps = readGlb(source)
    .json.nodes.map((it) => it.extras?.nwEnvProbe?.cubemap)
    .filter((it) => !!it)
  const names = new Set(cubemaps.flatMap((it) => [it, diffuseCube(it)]))
  const cubes = []
  for (const name of names) {
    cubes.push({ name, data: cubeToKtx2(await download(`${NWBT}/files/${name}?merge=true`)) })
    console.log('cube', name)
  }
  const { json, bin, indices } = embedKtx2Textures(source, cubes)
  for (const node of json.nodes) {
    const probe = node.extras?.nwEnvProbe
    if (probe?.cubemap) {
      probe.cubemapTexture = indices.get(probe.cubemap)
      probe.cubemapDiffuseTexture = indices.get(diffuseCube(probe.cubemap))
    }
  }
  const glb = writeGlb(json, bin)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, glb)
  console.log('stage', target, (glb.length / 1e6).toFixed(2), 'MB')
}

async function download(url) {
  let res
  try {
    res = await fetch(url)
  } catch (err) {
    throw new Error(`${url}: ${err.message} (publish needs nwbt: pnpm dev:nwbt)`)
  }
  if (!res.ok) {
    throw new Error(`${url}: ${res.status}`)
  }
  return Buffer.from(await res.arrayBuffer())
}
