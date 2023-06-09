import { Objective } from '@nw-data/generated'
import { CaseInsensitiveMap } from './utils/caseinsensitive-map'

const QUEST_TYPE_ICONS = new CaseInsensitiveMap<string, string>(
  Object.entries({
    MainStoryQuest: 'assets/icons/quests/icon_objectivemainstory_quest.png',
    Event: 'assets/icons/quests/icon_event_npc_2.png',
    FactionStory_Covenant: 'assets/icons/quests/icon_factionstory_covenant_quest.png',
    FactionStory_Marauders: 'assets/icons/quests/icon_factionstory_marauders_quest.png',
    FactionStory_Syndicate: 'assets/icons/quests/icon_factionstory_syndicate_quest.png',
    SkillProgression: 'assets/icons/quests/icon_objectiveprogression_quest.png',
    EpicEquipment: 'assets/icons/quests/icon_objectiveprogression_quest.png',
    SeasonQuest: 'assets/icons/quests/icon_objectiveseasons_quest.png',
    Mission: 'assets/icons/quests/icon_objective_townproject.png',
    default: 'assets/icons/quests/icon_objective_quest.png',
  })
)

export function getQuestTypeIcon(type: string) {
  return QUEST_TYPE_ICONS.get(type) ?? QUEST_TYPE_ICONS.get('default')
}

export function getQuestRequiredAchuevmentIds(quest: Objective) {
  if (!quest.RequiredAchievementId) {
    return []
  }
  return quest.RequiredAchievementId.split(/[\|\&\(\)]/i)
    .map((it) => it.trim())
    .filter((it) => it)
}
