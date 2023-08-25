import { Injectable, Output } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import {
  Itemappearancedefinitions,
  ItemdefinitionsInstrumentsappearances,
  ItemdefinitionsWeaponappearances,
} from '@nw-data/generated'
import { combineLatest } from 'rxjs'
import { NwDbService } from '~/nw'
import { TransmogService, getAppearanceId, matchTransmogCateogry } from './transmog.service'

@Injectable()
export class AppearanceDetailStore extends ComponentStore<{ appearanceId: string }> {
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
      return similar.filter(
        (it) => it.appearance?.ItemClass?.length > 0 && getAppearanceId(it.appearance) !== getAppearanceId(appearance)
      ).map((it) => {
        return {
          category: categories.find((it) => matchTransmogCateogry(it, appearance)),
          transmog: it,
        }
      })
    }
  )

  public constructor(protected db: NwDbService, private service: TransmogService) {
    super({ appearanceId: null })
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
