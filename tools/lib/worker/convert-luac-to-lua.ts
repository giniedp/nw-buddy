import fs from 'node:fs'
import path from 'node:path'
import { unluac } from '../bin/unluac'
import { replaceExtname } from '../utils'

export type ConvertLuaOptions = {
  file: string
  inputDir: string
  outputDir: string
  jar?: string
}

export async function convertLuacToLua({ file, inputDir, outputDir, jar }: ConvertLuaOptions) {
  const inputFile = path.resolve(inputDir, file)
  const outputFile = replaceExtname(path.join(outputDir, path.relative(inputDir, inputFile)), '.lua')
  if (fs.existsSync(outputFile)) {
    return
  }
  await unluac({
    input: inputFile,
    output: outputFile,
    jar,
  })
}
