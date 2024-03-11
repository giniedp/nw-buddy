import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { Areadefinitions, PoiDefinition, Territorydefinitions, Vitals } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { selectSignal } from '~/utils'
import { ZoneDetailMapComponent } from './zone-detail-map.component'
import { ZoneDetailStore } from './zone-detail.store'
import { PropertyGridCell, PropertyGridModule } from '~/ui/property-grid'
import { ZoneDefinition } from '@nw-data/common'

@Component({
  standalone: true,
  selector: 'nwb-zone-detail',
  templateUrl: './zone-detail.component.html',
  styleUrl: './zone-detail.component.scss',
  exportAs: 'detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, ZoneDetailMapComponent, PropertyGridModule],
  providers: [DecimalPipe, ZoneDetailStore],
  host: {
    class: 'flex flex-col rounded-md overflow-clip',
  },
})
export class ZoneDetailComponent {
  public readonly store = inject(ZoneDetailStore)

  @Input()
  public set zoneId(value: string | number) {
    this.store.patchState({ recordId: value })
  }

  @Output()
  public vitalClicked = new EventEmitter<string>()

  @Output()
  public zoneClicked = new EventEmitter<string>()

  public readonly recordId = selectSignal(this.store.recordId$, (it) => String(it))
  public readonly icon = toSignal(this.store.icon$)
  public readonly name = toSignal(this.store.name$)
  public readonly image = toSignal(this.store.image$)
  public readonly description = toSignal(this.store.description$)
  public readonly properties = toSignal(this.store.properties$)
  public readonly type = toSignal(this.store.type$)
  public readonly subtitle = selectSignal({
    territory: this.store.territory$,
    area: this.store.area$,
    poi: this.store.poi$,
  }, ({ territory, area, poi }) => {
    if (territory) {
      return [territory.RecommendedLevel, territory.MaximumLevel]
        .filter((it) => !!it)
        .map((it) => it > 65 ? `${65}+` : it)
        .join(' - ')
    }
    if (area) {
      return `AI Level: ${area.AIVariantLevelOverride}`
    }
    return ''
  })

  public markVital(vital: Vitals) {
    this.store.patchState({ markedVitalId: vital?.VitalsID || null })
  }

  protected onVitalClicked(vitalId: string) {
    this.vitalClicked.emit(vitalId)
  }

  protected onZoneClicked(zoneId: string) {
    this.zoneClicked.emit(zoneId)
  }

  
  public formatValue = (value: any, key: keyof Territorydefinitions): PropertyGridCell[] => {
    switch (key) {

      case 'TerritoryID': {
        return [
          {
            value: String(value),
            primary: true,
            routerLink: ['/zones/table', value],
          },
        ]
      }
      case 'LootTags': {
        return (value as Territorydefinitions['LootTags']).map((it) => {
          return {
            value: it,
            secondary: true,
            bold: true,
          }
        })
      }

      default: {
        return [
          {
            value: String(value),
            accent: typeof value === 'number',
            info: typeof value === 'boolean',
            bold: typeof value === 'boolean',
          },
        ]
      }
    }
  }

}
