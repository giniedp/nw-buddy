import * as fs from 'fs'
import * as sharp from 'sharp'

export async function importImage({ input, output, update }: { input: string; output: string; update?: boolean }) {
  if (!fs.existsSync(input)) {
    return
  }
  if (!update && fs.existsSync(output)) {
    return
  }
  await sharp(input)
    .webp({
      quality: 85,
    })
    .toFile(output)
}
