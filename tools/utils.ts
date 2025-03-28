import fastGlob from 'fast-glob'
import fs from 'node:fs'
import path from 'node:path'
import { ZodSchema } from 'zod'

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

export async function readJSONFile<T>(input: string, schema?: ZodSchema<T>) {
  const data = await fs.promises.readFile(input, { encoding: 'utf-8' })
  const json = JSON.parse(data)
  if (schema) {
    return schema.parse(json)
  }
  return json as T
}

export async function writeJSONFile<T extends Object>(
  data: T,
  options: {
    target: string
    serialize?: (input: T) => Promise<string | NodeJS.ArrayBufferView> | string | NodeJS.ArrayBufferView
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
export async function writeFile(
  data: string | NodeJS.ArrayBufferView,
  options: {
    target: string
    createDir: boolean
    encoding: BufferEncoding
  },
) {
  const outFile = options.target
  if (options?.createDir) {
    fs.mkdirSync(path.dirname(outFile), { recursive: true })
  }
  return fs.writeFileSync(outFile, data, {
    encoding: options.encoding,
  })
}
