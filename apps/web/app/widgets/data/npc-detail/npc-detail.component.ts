import { CommonModule } from '@angular/common'
import { Component, effect, inject, input, untracked } from '@angular/core'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { NpcDetailMapComponent } from './npc-detail-map.component'
import { NpcDetailStore } from './npc-detail.store'

@Component({
  selector: 'nwb-npc-detail',
  templateUrl: './npc-detail.component.html',
  imports: [ItemFrameModule, NwModule, CommonModule, NpcDetailMapComponent],
  providers: [NpcDetailStore],
  host: {
    class: 'block',
  },
})
export class NpcDetailComponent {
  public store = inject(NpcDetailStore)
  public npcId = input<string>(null)
  #fxLoad = effect(() => {
    const npcId = this.npcId()
    untracked(() => this.store.load(npcId))
  })
}
