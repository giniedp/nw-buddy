import * as fs from 'fs'
import * as path from 'path'
import * as fastGlob from 'fast-glob'

export function glob(pattern: string | string[], options?: fastGlob.Options): Promise<string[]> {
  pattern = (Array.isArray(pattern) ? pattern : [pattern]).map((it) => it.replace(/\\/gi, '/'))
  return fastGlob(pattern, options)
}

export async function mkdir(dirPath: string, options?: fs.MakeDirectoryOptions) {
  const stat = await fs.promises.stat(dirPath).catch(() => null as fs.Stats)
  if (stat?.isDirectory()) {
    return
  }
  return new Promise<void>((resolve, reject) => {
    fs.mkdir(dirPath, options, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

export async function copyFile(input: string, output: string, options?: { createDir: boolean }) {
  if (options?.createDir) {
    await mkdir(path.dirname(output), { recursive: true })
  }
  return fs.promises.copyFile(input, output)
}

export async function copyJSONFile(input: string, output: string, options?: { createDir: boolean }) {
  if (options?.createDir) {
    await mkdir(path.dirname(output), { recursive: true })
  }
  const data = await fs.promises.readFile(input)
  const dataOut = JSON.stringify(JSON.parse(data.toString('utf-8')), null, 1)
  return fs.promises.writeFile(output, dataOut, 'utf-8')
}

export async function readJSONFile<T>(input: string) {
  const data = await fs.promises.readFile(input, { encoding: 'utf-8' })
  return JSON.parse(data) as T
}


export async function writeJSONFile(data: any, output: string, options?: { createDir: boolean }) {
  if (options?.createDir) {
    await mkdir(path.dirname(output), { recursive: true })
  }
  const dataOut = JSON.stringify(data, null, 1)
  return fs.promises.writeFile(output, dataOut, 'utf-8')
}

export async function writeFile(data: any, output: string, options?: { createDir: boolean }) {
  if (options?.createDir) {
    await mkdir(path.dirname(output), { recursive: true })
  }
  return fs.promises.writeFile(output, data, 'utf-8')
}

export function renameExtname(file: string, extname: string) {
  const dirName = path.dirname(file)
  const baseName = path.basename(file, path.extname(file))
  return path.join(dirName, baseName + extname)
}
