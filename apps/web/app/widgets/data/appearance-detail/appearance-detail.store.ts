import { computed, effect, inject } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
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
import { ArmorAppearanceDefinitions, MasterItemDefinitions, WeaponAppearanceDefinitions } from '@nw-data/generated'
import { combineLatest, defer, map } from 'rxjs'
import { injectNwData, withStateLoader } from '~/data'
import { eqCaseInsensitive } from '~/utils'
import { ModelsService } from '~/widgets/model-viewer'
import {
  TransmogGender,
  TransmogItem,
  TransmogService,
  getAppearanceCategory,
  getAppearanceGender,
  getAppearanceId,
  isAppearanceOfGender,
} from '../transmog'

export interface AppearanceDetailState {
  appearanceIdOrName: string
  parentItemId: string
  variant: TransmogGender
  instrumentAppearance: WeaponAppearanceDefinitions
  weaponAppearance: WeaponAppearanceDefinitions
  itemAppearance: ArmorAppearanceDefinitions
  itemAppearanceByName: ArmorAppearanceDefinitions[]
  mountAppearance: WeaponAppearanceDefinitions
}
export const AppearanceDetailStore = signalStore(
  withState<AppearanceDetailState>({
    appearanceIdOrName: null,
    parentItemId: null,
    variant: null,
    instrumentAppearance: null,
    weaponAppearance: null,
    itemAppearance: null,
    itemAppearanceByName: [],
    mountAppearance: null,
  }),
  withStateLoader((state) => {
    const db = injectNwData()
    return {
      load: async ({
        appearanceIdOrName,
        parentItemId,
        variant,
      }: {
        appearanceIdOrName: string
        parentItemId?: string
        variant?: TransmogGender
      }) => {
        return {
          appearanceIdOrName,
          parentItemId: parentItemId ?? state.parentItemId(),
          variant: variant ?? state.variant(),
          mountAppearance: await db.mountAttachmentsAppearancesById(appearanceIdOrName),
          instrumentAppearance: await db.instrumentAppearancesById(appearanceIdOrName),
          weaponAppearance: await db.weaponAppearancesById(appearanceIdOrName),
          itemAppearance: await db.armorAppearancesById(appearanceIdOrName),
          itemAppearanceByName: await db.armorAppearancesByName(appearanceIdOrName),
        }
      },
    }
  }),
  withMethods((state) => {
    return {
      setVariant(variant: TransmogGender) {
        patchState(state, { variant })
      },
      setParent(parentItemId: string) {
        patchState(state, { parentItemId })
      },
    }
  }),
  withComputed(
    ({ mountAppearance, itemAppearance, itemAppearanceByName, instrumentAppearance, weaponAppearance, variant }) => {
      const appearance = computed(() => {
        const found = itemAppearanceByName()?.find((it) => isAppearanceOfGender(it, variant()))
        return (
          found ||
          itemAppearance() ||
          itemAppearanceByName()?.[0] ||
          weaponAppearance() ||
          instrumentAppearance() ||
          mountAppearance()
        )
      })
      return {
        appearance,
        appearanceId: computed(() => getAppearanceId(appearance())),
        category: computed(() => getAppearanceCategory(appearance())),
        icon: computed(() => appearance()?.IconPath || NW_FALLBACK_ICON),
        name: computed(() => appearance()?.Name),
        description: computed(() => appearance()?.Description),
        variants: computed(() => {
          return itemAppearanceByName()
            ?.map(getAppearanceGender)
            .filter((it) => !!it)
        }),
      }
    },
  ),
  withMethods((store) => {
    const modelService = inject(ModelsService)
    const transmogService = inject(TransmogService)

    const appearanceId$ = toObservable(store.appearanceId)
    const appearance$ = toObservable(store.appearance)
    const parentId$ = toObservable(store.parentItemId)

    const models = () => defer(() => modelService.byAppearanceId(appearanceId$))
    const transmogs = () => defer(() => transmogService.byAppearance(appearance$))
    const transmogsWithSameModel = () => {
      return defer(() => transmogService.withSameModelAs(appearance$, true)).pipe(
        map((list) => list || []),
        map((list) => list.filter((it) => it.appearance?.ItemClass?.length > 0)),
      )
    }
    const similarItems = () =>
      defer(() =>
        combineLatest({
          parentId: parentId$,
          transmog: transmogs(),
        }),
      ).pipe(map(selectItems))
    return {
      models,
      transmogs,
      transmogsWithSameModel,
      similarItems,
      //   public readonly similarItems$ = this.select(
      //     combineLatest({
      //       transmog: this.transmog$,
      //       parentId: this.parentItemId$,
      //     }),
      //     selectItems,
      //   )
    }
  }),
)

// @Injectable()
// export class AppearanceDetailStoreOld extends ComponentStore<{
//   appearanceId: string
//   parentItemId: string
//   vairant: TransmogGender
// }> {
//   private db = injectNwData()
//   private service = inject(TransmogService)

//   public readonly appearanceNameIdOrAlike$ = this.select(({ appearanceId }) => appearanceId)
//   public readonly parentItemId$ = this.select(({ parentItemId }) => parentItemId)

//   public readonly instrumentAppearance$ = this.db.instrumentAppearance(this.appearanceNameIdOrAlike$)
//   public readonly weaponAppearance$ = this.db.weaponAppearance(this.appearanceNameIdOrAlike$)
//   public readonly itemAppearance$ = selectStream(
//     {
//       appearance: this.db.itemAppearance(this.appearanceNameIdOrAlike$),
//       byName: this.db.itemAppearancesByName(this.appearanceNameIdOrAlike$),
//       variant: this.select(({ vairant }) => vairant),
//     },
//     ({ appearance, byName, variant }) => {
//       const found = byName?.find((it) => isAppearanceOfGender(it, variant))
//       return found || appearance || byName?.[0]
//     },
//   )
//   public readonly appearance$ = this.select(
//     this.itemAppearance$,
//     this.weaponAppearance$,
//     this.instrumentAppearance$,
//     (a, b, c): TransmogAppearance => a || b || c,
//   )
//   public readonly appearanceId$ = this.select(this.appearance$, getAppearanceId)
//   public readonly category$ = this.select(this.appearance$, getAppearanceCategory)
//   public readonly models$ = this.select(inject(ModelsService).byAppearanceId(this.appearanceId$), (it) => it)
//   public readonly icon$ = this.select(this.appearance$, (it) => it?.IconPath || NW_FALLBACK_ICON)
//   public readonly name$ = this.select(this.appearance$, (it) => it?.Name)
//   public readonly description$ = this.select(this.appearance$, (it) => it?.Description)
//   public readonly transmog$ = this.select(this.service.byAppearance(this.appearance$), (it) => it)
//   public readonly similarTransmogs$ = this.select(this.service.withSameModelAs(this.appearance$, true), (list) => {
//     return list.filter((it) => it.appearance?.ItemClass?.length > 0)
//   })
//   public readonly similarItems$ = this.select(
//     combineLatest({
//       transmog: this.transmog$,
//       parentId: this.parentItemId$,
//     }),
//     selectItems,
//   )

//   public constructor() {
//     super({ appearanceId: null, parentItemId: null, vairant: null })
//   }

//   public load(idOrItem: string | ArmorAppearanceDefinitions | WeaponAppearanceDefinitions) {
//     if (typeof idOrItem === 'string') {
//       this.patchState({ appearanceId: idOrItem })
//     } else {
//       this.patchState({ appearanceId: getAppearanceId(idOrItem) })
//     }
//   }

//   public loadVariant = this.effect((variant$: Observable<TransmogGender>) => {
//     return variant$.pipe(map((it) => this.patchState({ vairant: it })))
//   })
// }

function selectItems({ transmog, parentId }: { transmog: TransmogItem; parentId: string }) {
  let items = transmog?.items || []
  if (parentId) {
    items = items.filter((it) => !eqCaseInsensitive(getItemId(it), parentId))
  } else {
    items = [...items]
  }
  return items.sort(itemsComparator)
}

function itemsComparator(nodeA: MasterItemDefinitions, nodeB: MasterItemDefinitions) {
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
