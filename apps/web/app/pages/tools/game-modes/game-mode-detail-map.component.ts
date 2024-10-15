import { Component, computed, effect, inject, input, untracked } from '@angular/core'
import { VitalsBaseData } from '@nw-data/generated'
import { ZoneDetailMapComponent } from '~/widgets/data/zone-detail/zone-map/zone-map.component'
import { GameMapComponent, GameMapLayerDirective } from '~/widgets/game-map'
import { GameModeDetailMapStore } from './game-mode-detail-map.store'
import { CommonModule } from '@angular/common'

@Component({
  standalone: true,
  selector: 'nwb-game-mode-detail-map',
  template: `
    @if (mapId()) {
      <nwb-map
        class="w-full h-full rounded-md transition-all bg-opacity-0 hover:bg-opacity-10"
        [mapId]="mapId()"
        [fitBounds]="bounds()"
        [fitBoundsOptions]="{ animate: false }"
      >
        @if (vitals(); as data) {
          <ng-container
            #mapLayer="mapLayer"
            [nwbMapLayer]="'vitals'"
            [disabled]="false"
            [data]="data"
            [filter]="filter()"
          />
        }
      </nwb-map>
    }
    <ng-content />
  `,
  imports: [CommonModule, GameMapComponent, GameMapLayerDirective, ZoneDetailMapComponent],
  providers: [GameModeDetailMapStore],
  host: {
    class: 'block relative rounded-md overflow-clip',
  },
})
export class GameModeDetailMapComponent {
  public gameModeId = input.required<string>()
  public creatures = input<VitalsBaseData[]>([])
  public highlight = input<string>()

  protected store = inject(GameModeDetailMapStore)
  protected mapId = this.store.mapId
  protected bounds = this.store.bounds
  protected vitals = this.store.vitals
  protected filter = computed(() => {
    const highlight = this.highlight()?.toLowerCase()
    if (!highlight) {
      return null
    }
    return ['==', ['get', 'id'], highlight] as any
  })
  public constructor() {
    effect(() => {
      const gameModId = this.gameModeId()
      untracked(() => {
        this.store.load({ gameModId })
      })
    })
    effect(() => {
      const creatures = this.creatures()
      const mapId = this.mapId()
      untracked(() => {
        this.store.loadVitals({ vitals: creatures || [], mapId: mapId })
      })
    })
    effect(() => {
      console.log({ vitals: this.vitals() })
    })
  }
}
