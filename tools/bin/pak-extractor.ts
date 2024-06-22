import { SpawnOptions } from "node:child_process"
import { spawn } from "../utils"

export interface PakExtrakterArgs {
  exe?: string
  input: string
  output: string
  hashFile?: string
  decompressAzcs?: boolean
  fixLua?: boolean
  threads?: number
  exclude?: string[]
  include?: string[]
}
export async function pakExtractor({
  exe,
  input,
  output,
  hashFile,
  decompressAzcs,
  fixLua,
  threads,
  exclude,
  include,
}: PakExtrakterArgs, spawnOptions?: SpawnOptions) {
  // https://github.com/new-world-tools/new-world-tools
  const tool = exe || 'pak-extracter.exe'
  const args = [`-input`, input, `-output`, output]
  if (hashFile) {
    args.push(`-hash`, hashFile)
  }
  if (exclude) {
    args.push(`-exclude`, exclude.map((it) => `(${it})`).join('|'))
  }
  if (include) {
    args.push(`-include`, include.map((it) => `(${it})`).join('|'))
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
    stdio: 'pipe',
    ...(spawnOptions || {})
  })
}
