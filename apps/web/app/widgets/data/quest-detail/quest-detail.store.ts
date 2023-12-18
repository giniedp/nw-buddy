import { Injectable, Output } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { getItemIconPath, getItemId, getItemRarity, getQuestRequiredAchuevmentIds, getQuestTypeIcon, isHousingItem } from '@nw-data/common'
import { Housingitems, ItemDefinitionMaster, Objective } from '@nw-data/generated'
import { NwDbService } from '~/nw'
import { FollowUpQuest } from './types'
import { humanize } from '~/utils'
import { flatten } from 'lodash'
import { GameEventReward, selectGameEventRewards } from '../game-event-detail/selectors'

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
  public readonly inProgressResponse$ = this.select(this.quest$, (it) => it?.InProgressResponse)
  public readonly icon$ = this.select(this.quest$, (it) => getQuestTypeIcon(it?.Type))
  public readonly followup$ = this.select(this.quest$, this.db.questsByRequiredAchievementIdMap, selectFollowupQuests)
  public readonly previous$ = this.select(this.quest$, this.db.questsByAchievementIdMap, selectPreviousQuests)
  public readonly eventId$ = this.select(this.quest$, (it) => it?.SuccessGameEventId)
  public readonly event$ = this.select(this.db.gameEvent(this.eventId$), (it) => it)
  public readonly eventItemRewardId$ = this.select(this.event$, (it) => it?.ItemReward)
  public readonly eventItemReward$ = this.select(this.db.itemOrHousingItem(this.eventItemRewardId$), (it) => it)
  public readonly eventRewards$ = this.select(this.event$, this.eventItemReward$, selectGameEventRewards)
  public readonly rewardItemId$ = this.select(this.quest$, (it) => it?.ItemRewardName)
  public readonly rewardItem$ = this.select(this.db.itemOrHousingItem(this.rewardItemId$), (it) => it)
  public readonly rewardItemQty$ = this.select(this.quest$, (it) => it?.ItemRewardQty)
  public readonly reward$ = this.select(this.rewardItem$, this.rewardItemQty$, selectReward)
  public readonly rewards$ = this.select(this.eventRewards$, this.reward$, selectRewards)

  public readonly previousQuests$ = this.select(this.previous$, (list) => {
    if (!list?.length) {
      return null
    }
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

function selectFollowupQuests(
  quest: Objective,
  questsByRequiredAchievementId: Map<string, Set<Objective>>
): FollowUpQuest[] {
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
      next: selectFollowupQuests(it, questsByRequiredAchievementId),
    }
  })
}

function selectPreviousQuests(quest: Objective, questsByAchievementId: Map<string, Set<Objective>>): Objective[] {
  const quests = getQuestRequiredAchuevmentIds(quest).map((id) => Array.from(questsByAchievementId.get(id) || []))
  return flatten(quests)
}

function selectReward(item: ItemDefinitionMaster | Housingitems, qty: number): GameEventReward {
  if (!item) {
    return null
  }
  return {
    icon: getItemIconPath(item),
    rarity: getItemRarity(item),
    label: item.Name,
    quantity: qty,
    link: [
      isHousingItem(item) ? '/housing' : '/items',
      'table',
      getItemId(item)
    ]
  }
}
function selectRewards(event: GameEventReward[], reward: GameEventReward): GameEventReward[] {
  const result = []
  if (event?.length) {
    result.push(...event)
  }
  if (reward) {
    result.push(reward)
  }
  if (result.length === 0) {
    return null
  }
  return result
}
