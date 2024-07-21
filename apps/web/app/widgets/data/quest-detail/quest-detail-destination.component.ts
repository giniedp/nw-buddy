import { Component, inject } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { QuestDetailStore } from './quest-detail.store'

export interface Chat {
  isPlayer: boolean
  text: string
}

@Component({
  standalone: true,
  selector: 'nwb-quest-detail-destination',
  template: `
    @if (destination; as npc) {
      <h3 class="font-bold">Return to</h3>
      <div class="flex flex-row items-center gap-1">
        <a [nwLinkTooltip]="['npc', npc.NPCId]" class="flex-none">
          <img [src]="'/assets/icons/menu/icon_head.png'" class="w-5 h-5" />
        </a>
        <a class="flex-1 link-hover" [routerLink]="['npc', npc.NPCId] | nwLink">
          <span>{{ npc.GenericName | nwText }}</span>
        </a>
      </div>
    }
  `,
  imports: [NwModule, RouterModule],
  host: {
    class: 'block',
    '[class.hidden]': '!destination',
  },
})
export class QuestDetailDestinationComponent {
  private detail = inject(QuestDetailStore)
  protected get destination() {
    return this.detail.npcDestination()
  }
}
