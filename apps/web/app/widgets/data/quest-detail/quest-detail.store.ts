import { Injectable, Output } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { getQuestRequiredAchuevmentIds, getQuestTypeIcon } from '@nw-data/common'
import { Objective } from '@nw-data/generated'
import { NwDbService } from '~/nw'
import { FollowUpQuest } from './types'
import { humanize } from '~/utils'
import { flatten } from 'lodash'

@Injectable()
export class QuestDetailStore extends ComponentStore<{ questId: string }> {
  public readonly questId$ = this.select(({ questId }) => questId)

  public readonly quest$ = this.select(this.db.quest(this.questId$), (it) => it)
  public readonly title$ = this.select(this.quest$, (it) => it?.Title || humanize(it?.ObjectiveID))
  public readonly type$ = this.select(this.quest$, (it) => it?.Type)
  public readonly description$ = this.select(this.quest$, (it) => it?.Description)
  public readonly level$ = this.select(this.quest$, (it) => it?.DifficultyLevel)
  public readonly levelLabel$ = this.select(this.level$, (lvl) => (lvl ? `lvl. ${lvl}` : ''))
  public readonly prompt$ = this.select(this.quest$, (it) => it?.PlayerPrompt)
  public readonly response$ = this.select(this.quest$, (it) => it?.ObjectiveProposalResponse)
  public readonly icon$ = this.select(this.quest$, (it) => getQuestTypeIcon(it?.Type))
  public readonly followup$ = this.select(this.quest$, this.db.questsByRequiredAchievementId, resolveFollowupQuests)
  public readonly previous$ = this.select(this.quest$, this.db.questsByAchievementId, resolvePreviousQuests)
  public readonly previousQuests$ = this.select(this.previous$, (list) => {
    return list?.map((it) => {
      return {
        quest: it,
        id: it?.ObjectiveID,
        icon: getQuestTypeIcon(it?.Type),
        title: it?.Title || humanize(it?.ObjectiveID),
      }
    })
  })


  public constructor(protected db: NwDbService) {
    super({ questId: null })
  }

  public update(questId: string) {
    this.patchState({ questId: questId })
  }
}

function resolveFollowupQuests(quest: Objective, questsByRequiredAchievementId: Map<string, Set<Objective>>): FollowUpQuest[] {
  if (!quest.AchievementId) {
    return null
  }
  const quests = questsByRequiredAchievementId.get(quest.AchievementId)
  if (!quests?.size) {
    return null
  }

  return Array.from(quests).map((it) => {
    return {
      quest: it,
      next: resolveFollowupQuests(it, questsByRequiredAchievementId),
    }
  })
}

function resolvePreviousQuests(quest: Objective, questsByAchievementId: Map<string, Set<Objective>>): Objective[] {
  const quests = getQuestRequiredAchuevmentIds(quest).map((id) => Array.from(questsByAchievementId.get(id) || []))
  return flatten(quests)
}
