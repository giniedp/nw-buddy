import { Injectable, inject } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import {
  EQUIP_SLOTS,
  EquipSlot,
  EquipSlotId,
  NW_MAX_GEAR_SCORE,
  getArmorRatingPhysical,
  getItemPerkIds,
  getWeightLabel,
  patchPrecision,
} from '@nw-data/common'
import { ItemClass, ItemDefinitionMaster } from '@nw-data/generated'
import { sumBy } from 'lodash'
import { combineLatest, map, of, switchMap } from 'rxjs'
import { NwDataService } from '~/data'
import { eqCaseInsensitive, selectStream } from '~/utils'

const ITEM_IDS = [
  'Artifact_Set1_LightChest',
  'Artifact_Set1_HeavyHead',
  'Artifact_Set1_HeavyChest',

  'LightHead_ClothT52',
  'LightChest_ClothT52',
  'LightHands_ClothT52',
  'LightLegs_ClothT52',
  'LightFeet_ClothT52',

  'MediumHead_LeatherT52',
  'MediumChest_LeatherT52',
  'MediumHands_LeatherT52',
  'MediumLegs_LeatherT52',
  'MediumFeet_LeatherT52',

  'HeavyHead_PlateT52',
  'HeavyChest_PlateT52',
  'HeavyHands_PlateT52',
  'HeavyLegs_PlateT52',
  'HeavyFeet_PlateT52',

  '1hShieldAT52',
  '1hShieldBT52',
  '1hShieldDT52',
]

const SLOT_IDS: EquipSlotId[] = ['head', 'chest', 'hands', 'legs', 'feet', 'weapon3']
const SLOTS = EQUIP_SLOTS.filter((it) => SLOT_IDS.includes(it.id))

export interface ArmorWeightsState {
  selectedHead: string
  selectedChest: string
  selectedHands: string
  selectedLegs: string
  selectedFeet: string
  selectedShield: string

  weightlessChest?: boolean
  weightClass?: ReturnType<typeof getWeightLabel>
  shieldClass?: Extract<ItemClass, 'RoundShield' | 'KiteShield' | 'TowerShield'>
}

export interface SlotItem {
  item: ItemDefinitionMaster
  slot: EquipSlot
  weight: number
  rating: number
  modArmor: number
  modWeight: number
  label: string
  subLabel: string
}

export interface ArmorWeightSet {
  id: string
  items: SlotItem[]
  weight: number
  rating: number
  weightClass: string
}

@Injectable()
export class ArmorWeightsStore extends ComponentStore<ArmorWeightsState> {
  private db = inject(NwDataService)
  private items$ = selectStream(combineLatest(ITEM_IDS.map((id) => selectItem(this.db, id))))

  public readonly allVariations$ = this.select(this.items$, selectItemSets)
  public readonly filter$ = this.select(({ weightClass, weightlessChest, shieldClass }) => {
    return {
      weightClass: weightClass,
      weightlessChest: weightlessChest,
      shieldClass: shieldClass,
    }
  })
  public readonly variations$ = this.select(this.allVariations$, this.filter$, (itemSets, filter) => {
    return itemSets.filter((itemSet) => {
      if (filter.weightClass && itemSet.weightClass !== filter.weightClass) {
        return false
      }
      if (filter.weightlessChest && !itemSet.items.some((it) => !it.weight)) {
        return false
      }
      if (filter.shieldClass && !itemSet.items.some((it) => it.item.ItemClass?.includes(filter.shieldClass))) {
        return false
      }
      return true
    })
  })

  public readonly selectedSet$ = selectStream({
    head: this.db.item(this.select((state) => state.selectedHead)),
    chest: this.select((state) => state.selectedChest),
    hands: this.select((state) => state.selectedHands),
    legs: this.select((state) => state.selectedLegs),
    feet: this.select((state) => state.selectedFeet),
    shield: this.select((state) => state.selectedShield),
  })

  public constructor() {
    super({
      selectedChest: null,
      selectedFeet: null,
      selectedHands: null,
      selectedHead: null,
      selectedLegs: null,
      selectedShield: null,
    })
  }
}

function selectItem(db: NwDataService, itemId: string) {
  return db.item(itemId).pipe(
    switchMap((item) => {
      if (!item) {
        return of(null)
      }
      return combineLatest({
        armor: db.armor(item.ItemStatsRef),
        weapon: db.weapon(item.ItemStatsRef),
        perksMap: db.perksMap,
        affixMap: db.affixStatsMap,
        abilitiesMap: db.abilitiesMap,
      }).pipe(
        map(({ armor, weapon, perksMap, affixMap, abilitiesMap }): SlotItem => {
          const slot = SLOTS.find((slot) => item.ItemClass?.some((it) => eqCaseInsensitive(it, slot.itemType)))
          const baseWeight = Math.floor(armor?.WeightOverride || weapon?.WeightOverride || item.Weight)
          const perks = getItemPerkIds(item)
            .map((id) => perksMap.get(id))
            .filter((it) => !!it)

          let modWeight = 0
          for (const perk of perks) {
            const affix = affixMap.get(perk.Affix)
            if (affix?.WeightMultiplier) {
              modWeight += affix.WeightMultiplier
            }
          }
          let modArmor = 0
          for (const perk of perks) {
            for (const id of perk.EquipAbility || []) {
              const ability = abilitiesMap.get(id)
              if (ability?.PhysicalArmor) {
                modArmor += ability.PhysicalArmor
              }
            }
          }

          const weight = ((1 + modWeight) * baseWeight) / 10
          let label: string = item.ItemClass?.find(
            (it) =>
              it === 'Light' ||
              it === 'Medium' ||
              it === 'Heavy' ||
              it === 'RoundShield' ||
              it === 'KiteShield' ||
              it === 'TowerShield',
          )
          let subLabel = ''
          if (!weight) {
            label = 'Weightless'
          } else if (modWeight) {
            subLabel = `Unyielding`
          }
          if (modArmor) {
            subLabel = `Void Darkplate`
          }
          return {
            item: item,
            slot: slot,
            weight: weight,
            modArmor: modArmor,
            modWeight: modWeight,
            rating: getArmorRatingPhysical(armor || weapon, NW_MAX_GEAR_SCORE),
            label: label,
            subLabel: subLabel,
          }
        }),
      )
    }),
  )
}

function selectItemSet(items: SlotItem[]): ArmorWeightSet {
  const weight = sumBy(items, (it) => (it?.weight || 0) * 10) / 10
  const armorBonus = sumBy(items, (it) => it?.modArmor || 0)
  const armorItems = items.filter((it) => it?.slot?.id !== 'weapon3')
  const ratingArmor = sumBy(armorItems, (it) => it?.rating || 0)
  const ratingShield = items.find((it) => it?.slot?.id === 'weapon3')?.rating || 0

  const rating = ratingArmor * (1 + armorBonus) + ratingShield
  return {
    id: items.map((it) => it?.label || 'none').join('-'),
    items: items,
    weight: weight,
    rating: rating,
    weightClass: getWeightLabel(weight),
  }
}

function selectItemSets(items: SlotItem[]) {
  const groups = SLOT_IDS.map((id) => {
    const groupItems = items.filter((it) => it.slot.id === id)
    if (id === 'weapon3') {
      return [null, ...groupItems]
    }
    return groupItems
  })

  let rows = groups[0].map((it) => [it])
  for (let i = 1; i < groups.length; i++) {
    const group = groups[i]

    rows = rows
      .map((row) => {
        if (group.length > 0) {
          return group.map((it) => [...row, it])
        }
        return [[...row, null]]
      })
      .flat(1)
  }
  return (
    rows
      //
      .filter((row) => {
        const countArmorMods = sumBy(row, (it) => (!!it?.modArmor ? 1 : 0))
        const countWeightMods = sumBy(row, (it) => (!!it?.modWeight ? 1 : 0))
        if (countArmorMods > 1 || countWeightMods > 1) {
          return false
        }
        if (countArmorMods && countWeightMods) {
          return false
        }
        return true
      })
      .map((it) => selectItemSet(it))
      .sort((a, b) => b.rating - a.rating)
  )
}
