import { Injectable, Output } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { getQuestTypeIcon } from '@nw-data/common'
import { NwDbService } from '~/nw'

@Injectable()
export class QuestDetailStore extends ComponentStore<{ questId: string }> {
  public readonly questId$ = this.select(({ questId }) => questId)

  public readonly quest$ = this.select(this.db.quest(this.questId$), (it) => it)
  public readonly title$ = this.select(this.quest$, (it) => it?.Title)
  public readonly type$ = this.select(this.quest$, (it) => it?.Type)
  public readonly description$ = this.select(this.quest$, (it) => it?.Description)
  public readonly level$ = this.select(this.quest$, (it) => it?.DifficultyLevel)
  public readonly levelLabel$ = this.select(this.level$, (lvl) => lvl ? `lvl. ${lvl}` : '')
  public readonly prompt$ = this.select(this.quest$, (it) => it?.PlayerPrompt)
  public readonly response$ = this.select(this.quest$, (it) => it?.ObjectiveProposalResponse)
  public readonly icon$ = this.select(this.quest$, (it) => getQuestTypeIcon(it?.Type))

  public constructor(protected db: NwDbService) {
    super({ questId: null })
  }

  public update(questId: string) {
    this.patchState({ questId: questId })
  }
}
