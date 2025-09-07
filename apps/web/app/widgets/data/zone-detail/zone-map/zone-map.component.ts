import { CommonModule } from '@angular/common'
import { Component, computed, inject, input, output, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { IonButtons, IonSegment, IonSegmentButton } from '@ionic/angular/standalone'
import { Feature } from 'geojson'
import { sortBy, uniqBy } from 'lodash'
import { TranslateService } from '~/i18n'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgDice, svgFilter, svgFire, svgFont, svgGears, svgHouse, svgSkull, svgTags, svgWheat } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { GameMapComponent, GameMapCoordsComponent, GameMapHost, GameMapLayerDirective, GameMapMouseTipDirective } from '~/widgets/game-map'
import { gameMapOptionsForMapIds } from '~/widgets/game-map/utils'
import { LootModule } from '~/widgets/loot'
import { VitalDetailModule } from '../../vital-detail'
import { MapFilterSegmentComponent } from './filter-segment.component'
import { MapFilterVitalsComponent } from './filter-vitals.component'
import { ZoneMapStore } from './zone-map.store'
import { PropertyGridModule } from '../../../../ui/property-grid'

@Component({
  selector: 'nwb-zone-map',
  templateUrl: './zone-map.component.html',
  imports: [
    CommonModule,
    FormsModule,
    FormsModule,
    GameMapComponent,
    GameMapCoordsComponent,
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
  providers: [ZoneMapStore, GameMapHost],
  host: {
    class: 'block',
  },
})
export class ZoneDetailMapComponent {
  private tl8 = inject(TranslateService)
  private mapHost = inject(GameMapHost)
  protected store = inject(ZoneMapStore)
  protected currentMapId = this.store.mapId
  protected segment = signal('g')
  protected segments = computed(() => {
    return [
      { id: 'g', open: false, label: 'Gatherables', source: this.store.gatherables(), icon: svgWheat },
      { id: 'v', open: false, label: 'Vitals', vitals: this.store.vitals(), icon: svgSkull },
      { id: 's', open: true, label: 'Structures', source: this.store.houses(), icon: svgHouse },
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

  protected selectSegment(value: string) {
    this.segment.set(value)
  }

  protected mapsOptions = computed(() => {
    this.tl8.locale.value()
    const result = gameMapOptionsForMapIds(this.store.mapIds() || [])
    return sortBy(result, (it) => this.tl8.get(it.label))
  })

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
