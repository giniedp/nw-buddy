import { CommonModule } from '@angular/common'
import { Component, forwardRef, Input, Output } from '@angular/core'
import { NwDbService, NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { QuestDetailStore } from './quest-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-quest-detail',
  templateUrl: './quest-detail.component.html',
  exportAs: 'questDetail',
  imports: [CommonModule, NwModule, ItemFrameModule],
  providers: [
    {
      provide: QuestDetailStore,
      useExisting: forwardRef(() => QuestDetailComponent),
    },
  ],
  host: {
    class: 'block bg-black rounded-md overflow-clip font-nimbus',
  }
})
export class QuestDetailComponent extends QuestDetailStore {
  @Input()
  public set questId(value: string) {
    this.patchState({ questId: value })
  }

  @Output()
  public questChange = this.quest$

  public constructor(db: NwDbService) {
    super(db)
  }
}
