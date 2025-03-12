import { Component, computed, inject } from '@angular/core'
import { QuestDetailStore } from './quest-detail.store'
import { NwModule } from '~/nw'

export interface Chat {
  isPlayer: boolean
  text: string
}

@Component({
  selector: 'nwb-quest-detail-description',
  template: ` <div [nwHtml]="description | nwText | nwTextBreak"></div> `,
  imports: [NwModule],
  host: {
    class: 'block  text-nw-description italic',
    '[class.hidden]': '!description',
  },
})
export class QuestDetailDescriptionComponent {
  private detail = inject(QuestDetailStore)
  protected get description() {
    return this.detail.description()
  }
}
