import path from 'node:path'
import fs from 'node:fs'
import { listPakEntries } from '../file-formats/pak/list-pak-entries'
import { Entry } from 'yauzl'

export async function readPakIndex({
  gameDir,
  file,
}: {
  gameDir: string
  file: string
}): Promise<{ file: string; entries: Entry[] }> {
  const pakFile = path.join(gameDir, file)
  const fd = fs.openSync(pakFile, 'r')
  const entries = await listPakEntries(fd)
  fs.closeSync(fd)

  return {
    file,
    entries,
  }
}
