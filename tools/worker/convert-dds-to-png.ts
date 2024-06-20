import fs from 'node:fs'
import path from 'node:path'
import { copyDdsFile, ddsToPng } from '../file-formats/dds'

export type ConvertDdsOptions = {
  inputDir: string
  outputDir: string
  file: string
  update?: boolean
  texSize?: number
  exe?: string
}

export async function convertDdsToPng({ inputDir, outputDir, file, texSize, update, exe }: ConvertDdsOptions) {
  const inputFile = path.resolve(inputDir, file)
  const outputFile = path.join(outputDir, path.relative(inputDir, inputFile))
  if (fs.existsSync(outputFile) && !update) {
    return
  }
  const files = await copyDdsFile({
    input: inputFile,
    output: outputFile,
  })
  for (const file of files) {
    const basename = path.basename(file, path.extname(file))
    await ddsToPng({
      ddsFile: file,
      outDir: path.dirname(file),
      isNormal: basename.endsWith('_ddna') || basename.endsWith('_ddn'), // !!! does not include the _ddna.a.dds files !!!
      maxsize: texSize,
      exe
    })
  }
}
