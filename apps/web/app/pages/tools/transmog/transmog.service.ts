import { Injectable, inject } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import {
  ItemClass,
  ItemDefinitionMaster,
  Itemappearancedefinitions,
  ItemdefinitionsInstrumentsappearances,
  ItemdefinitionsWeaponappearances,
} from '@nw-data/generated'
import { sortBy } from 'lodash'
import { Observable, combineLatest, map, of } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService } from '~/nw'
import { eqCaseInsensitive, selectStream } from '~/utils'

export interface TransmogServiceState {
  genderFilter: 'male' | 'female'
}

export type TransmogAppearance = Pick<Itemappearancedefinitions, 'Name' | 'IconPath' | 'ItemClass'>

export interface TransmogItem {
  id: string
  appearance: TransmogAppearance
  items: ItemDefinitionMaster[]
  isUnique: boolean
  isStore: boolean
  isSkin: boolean
  name: string
  gender: 'male' | 'female'
}

export interface TransmogCategory {
  id: string
  name: string
  itemClass: ItemClass[]
  subcategories: ItemClass[]
}
export const CATEGORIES: TransmogCategory[] = [
  {
    id: '1handed',
    name: 'categorydata_1handed',
    itemClass: ['EquippableMainHand', 'Melee'],
    subcategories: ['Sword', 'Rapier', 'Hatchet'],
  },
  {
    id: '2handed',
    name: 'categorydata_2handed',
    itemClass: ['EquippableTwoHand', 'Melee'],
    subcategories: ['GreatSword', 'Spear', '2hAxe', '2HHammer'],
  },
  {
    id: 'rangedweapons',
    name: 'categorydata_rangedweapons',
    itemClass: ['EquippableTwoHand', 'Ranged'],
    subcategories: ['Bow', 'Musket', 'Blunderbuss'],
  },
  {
    id: 'magical',
    name: 'categorydata_magical',
    itemClass: ['EquippableMainHand', 'Magic' as any], // TODO: fix type
    subcategories: ['FireStaff', 'LifeStaff', 'IceMagic', 'VoidGauntlet'],
  },
  {
    id: 'shields',
    name: 'categorydata_shields',
    itemClass: ['EquippableOffHand' as any, 'Shield'],
    subcategories: ['KiteShield', 'RoundShield', 'TowerShield'],
  },
  {
    id: 'slothead',
    name: 'categorydata_slothead',
    itemClass: ['EquippableHead'],
    subcategories: ['Heavy', 'Medium', 'Light'] as any,
  },
  {
    id: 'slotchest',
    name: 'categorydata_slotchest',
    itemClass: ['EquippableChest'],
    subcategories: ['Heavy', 'Medium', 'Light'] as any,
  },
  {
    id: 'slothands',
    name: 'categorydata_slothands',
    itemClass: ['EquippableHands'],
    subcategories: ['Heavy', 'Medium', 'Light'] as any,
  },
  {
    id: 'slotlegs',
    name: 'categorydata_slotlegs',
    itemClass: ['EquippableLegs'],
    subcategories: ['Heavy', 'Medium', 'Light'] as any,
  },
  {
    id: 'slotfeet',
    name: 'categorydata_slotfeet',
    itemClass: ['EquippableFeet'],
    subcategories: ['Heavy', 'Medium', 'Light'] as any,
  },
  {
    id: 'tools',
    name: 'categorydata_tools',
    itemClass: ['EquippableTool'],
    subcategories: [
      'LoggingAxe',
      'FishingPole',
      'PickAxe',
      'Sickle',
      'SkinningKnife',
      'AzothStaff' as any,
      'InstrumentFlute',
      'InstrumentGuitar',
      'InstrumentGuitar',
      'InstrumentUprightBass',
      'InstrumentDrums',
    ],
  },
]
@Injectable({ providedIn: 'root' })
export class TransmogService extends ComponentStore<TransmogServiceState> {
  private readonly db = inject(NwDbService)
  private readonly tl8 = inject(TranslateService)

  public readonly categories$ = of(CATEGORIES)
  public readonly appearances$ = selectStream(
    {
      locale: this.tl8.locale.value$,
      categories: of(CATEGORIES),
      itemsMap: this.db.itemsByAppearanceId,
      itemAppearances: this.db.itemAppearances,
      weaponAppearances: this.db.weaponAppearances,
      instrumentAppearances: this.db.instrumentAppearances,
    },
    (data) =>
      selectAppearances({
        tl8: this.tl8,
        ...data,
      })
  )

  public constructor() {
    super({
      genderFilter: 'male',
    })
  }

  public byCategory(categoryId$: Observable<string>) {
    return combineLatest({
      appearances: this.appearances$,
      categories: this.categories$,
      categoryId: categoryId$,
    }).pipe(
      map(({ appearances, categories, categoryId }) => {
        const category = categories.find((it) => eqCaseInsensitive(it.id, categoryId))
        const items = appearances.filter((it) => matchTransmogCateogry(category, it.appearance))
        return category.subcategories.map((subcategory) => {
          const subItems = items.filter((it) => {
            return it.appearance.ItemClass.some((it) => eqCaseInsensitive(it, subcategory))
          })
          return {
            category: subcategory,
            items: sortBy(subItems, (it) => it.name),
          }
        })
      })
    )
  }

  public byAppearanceId(appearanceId$: Observable<string>) {
    return combineLatest({
      appearances: this.appearances$,
      id: appearanceId$,
    }).pipe(map(({ appearances, id }) => appearances.find((it) => eqCaseInsensitive(it.id, id))))
  }
}

export type NwApearance =
  | Itemappearancedefinitions
  | ItemdefinitionsWeaponappearances
  | ItemdefinitionsInstrumentsappearances

function selectAppearances({
  tl8,
  itemsMap,
  itemAppearances,
  weaponAppearances,
  instrumentAppearances,
}: {
  tl8: TranslateService
  itemsMap: Map<string, Set<ItemDefinitionMaster>>
  itemAppearances: Itemappearancedefinitions[]
  weaponAppearances: ItemdefinitionsWeaponappearances[]
  instrumentAppearances: ItemdefinitionsInstrumentsappearances[]
}): TransmogItem[] {
  const appearances = [...itemAppearances, ...weaponAppearances, ...instrumentAppearances]
  const result = appearances
    .map((appearance): TransmogItem => {
      const appearanceId = getAppearanceId(appearance)
      const sources = Array.from(itemsMap.get(appearanceId)?.values() || [])
      const isUnique = sources.length === 1
      // TODO:
      const isStore = isUnique && (eqCaseInsensitive(sources[0]['$source'], 'store'))
      const isSkin = isUnique && (sources[0].ItemID.includes('Skin_'))
      return {
        id: appearanceId,
        appearance: appearance,
        items: sources,
        isUnique: isUnique,
        isStore: isStore,
        isSkin: isSkin,
        name: tl8.get(appearance.Name),
        gender: (appearance as Itemappearancedefinitions).Gender?.toLowerCase() as any,
      }
    })
    .filter((it) => it.items.length > 0)
  return result
}

function matchTransmogCateogry(category: TransmogCategory, appearance: { ItemClass?: string[] }) {
  return category.itemClass.every((itemClass) => {
    return appearance.ItemClass?.some((itemClass2) => eqCaseInsensitive(itemClass, itemClass2))
  })
}

function getAppearanceId(item: NwApearance) {
  return (item as Itemappearancedefinitions)?.ItemID || (item as ItemdefinitionsWeaponappearances)?.WeaponAppearanceID
}
