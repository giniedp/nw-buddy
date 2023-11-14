import type { ItemClass } from 'libs/nw-data/generated/types'
import { HttpClient } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'
import { firstValueFrom } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService } from '~/nw'
import { AppTestingModule } from '~/test'
import { recognizeItemFromImage } from './recognize-item'

const sampleTestItems = [
  {
    lang: 'en',
    items: [
      {
        imageFile: 'blunderbuss_legendary_named_warhorn.png',
        itemClass: ['Blunderbuss'],
        expectedResult: {
          name: 'Warhorn',
          instance: {
            itemId: '2hBlunderbuss_Warhorn',
            gearScore: 700,
            perks: {
              Perk3: 'PerkID_Gem_GambitGem4',
              PerkBucket5: 'PerkID_Weapon_DmgCrit',
            },
          },
          gemConsumed: true,
          attrConsumed: true,
          perksConsumed: true,
        },
      },
      {
        imageFile: 'chest_rare_light_desecrated_cloth.png',
        itemClass: ['EquippableChest'],
        expectedResult: {
          name: 'Desecrated Cloth Shirt',
          instance: {
            itemId: 'LightChest_LostElite1T3',
            gearScore: 400,
            perks: {
              PerkBucket3: 'PerkID_Gem_EmptyGemSlot',
              PerkBucket1: 'PerkID_Stat_ArmorSentry',
              PerkBucket2: 'PerkID_Common_CDR',
            },
          },
          gemConsumed: true,
          attrConsumed: true,
          perksConsumed: true,
        },
      },
      {
        imageFile: 'feet_uncommon_corrupted_leather_boots.png',
        itemClass: ['EquippableFeet'],
        expectedResult: {
          name: 'Corrupted Leather Boots',
          instance: {
            itemId: 'MediumFeet_CorruptedElite1T4',
            gearScore: 500,
            perks: {
              PerkBucket1: 'PerkID_Stat_ArmorScholar',
              PerkBucket4: 'PerkID_Armor_DefGrit',
            },
          },
          gemConsumed: true,
          attrConsumed: true,
          perksConsumed: true,
        },
      },
      {
        imageFile: 'hatchet_legendary_scheming_dryad.png',
        itemClass: ['Hatchet'],
        expectedResult: {
          name: 'Dryad Hatchet',
          instance: {
            itemId: '1hThrowingAxeAngryEarthEliteT5',
            gearScore: 600,
            perks: {
              PerkBucket3: 'PerkID_Gem_GambitGem4',
              PerkBucket1: 'PerkID_Stat_TwoHandSoldier',
              PerkBucket4: 'PerkID_Weapon_DmgCrit',
              PerkBucket5: 'PerkID_Weapon_DodgeSuccess_ArcaneDMG',
              PerkBucket2: 'PerkID_Ability_Hatchet_Berserk',
            },
          },
          gemConsumed: true,
          attrConsumed: true,
          perksConsumed: true,
        },
      },
      {
        imageFile: 'legs_legendary_heavy_guardian_plate_greaves.png',
        itemClass: ['EquippableLegs'],
        expectedResult: {
          name: 'Guardian Plate Greaves',
          instance: {
            itemId: 'HeavyLegs_CraftedDungeon6T5',
            gearScore: 600,
            perks: {
              PerkBucket3: 'PerkID_Gem_ElementalWard4',
              PerkBucket4: 'PerkID_Armor_DurCC',
              PerkBucket5: 'PerkID_Armor_DodgeSuccess_Fortify',
              PerkBucket2: 'PerkID_Armor_Conditioning_Thrust',
            },
          },
          gemConsumed: true,
          attrConsumed: true,
          perksConsumed: true,
        },
      },
      {
        imageFile: 'ring_legendary_named_heart_of_anhurawak.png',
        itemClass: ['Jewelry'],
        expectedResult: {
          name: 'Heart of Anhurawak',
          instance: {
            itemId: 'RingT5_HeartOfAnhurawak_V2',
            gearScore: 625,
            perks: {
              Perk2: 'PerkID_Gem_FireWard4',
            },
          },
          gemConsumed: true,
          attrConsumed: true,
          perksConsumed: true,
        },
      },
    ],
  },
]

function sampleUrl(file: string) {
  return `/app/pages/tools/inventory/item-scanner/samples/${file}`
}

describe('item-scanner', async () => {
  let db: NwDbService
  let translate: TranslateService
  let http: HttpClient

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [AppTestingModule],
    })
    db = TestBed.inject(NwDbService)
    translate = TestBed.inject(TranslateService)
    http = TestBed.inject(HttpClient)

    await translate.whenLocaleReady('en-us')
    // to switch locale
    //  translate.use('de-de')
    //  await translate.whenLocaleReady('de-de')
  })

  it('translates', () => {
    expect(translate.get('RarityLevel0_DisplayName')).toBe('Common')
  })

  it('fetches data', async () => {
    const items = await firstValueFrom(db.items)
    expect(items.length).toBeGreaterThan(0)
  })

  for (const { lang, items } of sampleTestItems) {
    it(`recognizes items: ${lang}`, async () => {
      for (const { imageFile, itemClass, expectedResult } of items) {
        const result = await recognizeItemFromImage({
          affixMap: await firstValueFrom(db.affixStatsMap),
          items: await firstValueFrom(db.items),
          perksMap: await firstValueFrom(db.perksMap),
          itemClass: itemClass as ItemClass[],
          tl8: (key) => translate.get(key),
          image: await firstValueFrom(http.get(sampleUrl(`${lang}/${imageFile}`), { responseType: 'blob' })),
        })
        expect(result.length).toBeGreaterThan(0)
        expect(result[0]).toEqual(expectedResult)
      }
    }, 10000)
  }
})
