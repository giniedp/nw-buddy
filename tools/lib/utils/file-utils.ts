import fastGlob from 'fast-glob'
import fs from 'node:fs'
import path from 'node:path'
import { ZodSchema } from 'zod'

export async function mkdir(dirPath: string, options?: fs.MakeDirectoryOptions) {
  return fs.promises.mkdir(dirPath, options)
}

export async function copyFile(input: string, output: string, options?: { createDir: boolean }) {
  if (options?.createDir) {
    await mkdir(path.dirname(output), { recursive: true })
  }
  return fs.promises.copyFile(input, output)
}

export async function readJSONFile<T>(input: string, schema?: ZodSchema<T>) {
  const data = await fs.promises.readFile(input, { encoding: 'utf-8' })
  const json = JSON.parse(data)
  if (schema) {
    return schema.parse(json)
  }
  return json as T
}

export async function writeFile(
  data: string | Buffer,
  options: {
    target: string
    createDir: boolean
    encoding: BufferEncoding
  },
) {
  const outFile = options.target
  if (options?.createDir) {
    await mkdir(path.dirname(outFile), { recursive: true })
  }
  return fs.promises.writeFile(outFile, data, {
    encoding: options.encoding,
  })
}

export async function writeJSONFile<T extends Object>(
  data: T,
  options: {
    target: string
    serialize?: (input: T) => Promise<string | Buffer> | string | Buffer
    createDir?: boolean
  },
) {
  const dataOut = await Promise.resolve(options.serialize ? options.serialize(data) : JSON.stringify(data, null, 1))
  return writeFile(dataOut, {
    encoding: 'utf-8',
    target: options.target,
    createDir: options.createDir,
  })
}

export async function writeUTF8File(data: string | Buffer, options: { target: string; createDir: boolean }) {
  return writeFile(data, { ...options, encoding: 'utf-8' })
}

export function replaceExtname(file: string, extname: string) {
  const dirName = path.dirname(file)
  const baseName = path.basename(file, path.extname(file))
  return path.join(dirName, baseName + extname)
}

export async function glob(pattern: string | string[], options?: fastGlob.Options): Promise<string[]> {
  options = options || {}
  options.caseSensitiveMatch = options.caseSensitiveMatch ?? false
  pattern = Array.isArray(pattern) ? pattern : [pattern]
  pattern = pattern.map((it) => it.replace(/\\/gi, '/'))
  const negative = pattern.filter((it) => it.startsWith('!')).map((it) => it.substring(1))
  const positive = pattern.filter((it) => !it.startsWith('!'))
  const result = await fastGlob(positive, options)
  if (!negative.length) {
    return result
  }
  const exclude = new Set(await fastGlob(negative, options))
  return result.filter((it) => !exclude.has(it))
}

export function normalizePath(value: string) {
  return path.normalize(value).toLowerCase().split(path.sep).join('/')
}
