import { CommonModule } from '@angular/common'
import { Component, forwardRef, Input, Output } from '@angular/core'
import { NwModule } from '~/nw'
import { NwDataService } from '~/data'
import { ItemFrameModule } from '~/ui/item-frame'
import { QuestDetailStore } from './quest-detail.store'
import { QuestDetailFollowUpComponent } from './quest-detail-follow-up.component'
import { RouterModule } from '@angular/router'
import { GameEventDetailDirective } from '../game-event-detail/game-event-detail.directive'
import { GameEventDetailRewardsComponent } from '../game-event-detail/game-event-detail-rewards.component'
import { NW_FALLBACK_ICON } from '@nw-data/common'

@Component({
  standalone: true,
  selector: 'nwb-quest-detail',
  templateUrl: './quest-detail.component.html',
  exportAs: 'questDetail',
  imports: [
    CommonModule,
    NwModule,
    RouterModule,
    ItemFrameModule,
    QuestDetailFollowUpComponent,
    GameEventDetailDirective,
    GameEventDetailRewardsComponent,
  ],
  providers: [
    {
      provide: QuestDetailStore,
      useExisting: forwardRef(() => QuestDetailComponent),
    },
  ],
  host: {
    class: 'block bg-black rounded-md overflow-clip font-nimbus',
  },
})
export class QuestDetailComponent extends QuestDetailStore {
  @Input()
  public set questId(value: string) {
    this.patchState({ questId: value })
  }

  @Output()
  public questChange = this.quest$

  protected defaultIcon = NW_FALLBACK_ICON
  public constructor(db: NwDataService) {
    super(db)
  }
}
