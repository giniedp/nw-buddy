import { computed } from '@angular/core'
import { signalStore, withComputed, withState } from '@ngrx/signals'
import {
  getItemIconPath,
  getItemId,
  getItemRarity,
  getQuestRequiredAchievmentIds,
  getQuestTypeIcon,
  isHousingItem,
} from '@nw-data/common'
import {
  ConversationStateData,
  GameEventData,
  HouseItems,
  MasterItemDefinitions,
  NPCData,
  Objectives,
  StatusEffectData,
} from '@nw-data/generated'
import { flatten } from 'lodash'
import { injectNwData, withStateLoader } from '~/data'
import { humanize, selectSignal } from '~/utils'
import { GameEventReward, selectGameEventRewards } from '../game-event-detail/selectors'
import { FollowUpQuest } from './types'

export interface QuestDetailState {
  questId: string
  quest: Objectives
  npcDestination: NPCData[]
  conversations: ConversationStateData[]
  eventId: string
  event: GameEventData
  eventStatusEffect: StatusEffectData
  eventItemReward: MasterItemDefinitions | HouseItems
  eventRewards: GameEventReward[]
  rewardItem: MasterItemDefinitions | HouseItems
  rewardItemQty: number
  reward: GameEventReward
  rewards: GameEventReward[]
}

export const QuestDetailStore = signalStore(
  { protectedState: false },
  withState<QuestDetailState>({
    questId: null,
    quest: null,
    npcDestination: null,
    conversations: null,
    eventId: null,
    event: null,
    eventStatusEffect: null,
    eventItemReward: null,
    eventRewards: null,
    rewardItem: null,
    rewardItemQty: null,
    reward: null,
    rewards: null,
  }),
  withStateLoader(() => {
    const db = injectNwData()
    return {
      async load(questId: string): Promise<QuestDetailState> {
        const quest = await db.objectivesById(questId)
        const npcDestination$ = db.npcsById(quest?.NpcDestinationId)
        const conversations$ = db.conversationStatesByObjectiveId(questId)
        const eventId = quest?.SuccessGameEventId
        const event = !eventId ? null : await db.gameEventsById(eventId)
        const eventStatusEffectId = event?.StatusEffectId
        const eventStatusEffect = !eventStatusEffectId ? null : await db.statusEffectsById(eventStatusEffectId)
        const eventItemRewardId = event?.ItemReward
        const eventItemReward = !eventItemRewardId ? null : await db.itemOrHousingItem(eventItemRewardId)
        const eventRewards = selectGameEventRewards(event, eventItemReward)

        const rewardItemId = quest?.ItemRewardName
        const rewardItem = !rewardItemId ? null : await db.itemOrHousingItem(rewardItemId)
        const rewardItemQty = quest?.ItemRewardQty
        const reward = selectReward(rewardItem, rewardItemQty)
        const rewards = selectRewards(eventRewards, reward)
        return {
          questId,
          quest,
          npcDestination: await npcDestination$,
          conversations: await conversations$,
          eventId,
          event,
          eventStatusEffect,
          eventItemReward,
          eventRewards,
          rewardItem,
          rewardItemQty,
          reward,
          rewards,
        }
      },
    }
  }),
  withComputed(({ quest }) => {
    return {
      title: computed(() => quest()?.Title || humanize(quest()?.ObjectiveID)),
      type: computed(() => quest()?.Type),
      taskId: computed(() => quest()?.Task),
      schedule: computed(() => quest()?.ScheduleId),
      description: computed(() => quest()?.Description),
      level: computed(() => quest()?.DifficultyLevel),
      levelLabel: computed(() => {
        const lvl = quest()?.DifficultyLevel
        return lvl ? `lvl. ${lvl}` : ''
      }),
      prompt: computed(() => quest()?.PlayerPrompt),
      response: computed(() => quest()?.ObjectiveProposalResponse),
      inProgressResponse: computed(() => quest()?.InProgressResponse),
      icon: computed(() => getQuestTypeIcon(quest()?.Type)),
      requiredAchievementId: computed(() => quest()?.RequiredAchievementId),
      requiredLevel: computed(() => quest()?.RequiredLevel),
      requiredFaction: computed(() => quest()?.RequiredFaction),
      //requiredProgression: selectSignal(quest, (it) => it?.RequiredProgression),
    }
  }),

  withComputed((state) => {
    const db = injectNwData()
    return {
      followup: selectSignal(
        {
          quest: state.quest,
          objectives: db.objectivesByRequiredAchievementIdMap(),
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
