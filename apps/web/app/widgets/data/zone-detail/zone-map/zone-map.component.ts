import { CommonModule } from '@angular/common'
import { Component, EventEmitter, Output, computed, inject, input, output } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { TooltipModule } from '~/ui/tooltip'
import { GameMapComponent, GameMapProxyService } from '~/widgets/game-map'
import { GameMapLayerDirective } from '~/widgets/game-map/game-map-layer.component'
import { WorldMapComponent } from '~/widgets/world-map'
import { ZoneMapStore } from './zone-map.store'
import { uniq } from 'lodash'
import { MapFilterSectionComponent } from './filter-section.component'
import { IonButton, IonButtons, IonMenu, IonMenuButton } from '@ionic/angular/standalone'
import { LayoutModule } from '~/ui/layout'
import { svgFilter } from '~/ui/icons/svg'

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
    MapFilterSectionComponent,
    LayoutModule,
    IonButton,
    IonButtons,
    IonMenuButton,
  ],
  providers: [ZoneMapStore, GameMapProxyService],
  host: {
    class: 'block',
  },
})
export class ZoneDetailMapComponent {
  protected store = inject(ZoneMapStore)
  protected sections = computed(() => {
    return uniq(this.store.gatherables().map((it) => it.section)).sort()
  })

  public pinMenu = input(false)

  protected filterIcon = svgFilter

  public zoneClicked = output<string>()
  public vitalClicked = output<string>()
}
