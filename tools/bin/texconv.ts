import { spawn } from '../utils'

export interface TexconvArgs {
  exe?: string
  input: string
  // Output directory.
  output?: string
  // A file type for the output texture
  fileType: string
  //
  format?: string
  // overwrite existing output file
  overwrite: boolean
  width?: number
  height?: number
  invertY?: boolean
  reconstructZ?: boolean
  alpha?: boolean
  sepalpha?: boolean
}

export async function texconv({
  exe,
  input,
  output,
  fileType,
  format,
  overwrite,
  width,
  height,
  invertY,
  reconstructZ,
  alpha,
  sepalpha,
}: TexconvArgs) {
  // https://github.com/Microsoft/DirectXTex/wiki/Texconv
  const tool = exe || 'texconv.exe'
  const args: string[] = []
  if (fileType) {
    args.push(`-ft`, fileType)
  }
  if (format) {
    args.push(`-f`, format)
  }
  if (overwrite) {
    args.push(`-y`)
  }
  if (output) {
    args.push(`-o`, output)
  }
  if (width) {
    args.push(`-w`, String(width))
  }
  if (height) {
    args.push(`-h`, String(height))
  }
  if (invertY) {
    args.push(`-inverty`, String(invertY))
  }
  if (reconstructZ) {
    args.push(`-reconstructz`, String(reconstructZ))
  }
  if (alpha) {
    args.push(`-alpha`)
  }
  if (sepalpha) {
    args.push(`-sepalpha`)
  }
  args.push('-nologo')
  args.push('-fl', '12.1')
  args.push(input)

  await spawn(tool, args, {
    stdio: 'inherit',
  })
}
