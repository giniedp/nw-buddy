import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, inject } from '@angular/core'
import { patchState } from '@ngrx/signals'
import { TerritoryDefinition, VitalsData } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridCell, PropertyGridModule } from '~/ui/property-grid'
import { ZoneDetailMapComponent } from './zone-detail-map.component'
import { ZoneDetailStore } from './zone-detail.store'

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
    this.store.load(value)
  }

  @Output()
  public vitalClicked = new EventEmitter<string>()

  @Output()
  public zoneClicked = new EventEmitter<string>()

  public readonly recordId = this.store.recordId
  public readonly icon = this.store.icon
  public readonly name = this.store.name
  public readonly image = this.store.image
  public readonly description = this.store.description
  public readonly properties = this.store.properties
  public readonly type = this.store.type
  public readonly subtitle = computed(() => {
    const territory = this.store.territory()
    if (territory?.IsArea) {
      return `AI Level: ${territory.AIVariantLevelOverride}`
    }
    if (territory) {
      return [territory.RecommendedLevel, territory.MaximumLevel]
        .filter((it) => !!it)
        .map((it) => (it > 65 ? `${65}+` : it))
        .join(' - ')
    }
    return ''
  })

  public markVital(vital: VitalsData) {
    patchState(this.store, { markedVitalId: vital?.VitalsID || null })
  }

  protected onVitalClicked(vitalId: string) {
    this.vitalClicked.emit(vitalId)
  }

  protected onZoneClicked(zoneId: string) {
    this.zoneClicked.emit(zoneId)
  }

  public formatValue = (value: any, key: keyof TerritoryDefinition): PropertyGridCell[] => {
    switch (key) {
      case 'TerritoryID': {
        return [
          {
            value: String(value),
            primary: true,
            routerLink: ['poi', value],
          },
        ]
      }
      case 'LootTags': {
        return (value as TerritoryDefinition['LootTags']).map((it) => {
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
