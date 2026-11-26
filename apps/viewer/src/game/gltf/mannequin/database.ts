import { parseAnimationDatabase, type AdbDocument } from '../../../formats/mannequin'

/**
 * A database file of a character: the root `.adb` or one of its sub databases
 */
export interface AdbFile {
  /**
   * Game path, lower case
   */
  file: string
  /**
   * The tags the file applies under: its own and those of the databases that include it (`SubADB Tags`)
   */
  tags: string[]
  document: AdbDocument
}

/**
 * Loads an animation database and its sub databases, the root first, each file once
 *
 * @param file - game path of the root `.adb`
 * @param read - the text of a game path (lower case), e.g. fetched below a models root
 * @throws when the root does not load; sub databases that fail are left out
 */
export async function loadAdbFiles(file: string, read: (file: string) => Promise<string>): Promise<AdbFile[]> {
  const result: AdbFile[] = []
  const done = new Set<string>()
  let pending: Array<{ file: string; tags: string[] }> = [{ file: file.toLowerCase(), tags: [] }]
  while (pending.length) {
    const level = pending.filter((it) => {
      if (done.has(it.file)) {
        return false
      }
      done.add(it.file)
      return true
    })
    pending = []
    const documents = await Promise.all(
      level.map(async (it) => {
        try {
          return parseAnimationDatabase(await read(it.file))
        } catch (error) {
          if (it.file === file.toLowerCase()) {
            throw error
          }
          console.warn('sub database not loaded', it.file)
          return null
        }
      }),
    )
    level.forEach((it, index) => {
      const document = documents[index]
      if (!document) {
        return
      }
      result.push({ file: it.file, tags: it.tags, document })
      for (const sub of document.subDatabases) {
        if (sub.file) {
          pending.push({ file: sub.file.toLowerCase(), tags: [...it.tags, ...sub.tags] })
        }
      }
    })
  }
  return result
}
