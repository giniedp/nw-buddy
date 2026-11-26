import type { ArmorAppearanceDefinitions } from '@nw-data/generated'
import { armorSource } from './model-source'

function armor(patch: Partial<ArmorAppearanceDefinitions>) {
  return patch as ArmorAppearanceDefinitions
}

describe('armorSource', () => {
  it('takes the skin, its material, the cloth and the gender skeleton', () => {
    const source = armorSource(
      armor({
        Skin1: 'Objects/Characters/player/male/conquistadorT1/male_conquistadorT1_helmet.skin',
        Material1: 'Objects/Characters/player/male/conquistadorT1/male_conquistadorT1_helmet_matGroup.mtl',
        AppearanceCDF: 'Objects/Characters/player/male/cape.cdf',
        Gender: 'Male',
      }),
    )
    expect(source).toEqual({
      model: 'Objects/Characters/player/male/conquistadorT1/male_conquistadorT1_helmet.skin',
      material: 'Objects/Characters/player/male/conquistadorT1/male_conquistadorT1_helmet_matGroup.mtl',
      clothFrom: 'Objects/Characters/player/male/cape.cdf',
      skeleton: 'objects/characters/player/male/player_male.chr',
    })
  })

  it('leaves out what the row lacks', () => {
    expect(armorSource(armor({ Skin1: 'a.skin', Gender: '' }))).toEqual({
      model: 'a.skin',
      material: null,
      clothFrom: null,
      skeleton: null,
    })
    expect(armorSource(armor({}))).toBe(null)
    expect(armorSource(null)).toBe(null)
  })
})
