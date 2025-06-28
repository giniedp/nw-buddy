import { CommonModule } from '@angular/common'
import { Component, computed, inject, input, output, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { IonButtons, IonSegment, IonSegmentButton } from '@ionic/angular/standalone'
import { sortBy } from 'lodash'
import { TranslateService } from '~/i18n'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgDice, svgFilter, svgFire, svgFont, svgHouse, svgSkull, svgTags, svgWheat } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { GameMapComponent, GameMapCoordsComponent, GameMapHost } from '~/widgets/game-map'
import { gameMapOptionsForMapIds } from '~/widgets/game-map/utils'
import { LootModule } from '~/widgets/loot'
import { VitalDetailModule } from '../../vital-detail'
import { MapFilterSegmentComponent } from './filter-segment.component'
import { MapFilterVitalsComponent } from './filter-vitals.component'
import { ZoneMapStore } from './zone-map.store'

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
    this.tl8.locale.value()
    const result = gameMapOptionsForMapIds(this.store.mapIds() || [])
    return sortBy(result, (it) => this.tl8.get(it.label))
  })
}
