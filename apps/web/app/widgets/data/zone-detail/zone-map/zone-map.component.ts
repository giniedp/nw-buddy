import { CommonModule } from '@angular/common'
import { Component, computed, effect, inject, input, output, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { IonButton, IonButtons, IonMenuButton, IonSegment, IonSegmentButton } from '@ionic/angular/standalone'
import { sortBy } from 'lodash'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgDice, svgFilter, svgFire, svgFont, svgTags } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { humanize } from '~/utils'
import { GameMapComponent, GameMapProxyService } from '~/widgets/game-map'
import { GameMapLayerDirective } from '~/widgets/game-map/game-map-layer.component'
import { LootModule } from '~/widgets/loot'
import { VitalDetailModule } from '../../vital-detail'
import { FilterDataProperties, VitalDataProperties } from './data/types'
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
  providers: [ZoneMapStore, GameMapProxyService],
  host: {
    class: 'block',
  },
})
export class ZoneDetailMapComponent {
  protected store = inject(ZoneMapStore)
  protected mapId = this.store.mapId
  protected segment = signal('gathering')
  protected segments = computed(() => {
    return [
      { id: 'gathering', label: 'Gathering', source: this.store.gatherables() },
      { id: 'lore', label: 'Lore', source: this.store.lore() },
      { id: 'vitals', label: 'Vitals', vitals: this.store.vitals() },
    ]
  })
  protected activeSegment = computed(() => this.segments().find((it) => it.id === this.segment()))
  protected hoverVitals = signal<VitalDataProperties[]>(null)
  protected hoverFilters = signal<FilterDataProperties[]>(null)

  public pinMenu = input(false)

  protected filterIcon = svgFilter
  protected labelsIcon = svgTags
  protected diceIcon = svgDice
  protected fireIcon = svgFire
  protected fontIcon = svgFont

  public zoneClicked = output<string>()
  public vitalClicked = output<string>()

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

  public constructor() {
    effect(() => {
      console.log({ activeSegment: this.activeSegment() })
    })
  }
}
