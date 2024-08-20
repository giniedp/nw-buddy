import { CommonModule } from '@angular/common'
import { Component, EventEmitter, Output, computed, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { TooltipModule } from '~/ui/tooltip'
import { GameMapComponent } from '~/widgets/game-map'
import { GameMapLayerDirective } from '~/widgets/game-map/game-map-layer.component'
import { WorldMapComponent } from '~/widgets/world-map'
import { ZoneMapStore } from './zone-map.store'
import { uniq } from 'lodash'
import { MapFilterSectionComponent } from './filter-section.component'

@Component({
  standalone: true,
  selector: 'nwb-zone-map',
  templateUrl: './zone-map.component.html',
  imports: [
    CommonModule,
    NwModule,
    WorldMapComponent,
    GameMapComponent,
    GameMapLayerDirective,
    TooltipModule,
    FormsModule,
    IconsModule,
    MapFilterSectionComponent
  ],
  providers: [ZoneMapStore],
  host: {
    class: 'flex flex-col relative',
  },
})
export class ZoneDetailMapComponent {
  protected store = inject(ZoneMapStore)

  protected sections = computed(() => {
    return uniq(this.store.gatherables().map((it) => it.section)).sort()
  })

  @Output()
  public zoneClicked = new EventEmitter<string>()

  @Output()
  public vitalClicked = new EventEmitter<string>()
}
