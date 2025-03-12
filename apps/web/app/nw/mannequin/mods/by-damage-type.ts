import { DamageType } from '@nw-data/generated'

export function byDamageType<T>(getter: (type: DamageType) => T) {
  return {
    Acid: getter('Acid'),
    Arcane: getter('Arcane'),
    Corruption: getter('Corruption'),
    Fire: getter('Fire'),
    Ice: getter('Ice'),
    Lightning: getter('Lightning'),
    Nature: getter('Nature'),
    Siege: getter('Siege'),
    Slash: getter('Slash'),
    Standard: getter('Standard'),
    Strike: getter('Strike'),
    Thrust: getter('Thrust'),
    // Void: getter('Void'),
  } as const
}
