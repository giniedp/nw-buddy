import { Injectable, inject } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { Areadefinitions, PoiDefinition } from '@nw-data/generated'
import { map } from 'rxjs'
import { NwDbService } from '~/nw'
import { selectStream, tapDebug } from '~/utils'

@Injectable()
export class ZoneDetailStore extends ComponentStore<{ recordId: string | number }> {
  protected db = inject(NwDbService)

  public readonly recordId$ = this.select(({ recordId }) => (recordId ? Number(recordId) : null))

  public readonly territory$ = selectStream(this.db.territory(this.recordId$))
  public readonly poi$ = selectStream(this.db.poi(this.recordId$))
  public readonly area$ = selectStream(this.db.area(this.recordId$))
  public readonly record$ = selectStream({
    territory: this.territory$,
    area: this.area$,
    poi: this.poi$,
  }, ({ territory, area, poi }) => territory || area || poi)

  public readonly metadata$ = selectStream(
    this.db.territoryMetadata(
      this.recordId$.pipe(
        map((it) => {
          if (it == null) {
            return null
          }
          if (it < 10) {
            return `0${it}`
          }
          return String(it)
        }),
      ),
    ),
  ).pipe(tapDebug('metadata'))

  public readonly icon$ = this.select(
    this.poi$,
    (it) => it?.MapIcon || it?.CompassIcon || it?.TooltipBackground || NW_FALLBACK_ICON,
  )
  public readonly name$ = this.select(this.record$, (it) => it?.NameLocalizationKey)
  public readonly description$ = this.select(this.poi$, (it) => {
    return it?.NameLocalizationKey ? `${it.NameLocalizationKey}_description` : null
  })
  public readonly type$ = selectStream({
    territory: this.territory$,
    area: this.area$,
    poi: this.poi$,
  }, ({ territory, area, poi }) => {
    if (territory) {
      return 'Territory'
    }
    if (area) {
      return 'Area'
    }
    if (poi) {
      return 'POI'
    }
    return null
  })
  public constructor() {
    super({ recordId: null })
  }

  public load(idOrItem: string | PoiDefinition) {
    if (typeof idOrItem === 'string') {
      this.patchState({ recordId: idOrItem })
    } else {
      this.patchState({ recordId: idOrItem.TerritoryID })
    }
  }
}
