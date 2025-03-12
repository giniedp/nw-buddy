import { Component, computed, effect, inject, input, untracked, viewChild } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgExpand } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import {
  GameMapComponent,
  GameMapCoordsComponent,
  GameMapLayerDirective,
  GameMapMouseTipDirective,
} from '~/widgets/game-map'
import { LoreDetailMapStore } from './lore-detail-map.store'

@Component({
  selector: 'nwb-lore-detail-map',
  templateUrl: './lore-detail-map.component.html',
  imports: [
    NwModule,
    TooltipModule,
    FormsModule,
    IconsModule,
    GameMapComponent,
    GameMapLayerDirective,
    GameMapCoordsComponent,
    GameMapMouseTipDirective,
  ],
  providers: [LoreDetailMapStore],
  host: {
    class: 'block relative',
    '[class.hidden]': '!isVisible',
  },
})
export class LoreItemDetailMapComponent {
  protected store = inject(LoreDetailMapStore)
  protected iconExpand = svgExpand
  public loreId = input.required<string>()

  protected mapComponent = viewChild(GameMapComponent)
  protected showLabels = computed(() => {
    const type = this.store.item()?.Type
    return type === 'Default' || type === 'Chapter'
  })

  protected get isVisible() {
    return !!this.store.mapId()
  }

  public constructor() {
    this.store.load()
    effect(() => {
      const mapId = this.store.mapId()
      const mapIds = this.store.mapIds()
      if (!mapIds.includes(mapId)) {
        untracked(() => {
          this.store.selectMap({ mapId: mapIds[0] })
        })
      }
    })
    effect(() => {
      const loreId = this.loreId()
      untracked(() => {
        this.store.select({ id: loreId })
      })
    })
  }

  public toggleId(id: string) {
    this.store.toggleId({ id })
  }

  public isIdDisabled(id: string) {
    return this.store.disabledIds().includes(id)
  }
}
