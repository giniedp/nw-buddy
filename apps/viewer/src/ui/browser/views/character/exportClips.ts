import type { ExportAnimation } from '../../../../api/export'
import type { CharacterComponent } from '../../../../game/character/CharacterComponent'

/**
 * The `.caf` files of animation names of the character's set: a blend space gives the clips of its slots
 */
export async function exportClips(character: CharacterComponent | null, names: string[]): Promise<ExportAnimation[]> {
  const assets = character?.assets
  const set = character?.animationSet
  if (!assets || !set) {
    return []
  }
  const result = new Map<string, ExportAnimation>()
  const add = (name: string) => {
    const file = assets.animationByName(set, name)
    if (file?.type === 'caf' && !result.has(file.file)) {
      result.set(file.file, { name: file.name, file: file.file })
    }
  }
  for (const name of names) {
    const file = assets.animationByName(set, name)
    if (!file) {
      continue
    }
    if (file.type === 'caf') {
      add(name)
      continue
    }
    try {
      const space = await assets.blendSpace(file.file)
      for (const slot of space.slots) {
        add(slot.animation)
      }
    } catch (err) {
      console.warn(`export ${name}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
  return [...result.values()]
}
