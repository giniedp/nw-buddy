import type { ModelShowOptions } from '@nw-buddy/viewer'

/**
 * How a model opens in the model view: `ModelViewer.show(url, { ...itemDisplay(tags) })`. The camera looks along -Y, at
 * the model's +Y side (Z is up).
 */
export type ModelDisplay = Required<Pick<ModelShowOptions, 'rotation' | 'camera'>>

type Quaternion = NonNullable<ModelShowOptions['rotation']>
type Rotation = ['x' | 'y' | 'z', number]
type HasTag = (...names: string[]) => boolean

const ARMOR_GROUPS = ['Head', 'Chest', 'Arms', 'Legs', 'Feet']
const ARMOR_CLASSES = ['EquippableHead', 'EquippableChest', 'EquippableHands', 'EquippableLegs', 'EquippableFeet']
const WEAPON_CLASSES = ['EquippableMainHand', 'EquippableTwoHand', 'EquippableTool']
const WEAPON_GROUPS = [
  'Longsword',
  'Rapier',
  'ThrowingAxe',
  'Flail',
  'Dagger',
  'GreatSword',
  'GreatAxe',
  'WarHammer',
  'Spear',
  'Bow',
  'Musket',
  'Blunderbuss',
  'Pistol',
  'StaffFire',
  'StaffLife',
  'AzothStaff',
  'FishingPole',
  '2hLoggingAxe',
  '2hPickAxe',
  'Sickle',
  'SkinningKnife',
]

/**
 * The display of an item model, posed like the game's icon of the item.
 *
 * @param tags - the `IconCaptureGroup` (the game's grouping of its icon shots) and the `ItemClass` of gear, weapons,
 * tools and instruments, or the `HousingTags` of housing items
 */
export function itemDisplay(tags: readonly string[] | null | undefined): ModelDisplay {
  const lower = new Set((tags ?? []).map((it) => it?.toLowerCase()))
  const has: HasTag = (...names) => names.some((it) => lower.has(it.toLowerCase()))
  if (has('OnWall', 'OnCeiling', 'OnFloor', 'OnFurniture')) {
    return housingDisplay(has)
  }
  // modeled on the character, which faces -Y
  if (has(...ARMOR_GROUPS, ...ARMOR_CLASSES)) {
    return display(0, -10, ['z', 180])
  }
  // modeled on the right arm, the hand to -X
  if (has('Gauntlet', 'IceMagic', 'VoidGauntlet')) {
    return display(0, 0, ['x', -90], ['y', 15])
  }
  // lie on their side, the front to X
  if (has('RoundShield', 'KiteShield', 'TowerShield', 'EquippableOffHand')) {
    return display(0, 0, ['z', 90], ['y', -90])
  }
  if (has('MountAttach', 'MountAttachment')) {
    return display(0, -10, ['z', 90])
  }
  if (has('Drum', 'InstrumentDrums')) {
    return display(0, -20)
  }
  // stand along Z with their front to -Y
  if (has('Flute', 'InstrumentFlute')) {
    return display(0, 0, ['z', 180], ['y', -45])
  }
  if (has('Mandolin', 'Guitar', 'Bass', 'InstrumentMandolin', 'InstrumentGuitar', 'InstrumentUprightBass')) {
    return display(0, 0, ['z', 180], ['y', -65])
  }
  // weapons and tools stand along Z with their flat side to X: the tip to the right, blades down
  if (has(...WEAPON_GROUPS, ...WEAPON_CLASSES)) {
    return display(0, 0, ['z', -90], ['y', -75])
  }
  return display(0, -15)
}

/**
 * The display of a character model (`.cdf`: player, mount, costume, vital): it faces the camera, seen a bit from the
 * side
 */
export function characterDisplay(): ModelDisplay {
  return display(35, -10, ['z', 180])
}

function housingDisplay(has: HasTag): ModelDisplay {
  // modeled on the ground: their back (-Z) is the wall, their bottom the ceiling
  if (has('OnWall')) {
    return display(has('IsLighting') ? 45 : 0, -5, ['x', 90], ['z', 180])
  }
  if (has('OnCeiling')) {
    return display(0, 10, ['y', 180])
  }
  if (has('IsAnimal')) {
    return characterDisplay()
  }
  // long side to the camera
  if (has('IsRug')) {
    return display(75, -45)
  }
  if (has('IsPlaceSetting')) {
    return display(200, -35)
  }
  if (has('OnFurniture')) {
    return display(20, -25)
  }
  return display(35, -20)
}

/**
 * @param heading - orbit angle in degrees: 0 looks at the front, positive shows the front turned to the left
 * @param pitch - degrees, positive looks up at the model
 * @param steps - rotations about the world axes in degrees, applied in the given order
 */
function display(heading: number, pitch: number, ...steps: Rotation[]): ModelDisplay {
  return {
    rotation: steps.length ? steps.map(axisRotation).reduce((result, step) => multiply(step, result)) : null,
    camera: { heading: radians(heading), pitch: radians(pitch) },
  }
}

function axisRotation([axis, degrees]: Rotation): Quaternion {
  const half = radians(degrees) / 2
  const result: Quaternion = { x: 0, y: 0, z: 0, w: Math.cos(half) }
  result[axis] = Math.sin(half)
  return result
}

/**
 * The rotation `b`, then `a`
 */
function multiply(a: Quaternion, b: Quaternion): Quaternion {
  return {
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  }
}

function radians(degrees: number) {
  return (degrees * Math.PI) / 180
}
