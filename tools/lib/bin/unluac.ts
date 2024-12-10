import { logger } from '../utils/logger'
import { spawn } from '../utils/spawn'

export interface UnluacArgs {
  jar?: string
  input: string
  output: string
}

export async function unluac({ jar, input, output }: UnluacArgs) {
  const tool = `java`
  const args: string[] = []
  args.push('-jar', jar || 'unluac.har')
  args.push('-o', output)
  args.push(input)

  await spawn(tool, args, {
    stdio: logger.isVerbose ? 'inherit' : null,
  })
}
