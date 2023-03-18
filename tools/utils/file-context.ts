import * as path from 'path'
import { glob } from './file-utils'

export interface FileContext {
  rootDir: string,
  glob: typeof glob,
  path: (...arg: string[]) => string
}

export function fileContext(rootDir: string): FileContext {
  return {
    rootDir,
    glob: (pattern, options) => {
      pattern = Array.isArray(pattern) ? pattern : [pattern]
      return glob(pattern.map((it) => path.join(rootDir, it)), options)
    },
    path: (...args: string[]) => path.join(rootDir, ...args)
  }
}
