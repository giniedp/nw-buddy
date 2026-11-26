import type { Model } from '@gglib/model'

/**
 * An animation of a character's set, as an nwbt character export lists it (`extras.animationList`)
 */
export interface AnimationListEntry {
  /**
   * The name fragments use (`<Animation name>`)
   */
  name: string
  /**
   * The clip file (one `.caf` as glb), relative to the models root
   */
  file: string
  /**
   * `caf`, `bspace`, `comb`: only `caf` has a clip file
   */
  type: string
}

/**
 * The animation list of a character export by lower case name: the document's `extras.animationList`, else the
 * default scene's
 */
export function readAnimationList(model: Model): Map<string, AnimationListEntry> {
  const list = model.meta?.['animationList'] ?? model.scenes[model.scene]?.extras?.['animationList']
  const result = new Map<string, AnimationListEntry>()
  if (!Array.isArray(list)) {
    return result
  }
  for (const it of list as AnimationListEntry[]) {
    if (it?.name && it.file && it.type === 'caf') {
      const key = it.name.toLowerCase()
      if (!result.has(key)) {
        result.set(key, it)
      }
    }
  }
  return result
}
