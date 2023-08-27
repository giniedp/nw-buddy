import { Injectable, Output, inject } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import {
  NW_FALLBACK_ICON,
  getItemId,
  getItemRarity,
  isItemArmor,
  isItemJewelery,
  isItemNamed,
  isItemWeapon,
  isMasterItem,
} from '@nw-data/common'
import {
  ItemDefinitionMaster,
  Itemappearancedefinitions,
  ItemdefinitionsInstrumentsappearances,
  ItemdefinitionsWeaponappearances,
} from '@nw-data/generated'
import { combineLatest } from 'rxjs'
import { NwDbService } from '~/nw'
import { TransmogItem, TransmogService, getAppearanceId, matchTransmogCateogry } from './transmog.service'
import { eqCaseInsensitive } from '~/utils'
import { ModelViewerService } from '~/widgets/model-viewer'

@Injectable()
export class AppearanceDetailStore extends ComponentStore<{ appearanceId: string; parentItemId: string }> {
  public readonly appearanceId$ = this.select(({ appearanceId }) => appearanceId)

  public readonly itemAppearance$ = this.db.itemAppearance(this.appearanceId$)
  public readonly weaponAppearance$ = this.db.weaponAppearance(this.appearanceId$)
  public readonly instrumentAppearance$ = this.db.instrumentAppearance(this.appearanceId$)

  @Output()
  public readonly appearance$ = this.select(
    combineLatest({
      item: this.itemAppearance$,
      weapon: this.weaponAppearance$,
      instrument: this.instrumentAppearance$,
    }),
    (it) => it.item || it.weapon || it.instrument
  )

  public readonly models$ = this.select(inject(ModelViewerService).byAppearanceId(this.appearanceId$), (it) => it)
  public readonly icon$ = this.select(this.appearance$, (it) => it?.IconPath || NW_FALLBACK_ICON)
  public readonly name$ = this.select(this.appearance$, (it) => it?.Name)
  public readonly description$ = this.select(this.appearance$, (it) => it?.Description)
  public readonly category$ = this.select(
    combineLatest({
      appearance: this.appearance$,
      categories: this.service.categories$,
    }),
    ({ appearance, categories }) => {
      if (!appearance) {
        return null
      }
      return categories.find((it) => matchTransmogCateogry(it, appearance))
    }
  )
  public readonly transmog$ = this.select(this.service.byAppearanceId(this.appearanceId$), (it) => it)
  public readonly similarAppearances$ = this.select(
    combineLatest({
      appearance: this.appearance$,
      categories: this.service.categories$,
      similar: this.service.byModel(this.appearance$),
    }),
    ({ appearance, categories, similar }) => {
      return similar
        .filter(
          (it) => it.appearance?.ItemClass?.length > 0 && getAppearanceId(it.appearance) !== getAppearanceId(appearance)
        )
        .map((it) => {
          return {
            category: categories.find((it) => matchTransmogCateogry(it, appearance)),
            transmog: it,
          }
        })
    }
  )
  public readonly similarItems$ = this.select(
    combineLatest({
      transmog: this.transmog$,
      parentId: this.select(({ parentItemId }) => parentItemId),
    }),
    selectItems
  )

  public constructor(protected db: NwDbService, private service: TransmogService) {
    super({ appearanceId: null, parentItemId: null })
  }

  public load(
    idOrItem:
      | string
      | Itemappearancedefinitions
      | ItemdefinitionsInstrumentsappearances
      | ItemdefinitionsWeaponappearances
  ) {
    if (typeof idOrItem === 'string') {
      this.patchState({ appearanceId: idOrItem })
    } else {
      this.patchState({ appearanceId: getAppearanceId(idOrItem) })
    }
  }
}

function selectItems({ transmog, parentId }: { transmog: TransmogItem; parentId: string }) {
  let items = transmog?.items || []
  if (parentId) {
    items = items.filter((it) => !eqCaseInsensitive(getItemId(it), parentId))
  } else {
    items = [...items]
  }
  return items.sort(itemsComparator)
}

function itemsComparator(nodeA: ItemDefinitionMaster, nodeB: ItemDefinitionMaster) {
  const a = nodeA
  const b = nodeB
  const isGearA = isMasterItem(a) && (isItemArmor(a) || isItemJewelery(a) || isItemWeapon(a))
  const isGearB = isMasterItem(b) && (isItemArmor(b) || isItemJewelery(b) || isItemWeapon(b))
  if (isGearA !== isGearB) {
    return isGearA ? -1 : 1
  }
  const isNamedA = isMasterItem(a) && isItemNamed(a)
  const isNamedB = isMasterItem(b) && isItemNamed(b)
  if (isNamedA !== isNamedB) {
    return isNamedA ? -1 : 1
  }
  const rarrityA = getItemRarity(a)
  const rarrityB = getItemRarity(b)
  if (rarrityA !== rarrityB) {
    return rarrityA >= rarrityB ? -1 : 1
  }
  return getItemId(a).localeCompare(getItemId(b))
}
