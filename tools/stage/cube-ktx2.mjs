// BC6H cube DDS → RGB9E5 KTX2 (raw, no supercompression: gglib transcodes only Basis files), mips kept as they are.
// Decodes with cube2e5 (Go, nwbt's BC6H decoder), packs with `ktx create --raw` (KTX-Software).
//
//   node tools/stage/cube-ktx2.mjs <in.dds> <out.ktx2>
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

const HERE = dirname(new URL(import.meta.url).pathname).replace(/^\/(\w:)/, '$1')

/**
 * The KTX2 file of a BC6H cube DDS
 */
export function cubeToKtx2(dds) {
  const work = mkdtempSync(join(tmpdir(), 'cube-ktx2-'))
  try {
    const input = join(work, 'in.dds')
    writeFileSync(input, dds)
    const decoded = run('go', ['-C', join(HERE, 'cube2e5'), 'run', '.', input, join(work, 'faces')], {
      GOWORK: 'off',
    })
    const [width, height, levels] = decoded.trim().split(/\s+/).map(Number)
    // ktx takes the raw images level by level, face by face
    const files = []
    for (let level = 0; level < levels; level++) {
      for (let face = 0; face < 6; face++) {
        files.push(join(work, 'faces', `${level}_${face}.raw`))
      }
    }
    const output = join(work, 'out.ktx2')
    run('ktx', [
      'create',
      '--raw',
      '--format',
      'E5B9G9R9_UFLOAT_PACK32',
      '--cubemap',
      '--width',
      String(width),
      '--height',
      String(height),
      '--levels',
      String(levels),
      '--assign-tf',
      'linear',
      ...files,
      output,
    ])
    const ktx2 = readFileSync(output)
    checkLevels(ktx2, files, levels)
    return ktx2
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
}

/**
 * Each level of the KTX2 file holds its six faces in order
 */
function checkLevels(ktx2, files, levels) {
  for (let level = 0; level < levels; level++) {
    const offset = Number(ktx2.readBigUInt64LE(80 + level * 24))
    const faces = Buffer.concat(files.slice(level * 6, level * 6 + 6).map((it) => readFileSync(it)))
    if (!faces.equals(ktx2.subarray(offset, offset + faces.length))) {
      throw new Error(`KTX2 level ${level} differs from its faces`)
    }
  }
}

function run(command, args, env = {}) {
  const res = spawnSync(command, args, { encoding: 'utf8', env: { ...process.env, ...env } })
  if (res.status !== 0) {
    throw new Error(`${command} failed (${res.status}): ${res.stderr || res.error}`)
  }
  return res.stdout
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(HERE, 'cube-ktx2.mjs')) {
  const [input, output] = process.argv.slice(2)
  writeFileSync(output, cubeToKtx2(readFileSync(input)))
  console.log(output)
}
