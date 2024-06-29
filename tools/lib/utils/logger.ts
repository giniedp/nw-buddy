import { bgCyan, bgGreen, bgRed, bgYellow, default as c } from 'ansi-colors'
export type COLOR = 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white'

let isVerbose = true
if (process.env.NW_VERBOSE === 'false') {
  isVerbose = false
}

const tags = {
  info: bgGreen.black('[INFO]'),
  success: bgGreen.black('[SUCCESS]'),
  debug: bgCyan.black('[DEBUG]'),
  warn: bgYellow.black('[WARN]'),
  error: bgRed.black('[ERROR]'),
}
let redirect: typeof console.log

function log(...msg: any[]) {
  if (!isVerbose) {
    return
  }
  if (redirect) {
    redirect(...msg)
    return
  }
  console.log(...msg)
}

export const logger = {
  ansi: c,
  log: log,
  activity: (tag: string, ...msg: any[]) => log(c.magenta(tag), ...msg),
  info: (...msg: any[]) => log(tags.info, ...msg),
  success: (...msg: any[]) => log(tags.success, ...msg),
  debug: (...msg: any[]) => log(tags.debug, ...msg),

  warn: (...msg: any[]) => log(tags.warn, ...msg),
  error: (...msg: any[]) => log(tags.error, ...msg),
  redirect: (log: typeof console.log) => {
    redirect = log
  },
  verbose: (enabled: boolean) => {
    isVerbose = enabled
    process.env.NW_VERBOSE = enabled ? 'true' : 'false'
  },

  get isVerbose() {
    return isVerbose
  },
}
