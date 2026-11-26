import { itemDisplay } from './model-display'

type Vector = [number, number, number]

/**
 * Where the display rotation moves a direction. +Y is the side of the camera, its right is -X.
 */
function moved(tags: string[], [x, y, z]: Vector): Vector {
  const { rotation: q } = itemDisplay(tags)
  if (!q) {
    return [x, y, z]
  }
  const tx = 2 * (q.y * z - q.z * y)
  const ty = 2 * (q.z * x - q.x * z)
  const tz = 2 * (q.x * y - q.y * x)
  return [x + q.w * tx + q.y * tz - q.z * ty, y + q.w * ty + q.z * tx - q.x * tz, z + q.w * tz + q.x * ty - q.y * tx]
}

function expectVector(actual: Vector, expected: Vector) {
  actual.forEach((value, i) => expect(value).toBeCloseTo(expected[i], 5))
}

describe('itemDisplay', () => {
  it('lays weapons with their flat side (-X) to the camera, the tip to the right', () => {
    expectVector(moved(['Weapon', 'EquippableMainHand', 'Sword'], [-1, 0, 0]), [0, 1, 0])
    const tip = moved(['Weapon', 'EquippableTwoHand', 'GreatSword'], [0, 0, 1])
    expect(tip[0]).toBeLessThan(-0.9)
    expect(tip[1]).toBeCloseTo(0, 5)
    expect(tip[2]).toBeGreaterThan(0)
  })

  it('turns the front of instruments (-Y) to the camera', () => {
    expectVector(moved(['EquippableTool', 'InstrumentGuitar'], [0, -1, 0]), [0, 1, 0])
  })

  it('stands shields up, their front (X) to the camera', () => {
    expectVector(moved(['Weapon', 'EquippableOffHand', 'Shield'], [1, 0, 0]), [0, 1, 0])
    expect(Math.abs(moved(['Weapon', 'EquippableOffHand', 'Shield'], [0, 1, 0])[2])).toBeCloseTo(1, 5)
  })

  it('turns the front of gear (-Y) to the camera', () => {
    expectVector(moved(['EquippableChest', 'Heavy'], [0, -1, 0]), [0, 1, 0])
  })

  it('stands wall items up, their front (Z) to the camera', () => {
    expectVector(moved(['OnWall'], [0, 0, 1]), [0, 1, 0])
    expectVector(moved(['OnWall'], [0, 1, 0]), [0, 0, 1])
  })

  it('hangs ceiling items', () => {
    expectVector(moved(['OnCeiling'], [0, 0, 1]), [0, 0, -1])
  })

  it('reads the icon capture group of models without an item class', () => {
    expect(itemDisplay(['Mandolin'])).toEqual(itemDisplay(['EquippableTool', 'InstrumentMandolin']))
    expect(itemDisplay(['RoundShield'])).toEqual(itemDisplay(['Weapon', 'EquippableOffHand']))
    expect(itemDisplay(['Longsword'])).toEqual(itemDisplay(['EquippableMainHand']))
  })

  it('matches tags case insensitively', () => {
    expect(itemDisplay(['onwall'])).toEqual(itemDisplay(['OnWall']))
    expect(itemDisplay(['EquippableOffhand'])).toEqual(itemDisplay(['EquippableOffHand']))
  })

  it('opens models without tags', () => {
    expect(itemDisplay(null).rotation).toBeNull()
  })
})
