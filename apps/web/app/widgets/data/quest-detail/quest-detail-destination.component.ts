import { Component, inject } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { QuestDetailStore } from './quest-detail.store'

export interface Chat {
  isPlayer: boolean
  text: string
}

@Component({
  selector: 'nwb-quest-detail-destination',
  template: `
    @for (npc of destination(); track $index; let first = $first) {
      @if (first) {
        <h3 class="font-bold">Return to</h3>
      }
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
    '[class.hidden]': '!destination()?.length',
  },
})
export class QuestDetailDestinationComponent {
  private detail = inject(QuestDetailStore)
  public destination = this.detail.npcDestination
}
