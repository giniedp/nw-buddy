import { spawn } from "../utils"

export interface PakExtrakterArgs {
  exe?: string
  input: string
  output: string
  hashFile?: string
  decompressAzcs?: boolean
  fixLua?: boolean
  threads?: number
}
export async function pakExtractor({
  exe,
  input,
  output,
  hashFile,
  decompressAzcs,
  fixLua,
  threads,
}: PakExtrakterArgs) {
  // https://github.com/new-world-tools/new-world-tools
  const tool = exe || 'pak-extracter.exe'
  const args = [`-input`, input, `-output`, output]
  if (hashFile) {
    args.push(`-hash`, hashFile)
  }
  if (decompressAzcs) {
    args.push(`-decompress-azcs`)
  }
  if (fixLua) {
    args.push(`-fix-luac`)
  }
  if (threads) {
    args.push(`-threads`, String(threads))
  }
  await spawn(tool, args, {
    stdio: 'inherit',
  })
}
