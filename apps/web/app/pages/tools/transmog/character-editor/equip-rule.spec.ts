import type { ArmorAppearanceDefinitions } from '@nw-data/generated'
import { applyBodyParts, BodyPart, bodyParts, equipCharacter, EquipUrls } from './equip-rule'

const URLS: EquipUrls = {
  armor: (row) => ({ url: `armor/${row.ItemID}.glb`, rootUrl: 'models/' }),
  skin: (file) => ({ url: `skins/${file.toLowerCase()}.glb` }),
}

function row(values: Partial<ArmorAppearanceDefinitions>): ArmorAppearanceDefinitions {
  return { ItemID: 'item', Skin1: 'armor.skin', Skin2: '', ...values } as ArmorAppearanceDefinitions
}

/**
 * A body part's rule state, visibility and override
 */
function state(part: BodyPart) {
  return [part.hiddenBy, part.hidden, part.override]
}

function models(result: ReturnType<typeof equipCharacter>, slot: keyof ReturnType<typeof equipCharacter>['slots']) {
  return result.slots[slot].map((it) => `${it.attachment}=${it.url}`)
}

describe('equipCharacter', () => {
  it('keeps the player defaults without rows', () => {
    const result = equipCharacter({}, URLS)
    expect(result.hiddenParts).toEqual([])
    expect(models(result, 'chest')).toEqual([])
  })

  it('binds Skin1 to {part}2 and replaces both attachments of the part', () => {
    const result = equipCharacter({ chest: row({ ItemID: 'chest' }) }, URLS)
    expect(models(result, 'chest')).toEqual(['shirt2=armor/chest.glb'])
    expect(result.hiddenParts).toEqual(['shirt1', 'shirt2'])
  })

  it('binds Skin2 to {part}1 as a bare skin without dyes', () => {
    const result = equipCharacter({ chest: row({ ItemID: 'vest', Skin2: 'Male_Naked_Chest_Sleeveless.skin' }) }, URLS)
    expect(models(result, 'chest')).toEqual([
      'shirt2=armor/vest.glb',
      'shirt1=skins/male_naked_chest_sleeveless.skin.glb',
    ])
    expect(result.slots.chest[1].appearance).toBeNull()
    expect(result.slots.chest[0].appearance?.ItemID).toBe('vest')
    expect(result.slots.chest[0].rootUrl).toBe('models/')
    expect(result.slots.chest[1].rootUrl).toBeUndefined()
    // the game files of the export: a bare skin takes the character's body material
    expect(result.slots.chest[0].source).toEqual({ skin: 'armor.skin', material: null, clothFrom: null })
    expect(result.slots.chest[1].source).toEqual({
      skin: 'Male_Naked_Chest_Sleeveless.skin',
      material: null,
      clothFrom: null,
    })
  })

  it('uses the game part names of the slots', () => {
    const result = equipCharacter({ head: row({}), hands: row({}), legs: row({}), feet: row({}) }, URLS)
    expect(models(result, 'head')).toEqual(['hat2=armor/item.glb'])
    expect(result.hiddenParts.sort()).toEqual(
      ['boots1', 'boots2', 'gloves1', 'gloves2', 'hat1', 'hat2', 'pants1', 'pants2'].sort(),
    )
  })

  it('keeps the defaults of a ShowBaseModelOnly row', () => {
    const result = equipCharacter({ legs: row({ ShowBaseModelOnly: 1 }) }, URLS)
    expect(models(result, 'legs')).toEqual([])
    expect(result.hiddenParts).toEqual([])
  })

  it('empties the legs for a chest that hides them', () => {
    const result = equipCharacter({ chest: row({ HideLegs: 1 }), legs: row({ ItemID: 'pants' }) }, URLS)
    expect(models(result, 'legs')).toEqual([])
    expect(result.hiddenParts).toContain('pants1')
    expect(result.hiddenParts).toContain('pants2')
  })

  it('hides the head for a head row that hides it', () => {
    expect(equipCharacter({ head: row({ HideHead: 1 }) }, URLS).hiddenParts).toContain('head1')
    expect(equipCharacter({ head: row({ HideHead: 0 }) }, URLS).hiddenParts).not.toContain('head1')
  })

  it('skips skins without a model', () => {
    const result = equipCharacter({ feet: row({ Skin2: 'missing.skin' }) }, { armor: () => null, skin: () => null })
    expect(models(result, 'feet')).toEqual([])
    expect(result.hiddenParts).toEqual(['boots1', 'boots2'])
  })
})

describe('bodyParts', () => {
  it('reports the rule: shown defaults, hidden parts with the hiding slot, armor', () => {
    const equipped = equipCharacter({ chest: row({ HideLegs: 1 }), hands: row({}) }, URLS)
    const parts = bodyParts(equipped, { hide: {}, show: {} })
    expect(parts.chest.map((it) => [it.attachment, it.armor, it.hiddenBy, it.hidden])).toEqual([
      ['shirt1', false, 'chest', true],
      ['shirt2', true, null, false],
    ])
    expect(state(parts.hands[0])).toEqual(['hands', true, false])
    expect(state(parts.legs[0])).toEqual(['chest', true, false])
    expect(state(parts.feet[0])).toEqual([null, false, false])
    expect(parts.head).toEqual([])
  })

  it('applies hide bits only to shown parts and show bits only to hidden parts', () => {
    const equipped = equipCharacter({ hands: row({}) }, URLS)
    const parts = bodyParts(equipped, { hide: { hands: 1, feet: 1 }, show: { feet: 1 } })
    // the rule hides the hands: the hide bit changes nothing
    expect(state(parts.hands[0])).toEqual(['hands', true, false])
    // the rule shows the feet: the hide bit hides them, the show bit changes nothing
    expect(state(parts.feet[0])).toEqual([null, true, true])
  })
})

describe('applyBodyParts', () => {
  it('hides the flagged default parts', () => {
    const result = applyBodyParts(equipCharacter({}, URLS), { hide: { chest: 2, hands: 1 }, show: {} })
    expect(result.hiddenParts.sort()).toEqual(['gloves1', 'shirt2'])
  })

  it('drops a bare skin on a flagged attachment and keeps the armor', () => {
    const equipped = equipCharacter({ chest: row({ ItemID: 'vest', Skin2: 'sleeveless.skin' }) }, URLS)
    const result = applyBodyParts(equipped, { hide: { chest: 1 }, show: {} })
    expect(models(result, 'chest')).toEqual(['shirt2=armor/vest.glb'])
    expect(applyBodyParts(equipped, { hide: { chest: 2 }, show: {} }).slots.chest.length).toBe(2)
  })

  it('shows the default of a part the rule hides', () => {
    const equipped = equipCharacter({ hands: row({}) }, URLS)
    const result = applyBodyParts(equipped, { hide: {}, show: { hands: 1 } })
    expect(result.hiddenParts).not.toContain('gloves1')
    expect(result.hiddenParts).toContain('gloves2')
  })

  it('brings back the bare legs a chest with HideLegs dropped', () => {
    const equipped = equipCharacter(
      { chest: row({ HideLegs: 1 }), legs: row({ ItemID: 'pants', Skin2: 'thighs.skin' }) },
      URLS,
    )
    const result = applyBodyParts(equipped, { hide: {}, show: { legs: 1 } })
    expect(models(result, 'legs')).toEqual(['pants1=skins/thighs.skin.glb'])
    // the bare skin replaces the default, the armor stays hidden
    expect(result.hiddenParts).toContain('pants1')
    expect(result.hiddenParts).toContain('pants2')
  })

  it('keeps the parts the character file hides hidden, a show bit shows them', () => {
    const equipped = equipCharacter({}, URLS, ['shirt2'])
    expect(equipped.hiddenParts).toEqual(['shirt2'])
    expect(state(bodyParts(equipped, { hide: {}, show: {} }).chest[1])).toEqual(['character', true, false])
    expect(applyBodyParts(equipped, { hide: {}, show: { chest: 2 } }).hiddenParts).toEqual([])
    // a chest row hides both chest parts itself
    const chest = equipCharacter({ chest: row({}) }, URLS, ['shirt2'])
    expect(chest.hiddenBy['shirt2']).toBe('chest')
  })

  it('has no parts for the head', () => {
    expect(applyBodyParts(equipCharacter({}, URLS), { hide: { head: 3 }, show: { head: 3 } }).hiddenParts).toEqual([])
  })
})
