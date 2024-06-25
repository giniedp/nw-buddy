import micromatch from 'micromatch'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { Entry } from 'yauzl'
import { decompressEntry } from '../file-formats/pak/decompress'
import { oodleLibrary } from '../file-formats/pak/oodle'
import { glob } from '../utils/file-utils'
import { runTasks } from '../worker/runner'
import { GameFs } from './game-fs'

export interface PakFileSystemOptions {
  gameDir: string
  files?: string[]
  oodleDir?: string
}

export async function pakFileSystem({ gameDir, files, oodleDir }: PakFileSystemOptions): Promise<GameFs> {
  const pakFiles: PakFile[] = []
  const oodle = oodleLibrary(oodleDir || 'tools/bin')

  async function init() {
    if (pakFiles.length) {
      return
    }

    if (!files) {
      files = await glob('**/*.pak', {
        cwd: gameDir,
      })
    }

    await createIndex(gameDir, files).then((result) => {
      pakFiles.push(...result)
    })
  }

  async function dispose() {
    for (const pakFile of pakFiles) {
      fs.closeSync(pakFile.fd)
    }
  }

  async function readFile(path: string) {
    for (const pak of pakFiles) {
      const entry = pak.entries.get(path)
      if (!entry) {
        continue
      }
      return decompressEntry(pak.fd, entry, oodle)
    }
    throw new Error(`File not found: ${path}`)
  }

  async function globIntern(pattern: string | string[]) {
    const result: Array<string[]> = []
    for (const pak of pakFiles) {
      const list = Array.from(pak.entries.keys())
      const matches = micromatch(list, pattern, {
        nocase: true,
      })
      result.push(matches)
    }
    return result.flat()
  }

  async function stats(path: string) {
    const result = []
    // for (const pak of pakFiles) {
    //   const entry = pak.entries.get(path)
    //   if (!entry) {
    //     continue
    //   }
    //   result.push({
    //     path: entry.fileName,
    //     size: entry.uncompressedSize,
    //     compressedSize: entry.compressedSize,
    //     compressed: entry.isCompressed(),
    //     encrypted: entry.isEncrypted(),
    //     method: entry.compressionMethod,
    //   })
    // }
    return result
  }
  await init()
  return {
    readFile,
    glob: globIntern,
    stats,
  }
}

interface PakFile {
  fd: number
  file: string
  entries: Map<string, Entry>
}

async function createIndex(gameDir: string, files: string[]) {
  const result: PakFile[] = []
  await runTasks({
    label: 'Pak Init',
    taskName: 'readPakIndex',
    threads: os.cpus().length,
    tasks: files.map((file) => {
      return {
        gameDir,
        file,
      }
    }),
    onTaskFinish: async ({ file, entries }) => {
      for (let i = 0; i < entries.length; i++) {
        const entry = new Entry()
        Object.assign(entry, entries[i])
        entries[i] = entry
      }
      const pakFile = path.join(gameDir, file)
      const fd = fs.openSync(pakFile, 'r')
      result.push({
        fd,
        file: pakFile,
        entries: new Map(entries.map((it) => [it.fileName, it])),
      })
    },
  })

  return result
}
