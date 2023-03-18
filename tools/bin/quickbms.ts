import { spawn } from "../utils"

export interface QuickbmsArgs {
  exe?: string
  input: string
  script: string
  output: string
  filter?: string[]
  // list the files without extracting them
  list?: boolean
  // overwrite the output files without confirmation if they already exist
  overwrite?: boolean
}
export async function quickbms({
  exe,
  input,
  output,
  script,
  list,
  filter,
  overwrite,
}: QuickbmsArgs) {
  // https://github.com/new-world-tools/new-world-tools
  const tool = exe || 'quickbms.exe'
  // quickbms.exe
  //            [options]
  //              <script.BMS>
  //                <input_archive/folder>
  //                  [output_folder]
  const args = []
  if (list) {
    args.push('-l')
  }
  if (filter?.length) {
    args.push('-f', filter.join(';'))
  }
  if (overwrite) {
    args.push('-o')
  }
  args.push(script)
  args.push(input)
  args.push(output)

  await spawn(tool, args, {
    stdio: 'inherit',
  })
}
