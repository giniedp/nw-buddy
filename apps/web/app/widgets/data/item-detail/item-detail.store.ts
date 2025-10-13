import { computed, resource } from '@angular/core'
import { patchState, signalMethod, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import {
  AttributeRef,
  EquipmentSet,
  NW_FALLBACK_ICON,
  NW_MAX_CHARACTER_LEVEL,
  getItemIconPath,
  getItemId,
  getItemRarity,
  getItemRarityLabel,
  getItemSalvageInfo,
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
import { map, pipe } from 'rxjs'
import { injectNwData } from '~/data'
import { humanize, resourceValue, resourceValueOf } from '~/utils'
import {
  fetchItemPerkSlots,
  selectDescription,
  selectItemGearscore,
  selectItemGearscoreLabel,
  selectItemRarity,
  selectNamePrefix,
  selectNameSuffix,
} from './selectors'

export interface ItemDetailState {
  recordId: string
  gsOverride: number
  perkOverride: Record<string, string>
}

export const ItemDetailStore = signalStore(
  withState<ItemDetailState>({
    recordId: null,
    gsOverride: null,
    perkOverride: null,
  }),
  withComputed(({ recordId }) => {
    const db = injectNwData()
    const recordResource = resource({
      params: () => recordId(),
      loader: ({ params }) => db.itemOrHousingItem(params),
    })
    const record = resourceValueOf<MasterItemDefinitions | HouseItems>(recordResource, {
      keepPrevious: true,
    })

    return {
      record,
      isLoading: recordResource.isLoading,
      isLoaded: computed(() => !!record() || !!recordResource.error() || recordResource.hasValue()),
    }
  }),
  withMethods((state) => {
    return {
      load: signalMethod(async (itemOrId: string | MasterItemDefinitions | HouseItems) => {
        if (typeof itemOrId === 'string') {
          patchState(state, { recordId: itemOrId })
        } else {
          state.record.set(itemOrId)
          patchState(state, { recordId: getItemId(itemOrId) })
        }
      }),
    }
  }),
  withComputed(({ record, perkOverride }) => {
    const db = injectNwData()

    const item = computed(() => {
      const value = record()
      return isMasterItem(value) ? value : null
    })
    const houseItem = computed(() => {
      const value = record()
      return isHousingItem(value) ? value : null
    })
    const itemPerkSlots = resourceValue({
      params: () => {
        return {
          item: item(),
          perkOverride: perkOverride(),
        }
      },
      loader: ({ params: { item, perkOverride } }) => {
        return fetchItemPerkSlots(db, { item, perkOverride })
      },
      defaultValue: [],
      keepPrevious: true,
    })
    const equipmentSet = resourceValue({
      params: () => {
        return {
          item: item(),
        }
      },
      loader: ({ params: { item }}): Promise<EquipmentSet> => {
        // TODO: load equipmentests
        const id = item?.EquipmentSetId
        return db.equipmentSetsById(id)
      },
      keepPrevious: true
    })
    return {
      item,
      houseItem,
      itemPerkSlots,
      equipmentSet,
    }
  }),
  withState({
    playerLevel: NW_MAX_CHARACTER_LEVEL,
    gsEditable: false,
    perkEditable: false,
    attrValueSums: null as Record<AttributeRef, number>,
  }),
  withMethods((state) => {
    return {
      updateGsOverride: signalMethod((gsOverride: number) => {
        patchState(state, { gsOverride })
      }),
      updatePerkOverride: signalMethod((perkOverride: Record<string, string>) => {
        patchState(state, { perkOverride })
      }),
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
      salvageInfo: computed(() => getItemSalvageInfo(record(), '*', '*')),
      rarity,
      rarityLabel: computed(() => getItemRarityLabel(rarity())),
    }
  }),
)
