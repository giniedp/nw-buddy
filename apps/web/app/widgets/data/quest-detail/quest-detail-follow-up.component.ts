import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { getQuestTypeIcon } from '@nw-data/common'
import { Objectives } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { humanize } from '~/utils'
import { FollowUpQuest } from './types'
import { RouterModule } from '@angular/router'
import { IconsModule } from '~/ui/icons'
import { svgAngleLeft, svgChevronLeft } from '~/ui/icons/svg'

@Component({
  selector: 'nwb-quest-detail-follow-up',
  templateUrl: './quest-detail-follow-up.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, RouterModule, IconsModule],
  host: {
    class: 'block',
  },
})
export class QuestDetailFollowUpComponent {
  @Input()
  public data: FollowUpQuest

  public get quest(): Objectives {
    return this.data.quest
  }

  public get questId(): string {
    return this.quest?.ObjectiveID
  }

  public get title(): string {
    return this.quest?.Title || humanize(this.questId)
  }

  public get next(): FollowUpQuest[] {
    return this.data.next
  }

  public get icon() {
    return getQuestTypeIcon(this.quest?.Type)
  }

  public get hasFollowUp(): boolean {
    return this.next?.length > 0
  }

  public expand: boolean = false

  protected iconArrow = svgAngleLeft
}
