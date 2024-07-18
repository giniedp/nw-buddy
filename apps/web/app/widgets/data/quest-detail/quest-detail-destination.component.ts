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
  templateUrl: './quest-detail-destination.component.html',
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
