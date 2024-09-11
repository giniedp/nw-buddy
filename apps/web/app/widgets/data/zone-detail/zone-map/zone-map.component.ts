import { CommonModule } from '@angular/common'
import { Component, computed, inject, input, output, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { IonButton, IonButtons, IonMenuButton, IonSegment, IonSegmentButton } from '@ionic/angular/standalone'
import { sortBy } from 'lodash'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgDice, svgFilter, svgFire, svgFont, svgHouse, svgSkull, svgTags, svgWheat } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { humanize } from '~/utils'
import { GameMapComponent, GameMapCoordsComponent, GameMapHost } from '~/widgets/game-map'
import { GameMapLayerDirective } from '~/widgets/game-map/game-map-layer.component'
import { LootModule } from '~/widgets/loot'
import { VitalDetailModule } from '../../vital-detail'
import { MapFilterSectionComponent } from './filter-section.component'
import { MapFilterSegmentComponent } from './filter-segment.component'
import { MapFilterVitalsComponent } from './filter-vitals.component'
import { ZoneMapStore } from './zone-map.store'

@Component({
  standalone: true,
  selector: 'nwb-zone-map',
  templateUrl: './zone-map.component.html',
  imports: [
    CommonModule,
    FormsModule,
    FormsModule,
    GameMapComponent,
    GameMapLayerDirective,
    GameMapCoordsComponent,
    IconsModule,
    IonButton,
    IonButtons,
    IonMenuButton,
    IonSegment,
    IonSegmentButton,
    LayoutModule,
    MapFilterSectionComponent,
    MapFilterSegmentComponent,
    MapFilterVitalsComponent,
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

  protected selectSegment(value: string) {
    this.segment.set(value)
  }

  protected mapsOptions = computed(() => {
    const result = this.store.mapIds().map((it) => {
      return {
        value: it,
        label: humanize(it),
      }
    })
    return sortBy(result, (it) => it.label)
  })
}
