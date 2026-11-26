import { CommonModule } from '@angular/common'
import { Component, computed, inject, input, output, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { IonButtons, IonSegment, IonSegmentButton } from '@ionic/angular/standalone'
import { Feature } from 'geojson'
import { uniqBy } from 'lodash'
import { TranslateService } from '~/i18n'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgDice, svgFilter, svgFire, svgFont, svgGears, svgHouse, svgSkull, svgTags, svgWheat } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import {
  GameMapComponent,
  GameMapControlDirective,
  GameMapCoordsComponent,
  GameMapHost,
  GameMapLayerDirective,
  GameMapMouseTipDirective,
} from '~/widgets/game-map'
import { LootModule } from '~/widgets/loot'
import { PropertyGridModule } from '../../../../ui/property-grid'
import { VitalDetailModule } from '../../vital-detail'
import { MapFilterSegmentComponent } from './filter-segment.component'
import { MapFilterVitalsComponent } from './filter-vitals.component'
import { FilterVitalsStore } from './filter-vitals.store'
import { ZoneMapSegment, ZoneMapStore } from './zone-map.store'

@Component({
  selector: 'nwb-zone-map',
  templateUrl: './zone-map.component.html',
  imports: [
    CommonModule,
    FormsModule,
    FormsModule,
    GameMapComponent,
    GameMapCoordsComponent,
    GameMapControlDirective,
    IconsModule,
    IonButtons,
    IonSegment,
    IonSegmentButton,
    LayoutModule,
    MapFilterSegmentComponent,
    MapFilterVitalsComponent,
    GameMapLayerDirective,
    GameMapMouseTipDirective,
    PropertyGridModule,
    NwModule,
    TooltipModule,
    VitalDetailModule,
    LootModule,
  ],
  providers: [ZoneMapStore, FilterVitalsStore, GameMapHost],
  host: {
    class: 'block',
  },
})
export class ZoneDetailMapComponent {
  private mapHost = inject(GameMapHost)

  protected store = inject(ZoneMapStore)

  protected segment = this.store.segment
  protected segments = computed(() => {
    return [
      { id: 'g' as const, label: 'Gatherables', source: this.store.gatherables(), icon: svgWheat },
      { id: 'v' as const, label: 'Vitals', vitals: this.store.vitals(), icon: svgSkull },
      { id: 's' as const, label: 'Structures', source: this.store.houses(), icon: svgHouse },
    ]
  })
  protected activeSegment = computed(() => this.segments().find((it) => it.id === this.segment()))

  public pinMenu = input(false)
  public zoneId = input<string | number>()
  public mapId = input(null, {
    transform: (it: string) => {
      if (it) {
        this.store.setMap(it)
      }
      return it
    },
  })
  public mapIdChange = output<string>()

  public showMapOptions = input<boolean>(true)
  public zoneClicked = output<string>()
  public vitalClicked = output<string>()

  protected filterIcon = svgFilter
  protected labelsIcon = svgTags
  protected diceIcon = svgDice
  protected fireIcon = svgFire
  protected fontIcon = svgFont
  protected toolsIcon = svgGears
  protected hoverZoneConfigs = signal<Array<{ name: string; data: any }>>([])

  protected selectSegment(value: ZoneMapSegment) {
    this.store.setSegment(value)
  }

  protected mapsOptions = this.store.mapOptions

  protected handleMapIdSelected(mapId: string) {
    this.store.setMap(mapId)
    this.mapIdChange.emit(mapId)
  }

  protected handleMouseEnterZoneConfig(features: Feature[]) {
    this.mapHost.map.getCanvas().style.cursor = 'pointer'

    const items = uniqBy(
      features.map((it) => {
        return {
          name: it.properties['name'],
          data: JSON.parse(it.properties['data']),
        }
      }),
      'name',
    )
    this.hoverZoneConfigs.set(items)
  }

  protected handleMouseMoveZoneConfig(features: Feature[]) {
    const items = uniqBy(
      features.map((it) => {
        return {
          name: it.properties['name'],
          data: JSON.parse(it.properties['data']),
        }
      }),
      'name',
    )
    this.hoverZoneConfigs.set(items)
  }

  protected handleMouseLeaveZoneConfig(features: Feature[]) {
    this.mapHost.map.getCanvas().style.cursor = ''
    this.hoverZoneConfigs.set(null)
  }
}
