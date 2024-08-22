import { CommonModule } from '@angular/common'
import { Component, computed, inject, input, output } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { IonButton, IonButtons, IonMenuButton } from '@ionic/angular/standalone'
import { uniq } from 'lodash'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgFilter, svgTags } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { GameMapComponent, GameMapProxyService } from '~/widgets/game-map'
import { GameMapLayerDirective } from '~/widgets/game-map/game-map-layer.component'
import { WorldMapComponent } from '~/widgets/world-map'
import { MapFilterSectionComponent } from './filter-section.component'
import { ZoneMapStore } from './zone-map.store'

@Component({
  standalone: true,
  selector: 'nwb-zone-map',
  templateUrl: './zone-map.component.html',
  imports: [
    CommonModule,
    FormsModule,
    GameMapComponent,
    GameMapLayerDirective,
    IconsModule,
    IonButton,
    IonButtons,
    IonMenuButton,
    LayoutModule,
    MapFilterSectionComponent,
    NwModule,
    TooltipModule,
    WorldMapComponent,
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
  protected labelsIcon = svgTags
  public zoneClicked = output<string>()
  public vitalClicked = output<string>()
}
