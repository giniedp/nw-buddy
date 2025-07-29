import { computed } from '@angular/core'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import {
  AttributeRef,
  NW_FALLBACK_ICON,
  NW_MAX_CHARACTER_LEVEL,
  getItemIconPath,
  getItemRarity,
  getItemRarityLabel,
  getItemSourceShort,
  getItemTierAsRoman,
  getItemTypeName,
  isHousingItem,
  isItemArtifact,
  isItemHeartGem,
  isItemNamed,
  isItemResource,
  isMasterItem,
  isPerkGem,
} from '@nw-data/common'
import { HouseItems, MasterItemDefinitions } from '@nw-data/generated'
import { combineLatest, map, of, pipe, switchMap } from 'rxjs'
import { injectNwData, withStateLoader } from '~/data'
import { humanize } from '~/utils'
import {
  ItemPerkSlot,
  fetchItemPerkSlots,
  selectDescription,
  selectItemGearscore,
  selectItemGearscoreLabel,
  selectItemRarity,
  selectItemSalvageInfo,
  selectNamePrefix,
  selectNameSuffix,
} from './selectors'

export interface ItemDetailState {
  recordId: string
  record: MasterItemDefinitions | HouseItems
  item: MasterItemDefinitions
  houseItem: HouseItems
  itemPerkSlots: ItemPerkSlot[]

  gsOverride: number
  perkOverride: Record<string, string>
}

export const ItemDetailStore = signalStore(
  withState<ItemDetailState>({
    recordId: null,
    record: null,
    item: null,
    houseItem: null,
    itemPerkSlots: [],
    gsOverride: null,
    perkOverride: null,
  }),
  withStateLoader(() => {
    const db = injectNwData()
    return {
      load: async ({
        recordId,
        gsOverride,
        perkOverride,
      }: {
        recordId: string
        gsOverride?: number
        perkOverride?: Record<string, string>
      }) => {
        const record = await db.itemOrHousingItem(recordId)
        const item = isMasterItem(record) ? record : null
        const housingItem = isHousingItem(record) ? record : null
        const itemPerkSlots = await fetchItemPerkSlots(db, { item, perkOverride })
        return {
          recordId,
          record,
          item,
          houseItem: housingItem,
          itemPerkSlots,
          gsOverride,
          perkOverride,
        }
      },
    }
  }),
  withState({
    playerLevel: NW_MAX_CHARACTER_LEVEL,
    gsEditable: false,
    perkEditable: false,
    attrValueSums: null as Record<AttributeRef, number>,
  }),
  withMethods((state) => {
    const db = injectNwData()
    return {
      updateGsOverride: rxMethod<number>(
        pipe(
          map((gsOverride) => {
            patchState(state, { gsOverride })
          }),
        ),
      ),
      updatePerkOverride: rxMethod<Record<string, string>>(
        pipe(
          switchMap((perkOverride) => {
            return combineLatest({
              perkOverride: of(perkOverride),
              itemPerkSlots: fetchItemPerkSlots(db, { item: state.item(), perkOverride }),
            })
          }),
          map(({ perkOverride, itemPerkSlots }) => {
            patchState(state, { perkOverride, itemPerkSlots })
          }),
        ),
      ),
      updateSettings: rxMethod<{
        playerLevel?: number
        gsEditable?: boolean
        perkEditable?: boolean
        attrValueSums?: Record<AttributeRef, number>
      }>(
        pipe(
          map((settings) => {
            patchState(state, {
              playerLevel: settings.playerLevel ?? state.playerLevel(),
              gsEditable: settings.gsEditable ?? state.gsEditable(),
              perkEditable: settings.perkEditable ?? state.perkEditable(),
              attrValueSums: settings.attrValueSums ?? state.attrValueSums(),
            })
          }),
        ),
      ),
    }
  }),
  withComputed(({ record, item, itemPerkSlots, gsOverride, perkOverride, playerLevel }) => {
    const name = computed(() => record()?.Name)
    const namePrefix = computed(() => selectNamePrefix(item(), itemPerkSlots()))
    const nameSuffix = computed(() => selectNameSuffix(item(), itemPerkSlots()))
    const rarity = computed(() => {
      return selectItemRarity({
        item: record(),
        perkDetails: itemPerkSlots(),
        perkOverride: perkOverride(),
      })
    })
    return {
      itemGS: computed(() => selectItemGearscore(item(), gsOverride())),
      itemGSLabel: computed(() => selectItemGearscoreLabel(item(), gsOverride())),
      itemRarity: computed(() => getItemRarity(record())),
      itemRarityName: computed(() => getItemRarityLabel(record())),
      name,
      namePrefix,
      nameSuffix,
      fullName: computed(() => [namePrefix(), name(), nameSuffix()].filter((it) => !!it)),
      source: computed(() => getItemSourceShort(record()) as string),
      sourceLabel: computed(() => humanize(getItemSourceShort(record()))),
      description: computed(() => selectDescription(record())),
      icon: computed(() => getItemIconPath(record()) || NW_FALLBACK_ICON),
      typeName: computed(() => getItemTypeName(record())),
      tierLabel: computed(() => getItemTierAsRoman(record()?.Tier, true)),
      isDeprecated: computed(() => /depricated/i.test(getItemSourceShort(record()) || '')),
      isNamed: computed(() => isItemNamed(item())),
      isResource: computed(() => isItemResource(item())),
      isArtifact: computed(() => isItemArtifact(item())),
      isHeartGem: computed(() => isItemHeartGem(item())),
      gemPerk: computed(() => itemPerkSlots().find((it) => isPerkGem(it.perk))?.perk),
      salvageInfo: computed(() => selectItemSalvageInfo(record(), playerLevel())),
      rarity,
      rarityLabel: computed(() => getItemRarityLabel(rarity())),
    }
  }),
)
