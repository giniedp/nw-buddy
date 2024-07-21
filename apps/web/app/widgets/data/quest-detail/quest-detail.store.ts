import { computed, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { signalStore, withComputed, withState } from '@ngrx/signals'
import {
  getItemIconPath,
  getItemId,
  getItemRarity,
  getQuestRequiredAchievmentIds,
  getQuestTypeIcon,
  isHousingItem,
} from '@nw-data/common'
import { HouseItems, MasterItemDefinitions, Objectives } from '@nw-data/generated'
import { flatten } from 'lodash'
import { NwDataService } from '~/data'
import { humanize, selectSignal } from '~/utils'
import { GameEventReward, selectGameEventRewards } from '../game-event-detail/selectors'
import { FollowUpQuest } from './types'

export interface QuestDetailState {
  questId: string
}

export const QuestDetailStore = signalStore(
  withState<QuestDetailState>({
    questId: null,
  }),
  withComputed(({ questId }) => {
    const db = inject(NwDataService)
    const quest = selectSignal(db.objective(questId))
    return {
      quest,
      title: selectSignal(quest, (it) => it?.Title || humanize(it?.ObjectiveID)),
      type: selectSignal(quest, (it) => it?.Type),
      taskId: selectSignal(quest, (it) => it?.Task),
      schedule: selectSignal(quest, (it) => it?.ScheduleId),
      description: selectSignal(quest, (it) => it?.Description),
      level: selectSignal(quest, (it) => it?.DifficultyLevel),
      prompt: selectSignal(quest, (it) => it?.PlayerPrompt),
      response: selectSignal(quest, (it) => it?.ObjectiveProposalResponse),
      inProgressResponse: selectSignal(quest, (it) => it?.InProgressResponse),
      icon: selectSignal(quest, (it) => getQuestTypeIcon(it?.Type)),
      requiredAchievementId: selectSignal(quest, (it) => it?.RequiredAchievementId),
      requiredLevel: selectSignal(quest, (it) => it?.RequiredLevel),
      requiredFaction: selectSignal(quest, (it) => it?.RequiredFaction),
      requiredProgression: selectSignal(quest, (it) => it?.RequiredProgression),
    }
  }),
  withComputed(({ questId, quest, level }) => {
    const db = inject(NwDataService)
    const npcDestinationId = selectSignal(quest, (it) => it?.NpcDestinationId)
    const npcDestination = toSignal(db.npc(npcDestinationId))
    const levelLabel = selectSignal(level, (lvl) => (lvl ? `lvl. ${lvl}` : ''))

    return {
      npcDestination,
      levelLabel,
      conversations: toSignal(db.conversationStatesByObjectiveId(questId)),
    }
  }),

  withComputed(({ quest }) => {
    const db = inject(NwDataService)

    const eventId = selectSignal(quest, (it) => it?.SuccessGameEventId)
    const event = toSignal(db.gameEvent(eventId))
    const eventStatusEffectId = selectSignal(event, (it) => it?.StatusEffectId)
    const eventStatusEffect = selectSignal(db.statusEffect(eventStatusEffectId))
    const eventItemRewardId = selectSignal(event, (it) => it?.ItemReward)
    const eventItemReward = toSignal(db.itemOrHousingItem(eventItemRewardId))
    const eventRewards = computed(() => selectGameEventRewards(event(), eventItemReward()))

    const rewardItemId = selectSignal(quest, (it) => it?.ItemRewardName)
    const rewardItem = selectSignal(db.itemOrHousingItem(rewardItemId))
    const rewardItemQty = selectSignal(quest, (it) => it?.ItemRewardQty)
    const reward = computed(() => selectReward(rewardItem(), rewardItemQty()))
    const rewards = computed(() => selectRewards(eventRewards(), reward()))
    return {
      event,
      eventStatusEffect,
      eventItemReward,
      eventRewards,
      reward,
      rewards,
    }
  }),
  withComputed((state) => {
    const db = inject(NwDataService)
    return {
      followup: selectSignal(
        {
          quest: state.quest,
          objectives: db.objectivesByRequiredAchievementIdMap,
        },
        ({ quest, objectives }) => {
          return selectFollowupQuests(quest, objectives)
        },
      ),
    }
  }),
)

function selectFollowupQuests(
  quest: Objectives,
  questsByRequiredAchievementId: Map<string, Objectives[]>,
): FollowUpQuest[] {
  if (!quest?.AchievementId) {
    return null
  }
  const quests = questsByRequiredAchievementId.get(quest.AchievementId)
  if (!quests?.length) {
    return null
  }

  return quests.map((it) => {
    return {
      quest: it,
      next: selectFollowupQuests(it, questsByRequiredAchievementId),
    }
  })
}

function selectPreviousQuests(quest: Objectives, questsByAchievementId: Map<string, Objectives[]>): Objectives[] {
  const quests = getQuestRequiredAchievmentIds(quest).map((id) => questsByAchievementId.get(id) || [])
  return flatten(quests)
}

function selectReward(item: MasterItemDefinitions | HouseItems, qty: number): GameEventReward {
  if (!item) {
    return null
  }
  return {
    icon: getItemIconPath(item),
    rarity: getItemRarity(item),
    label: item.Name,
    quantity: qty,
    link: [isHousingItem(item) ? 'housing' : 'item', getItemId(item)],
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
