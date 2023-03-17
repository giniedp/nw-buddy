import * as c from 'ansi-colors'
export type COLOR = 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white'

let isEnabled = true// !!process.env.NW_EXTRACT_VERBOSE

export const logger = {
  activity: (tag: string, ...msg: any[]) => isEnabled ? console.log(c.magenta(tag), ...msg) : null,
  info: (...msg: any[]) => isEnabled ? console.log(c.bgGreen.black('[INFO]'), ...msg) : null,
  success: (...msg: any[]) => isEnabled ? console.log(c.bgGreen.black('[SUCCESS]'), ...msg) : null,
  debug: (...msg: any[]) => isEnabled ? console.log(c.bgCyan.black('[DEBUG]'), ...msg) : null,

  warn: (...msg: any[]) => console.log(c.bgYellow.black('[WARN]'), ...msg),
  error: (...msg: any[]) => console.log(c.bgRed.black('[ERROR]'), ...msg),

  verbose: (enabled: boolean) => {
    isEnabled = enabled
    if (enabled) {
      process.env.NW_EXTRACT_VERBOSE = 'true'
    } else {
      delete process.env.NW_EXTRACT_VERBOSE
    }
  },
  get isVerbose() {
    return isEnabled
  }
}
