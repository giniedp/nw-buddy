import { Injectable, inject } from '@angular/core'
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
import { Observable, combineLatest, map } from 'rxjs'
import { NwDbService } from '~/nw'
import { eqCaseInsensitive, selectStream } from '~/utils'
import { ModelViewerService } from '~/widgets/model-viewer'
import {
  TransmogAppearance,
  TransmogGender,
  TransmogItem,
  TransmogService,
  getAppearanceCategory,
  getAppearanceId,
  isAppearanceOfGender,
} from '../transmog'

@Injectable()
export class AppearanceDetailStore extends ComponentStore<{
  appearanceId: string
  parentItemId: string
  vairant: TransmogGender
}> {
  public readonly appearanceNameIdOrAlike$ = this.select(({ appearanceId }) => appearanceId)

  public readonly instrumentAppearance$ = this.db.instrumentAppearance(this.appearanceNameIdOrAlike$)
  public readonly weaponAppearance$ = this.db.weaponAppearance(this.appearanceNameIdOrAlike$)
  public readonly itemAppearance$ = selectStream(
    {
      appearance: this.db.itemAppearance(this.appearanceNameIdOrAlike$),
      byName: this.db.itemAppearancesByName(this.appearanceNameIdOrAlike$),
      variant: this.select(({ vairant }) => vairant),
    },
    ({ appearance, byName, variant }) => {
      const found = byName.find((it) => isAppearanceOfGender(it, variant))
      return found || appearance || byName[0]
    }
  )
  public readonly appearance$ = this.select(
    this.itemAppearance$,
    this.weaponAppearance$,
    this.instrumentAppearance$,
    (a, b, c): TransmogAppearance => a || b || c
  )
  public readonly appearanceId$ = this.select(this.appearance$, getAppearanceId)
  public readonly category$ = this.select(this.appearance$, getAppearanceCategory)
  public readonly models$ = this.select(inject(ModelViewerService).byAppearanceId(this.appearanceId$), (it) => it)
  public readonly icon$ = this.select(this.appearance$, (it) => it?.IconPath || NW_FALLBACK_ICON)
  public readonly name$ = this.select(this.appearance$, (it) => it?.Name)
  public readonly description$ = this.select(this.appearance$, (it) => it?.Description)
  public readonly transmog$ = this.select(this.service.byAppearance(this.appearance$), (it) => it)
  public readonly similarTransmogs$ = this.select(this.service.withSameModelAs(this.appearance$, true), (list) => {
    return list.filter((it) => it.appearance?.ItemClass?.length > 0)
  })
  public readonly similarItems$ = this.select(
    combineLatest({
      transmog: this.transmog$,
      parentId: this.select(({ parentItemId }) => parentItemId),
    }),
    selectItems
  )

  public constructor(protected db: NwDbService, private service: TransmogService) {
    super({ appearanceId: null, parentItemId: null, vairant: null })
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

  public loadVariant = this.effect((variant$: Observable<TransmogGender>) => {
    return variant$.pipe(map((it) => this.patchState({ vairant: it })))
  })
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
