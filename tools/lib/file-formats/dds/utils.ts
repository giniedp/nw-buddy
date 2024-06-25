import fs from 'node:fs'
import path from 'node:path'

import { logger } from '../../utils/logger'
import { TexconvArgs, texconv } from '../../bin/texconv'
import { copyFile, mkdir, replaceExtname } from '../../utils/file-utils'
import { readDdsFile } from './reader'

export async function concatDds({
  headerFile,
  imageFiles,
  isDX10,
  outFile,
}: {
  headerFile: string
  imageFiles: string[]
  isDX10: boolean
  outFile?: string
}) {
  let header = fs.readFileSync(headerFile)
  let images = imageFiles.map((file) => fs.readFileSync(file))

  const headerSize = isDX10 ? 0x94 : 0x80
  const data = Buffer.concat([
    // header
    header.subarray(0, headerSize),
    // mipmaps
    ...images,
    // attachment
    header.subarray(headerSize),
  ])
  if (outFile) {
    fs.writeFileSync(outFile, data)
  }
  return data
}

export async function copyDdsFile({ input, output }: { input: string; output: string }): Promise<string[]> {
  const dds = await readDdsFile(input)
  await mkdir(path.dirname(output), { recursive: true })

  if (!dds.mipFiles.length && !dds.mipFilesAlpha.length) {
    // file does not need processing
    await copyFile(input, output)
    return [output]
  }

  const result: string[] = []
  if (dds.mipFiles.length) {
    await concatDds({
      headerFile: input,
      imageFiles: dds.mipFiles,
      isDX10: !!dds.headerDX10,
      outFile: output,
    })
    result.push(output)
  }

  if (dds.mipFilesAlpha.length) {
    // alpha channel is stored in a separate dds file ending with '.a
    //   e.g.: image.dds.a
    if (fs.existsSync(input + '.a')) {
      input = input + '.a'
    }
    // we add the '.a' to the filename before the extension
    //   e.g.: image.a.dds
    output = replaceExtname(output, '.a' + path.extname(output))
    await concatDds({
      headerFile: input,
      imageFiles: dds.mipFilesAlpha,
      isDX10: !!dds.headerDX10,
      outFile: output,
    })
    result.push(output)
  }

  return result
}

export interface DdsToPngOptions {
  isNormal: boolean
  ddsFile: string
  outDir: string
  size?: number
  maxsize?: number
  exe?: string
}

export async function ddsToPng({ isNormal, ddsFile, outDir, size, maxsize, exe }: DdsToPngOptions) {
  const pngFile = replaceExtname(ddsFile, '.png')
  const options: TexconvArgs = {
    input: ddsFile,
    overwrite: true,
    fileType: 'png',
    output: outDir,
    sepalpha: true,
    exe,
  }

  if (size) {
    options.width = size
    options.height = size
  }

  if (fs.existsSync(pngFile)) {
    fs.unlinkSync(pngFile)
  }

  const header = (await readDdsFile(ddsFile)).header
  if (maxsize && (header.width > maxsize || header.height > maxsize)) {
    options.width = maxsize
    options.height = maxsize
  }

  if (isNormal) {
    return await texconv({
      ...options,
      format: 'rgba',
      reconstructZ: true, // normal map has only RG channels. Z must be reconstructed
      invertY: true, // invert Y to fix bump direction
    }).catch((err) => {
      if (!fs.existsSync(pngFile)) {
        logger.warn('texconv failed', ddsFile, err)
      }
    })
  }
  await texconv({
    ...options,
  })
    .catch((err) => {
      logger.warn('retry with rgba format', ddsFile, err)
      return texconv({
        ...options,
        format: 'rgba',
      })
    })
    .catch((err) => {
      if (!fs.existsSync(pngFile)) {
        logger.warn('texconv failed', ddsFile, err)
      }
    })
}
