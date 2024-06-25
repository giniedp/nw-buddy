import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

export async function convertPngToWebp({ input, output, update }: { input: string; output: string; update?: boolean }) {
  if (!fs.existsSync(input)) {
    return
  }
  if (!update && fs.existsSync(output)) {
    return
  }
  fs.mkdirSync(path.dirname(output), { recursive: true })
  await sharp(input)
    .webp({
      quality: 85,
    })
    .toFile(output)
}
