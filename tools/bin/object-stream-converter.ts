import { spawn } from "../utils"

export interface ObjectStreamConverterArgs {
  exe?: string
  input: string
  output: string
  threads?: number
  pretty?: boolean
}
export async function objectStreamConverter({ exe, input, output, threads, pretty }: ObjectStreamConverterArgs) {
  // https://github.com/new-world-tools/new-world-tools
  const tool = exe || 'object-stream-converter.exe'
  const args = [`-input`, input, `-output`, output]
  if (threads) {
    args.push(`-threads`, String(threads))
  }
  if (pretty) {
    args.push(`-with-indents`)
  }
  await spawn(tool, args, {
    stdio: 'inherit'
  })
}
