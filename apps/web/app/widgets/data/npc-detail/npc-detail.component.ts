import { Component, Input, inject } from '@angular/core'
import { patchState } from '@ngrx/signals'
import { NpcDetailStore } from './npc-detail.store'
import { ItemDetailModule } from '../item-detail'
import { ItemFrameModule } from '~/ui/item-frame'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { NwModule } from '~/nw'
import { CommonModule } from '@angular/common'
import { NpcDetailMapComponent } from './npc-detail-map.component'

@Component({
  standalone: true,
  selector: 'nwb-npc-detail',
  templateUrl: './npc-detail.component.html',
  imports: [ItemFrameModule, NwModule, CommonModule, NpcDetailMapComponent],
  providers: [NpcDetailStore],
  host: {
    class: 'block'
  }
})
export class NpcDetailComponent {
  protected store = inject(NpcDetailStore)

  @Input()
  public set npcId(value: string) {
    patchState(this.store, { recordId: value })
  }
  public get npcId() {
    return this.store.recordId()
  }

  public get name() {
    return this.store.name()
  }
  public get title() {
    return this.store.title()
  }
  public get icon() {
    return NW_FALLBACK_ICON
  }

  public get siblings() {
    return this.store.siblings()
  }
}
