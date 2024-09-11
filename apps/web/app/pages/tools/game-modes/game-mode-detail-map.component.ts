import { Component, inject, input } from '@angular/core'
import { GameMapComponent } from '~/widgets/game-map'
import { GameModeDetailMapStore } from './game-mode-detail-map.store'
import { ZoneDetailMapComponent } from '~/widgets/data/zone-detail/zone-map/zone-map.component'

@Component({
  standalone: true,
  selector: 'nwb-game-mode-detail-map',
  template: `
    @if (store.mapId()) {
      <nwb-map
        class="w-full h-full rounded-md transition-all bg-opacity-0 hover:bg-opacity-10"
        [mapId]="store.mapId()"
        [fitBounds]="store.bounds()"
        [fitBoundsOptions]="{ animate: false }"
      />
    }
  `,
  imports: [GameMapComponent, ZoneDetailMapComponent],
  providers: [GameModeDetailMapStore],
  host: {
    class: 'block relative rounded-md overflow-clip',
  },
})
export class GameModeDetailMapComponent {
  public gameModeId = input.required({
    transform: (value: string) => {
      this.store.load({ gameModId: value })
      return value
    },
  })
  protected store = inject(GameModeDetailMapStore)
}
