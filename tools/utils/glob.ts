import * as fastGlob from "fast-glob"

export function glob(pattern: string | string[], options?: fastGlob.Options): Promise<string[]> {
  pattern = (Array.isArray(pattern) ? pattern : [pattern]).map((it) => it.replace(/\\/gi, '/'))
  return fastGlob(pattern, options)
}
