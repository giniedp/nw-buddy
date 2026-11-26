import type { ScannedEquipSocket, ScannedEquipType } from '@nw-data/generated'
import { equipTypesByClass, weaponEquipType, weaponSocket, weaponSockets } from './weapon-rule'

function socket(name: string, rotation: ScannedEquipSocket['rotation'] = [0, 0, 0]): ScannedEquipSocket {
  return { name, position: [0, 0, 0], rotation }
}

const SWORD: ScannedEquipType = {
  id: 'Sword',
  drawn: socket('righthandattach'),
  sheathed: socket('left_sword'),
  offHandDrawn: socket('lefthandattach'),
  offHandSheathed: socket('right_sword'),
}
const SHIELD: ScannedEquipType = {
  id: 'Shield',
  drawn: null,
  sheathed: null,
  offHandDrawn: socket('lefthandattach'),
  offHandSheathed: socket('shieldattach', [90, 0, 0]),
}

describe('weaponSocket', () => {
  it('puts weapon 1 into the hand when drawn, else its sheath', () => {
    expect(weaponSocket('weapon1', SWORD, false)?.name).toBe('left_sword')
    expect(weaponSocket('weapon1', SWORD, true)?.name).toBe('righthandattach')
  })

  it('keeps weapon 2 in its off-hand sheath', () => {
    expect(weaponSocket('weapon2', SWORD, false)?.name).toBe('right_sword')
    expect(weaponSocket('weapon2', SWORD, true)?.name).toBe('right_sword')
  })

  it('takes the off-hand entries for the shield', () => {
    expect(weaponSocket('weapon3', SHIELD, false)?.name).toBe('shieldattach')
    expect(weaponSocket('weapon3', SHIELD, true)?.name).toBe('lefthandattach')
  })

  it('falls back to the off-hand entries for a shield in a weapon slot', () => {
    expect(weaponSocket('weapon1', SHIELD, false)?.name).toBe('shieldattach')
  })
})

describe('weaponEquipType', () => {
  it('prefers the own weapons, then the class', () => {
    const byClass = new Map([['Sword', 'RSword_LeftHolster']])
    expect(weaponEquipType(['Greatsword'], 'Sword', byClass)).toBe('Greatsword')
    expect(weaponEquipType([], 'Sword', byClass)).toBe('RSword_LeftHolster')
    expect(weaponEquipType([], 'Unknown', byClass)).toBeNull()
  })
})

describe('equipTypesByClass', () => {
  it('takes the most frequent type of a class', () => {
    const result = equipTypesByClass([
      { weaponClass: 'Sword', types: ['RSword_LeftHolster'] },
      { weaponClass: 'Sword', types: ['RSword_LeftHolster', 'AlwaysUnsheathed_RHand'] },
      { weaponClass: 'Bow', types: ['Bow'] },
      { weaponClass: '', types: ['Bow'] },
    ])
    expect(result.get('Sword')).toBe('RSword_LeftHolster')
    expect(result.get('Bow')).toBe('Bow')
    expect(result.size).toBe(2)
  })
})

describe('weaponSockets', () => {
  it('groups the models by socket with the offset', () => {
    const sockets = weaponSockets(
      [
        { slot: 'weapon1', model: 'sword', equipType: SWORD },
        { slot: 'weapon3', model: 'shield', equipType: SHIELD },
      ],
      false,
    )
    expect(Object.keys(sockets).sort()).toEqual(['left_sword', 'shieldattach'])
    expect(sockets['shieldattach'].offset.rotation).toEqual([90, 0, 0])
    expect(sockets['left_sword'].models).toEqual(['sword'])
  })
})
