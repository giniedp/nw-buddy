import * as path from 'path'
import * as fs from 'fs'
import { spawn } from '../../utils/spawn'

export async function importImage({ input, output, update }:{ input: string, output: string, update?: boolean }) {
  if (!fs.existsSync(input)) {
    return
  }
  if (!update && fs.existsSync(output)) {
    return
  }
  const outDir = path.dirname(output)
  await fs.promises.mkdir(outDir, { recursive: true })
  await spawn(process.env.MAGICK_CONVERT_CMD || 'magick convert', [input, '-quality', '85', output], {
    shell: true,
    stdio: 'inherit',
  })
}
