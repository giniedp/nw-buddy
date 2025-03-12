import { Component, computed, input } from '@angular/core'
import { RouterModule } from '@angular/router'
import { getQuestRequiredAchievmentIds, getQuestTypeIcon } from '@nw-data/common'
import { Objectives } from '@nw-data/generated'
import { flatten, groupBy } from 'lodash'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { humanize, selectSignal } from '~/utils'

@Component({
  selector: 'nwb-quest-link',
  template: `
    @for (row of rows(); track $index) {
      <div class="flex flex-row items-center gap-1">
        <a [nwLinkTooltip]="['quest', row.questId]" class="flex-none">
          <img [nwImage]="row.icon" class="w-5 h-5" />
        </a>
        <a
          class="flex-1 link-hover"
          [routerLink]="['quest', row.questId] | nwLink"
          [routerLinkActive]="'text-primary'"
          [queryParamsHandling]="'preserve'"
        >
          <span>{{ row.title | nwText }}</span>
        </a>
      </div>
    }
  `,
  host: {
    class: 'flex flex-col',
  },
  imports: [NwModule, RouterModule],
})
export class QuestLinkComponent {
  public quest = input.required<Objectives | Objectives[]>()
  protected rows = computed(() => {
    const data = this.quest()
    if (!data) {
      return null
    }
    const rows = Array.isArray(data) ? data : [data]
    return rows.map((quest) => {
      return {
        quest,
        questId: quest.ObjectiveID,
        title: quest.Title || humanize(quest.ObjectiveID),
        icon: getQuestTypeIcon(quest.Type),
      }
    })
  })
}

@Component({
  selector: 'nwb-quest-prev',
  template: `
    @for (row of data(); track $index) {
      @if (row.left?.length) {
        <nwb-quest-prev [data]="row.left" [class.ml-3]="data()?.length > 1" />
      }
      @if (row.quest) {
        <nwb-quest-link [quest]="row.quest" />
      }
    }
  `,
  imports: [QuestLinkComponent],
  host: {
    class: 'flex flex-col gap-1',
    //'[class.my-3]': 'data().length > 1',
  },
})
export class QuestPrevComponent {
  public data = input.required<QuestLeft[]>()
}

@Component({
  selector: 'nwb-quest-next',
  template: `
    @for (row of data(); track $index) {
      @if (row.quest) {
        <nwb-quest-link [quest]="row.quest" />
      }
      @if (row.right?.length) {
        <nwb-quest-next [data]="row.right" [class.ml-3]="data()?.length > 1" />
      }
    }
  `,
  imports: [QuestLinkComponent],
  host: {
    class: 'flex flex-col gap-1',
  },
})
export class QuestNextComponent {
  public data = input.required<QuestRight[]>()
}

@Component({
  selector: 'nwb-quest-tree',
  template: `
    <!-- @if (left) {
      <nwb-quest-prev [data]="left" />
    } -->
    @if (quest) {
      <nwb-quest-link [quest]="quest" />
    }
    @if (right) {
      <nwb-quest-next [data]="right" />
    }
  `,
  imports: [QuestNextComponent, QuestLinkComponent],
})
export class QuestTreeComponent {
  private db = injectNwData()
  public questId = input.required<string>()

  public tree = selectSignal(
    {
      questId: this.questId,
      questMap: this.db.objectivesByIdMap(),
      questsByAchievementId: this.db.objectivesByAchievementIdMap(),
      questsByRequiredAchievementId: this.db.objectivesByRequiredAchievementIdMap(),
    },
    ({ questId, questMap, questsByAchievementId, questsByRequiredAchievementId }) => {
      if (!questId || !questMap || !questsByRequiredAchievementId) {
        return null
      }
      return {
        left: selectPreviousQuests(questId, questMap, questsByAchievementId, []),
        quest: questMap.get(questId),
        right: selectFollowupQuests(questId, questMap, questsByRequiredAchievementId),
      }
    },
  )

  protected get left() {
    return this.tree()?.left
  }

  protected get quest() {
    return this.tree()?.quest
  }

  protected get right() {
    return this.tree()?.right
  }
}

function selectPreviousQuests(
  questId: string,
  questMap: Map<string, Objectives>,
  questsByAchievementId: Map<string, Objectives[]>,
  track: string[],
): QuestLeft[] {
  const quest = questMap.get(questId)
  if (!quest) {
    return null
  }
  const quests = getQuestRequiredAchievmentIds(quest).map((id) => {
    return questsByAchievementId.get(id) || []
  })
  if (!quests.length) {
    return null
  }

  return flatten(quests)
    .filter((it) => !track.includes(it.ObjectiveID))
    .map((it) => {
      return {
        left: selectPreviousQuests(it.ObjectiveID, questMap, questsByAchievementId, [...track, it.ObjectiveID]),
        quest: it,
      }
    })
    .filter((it) => !!it.quest || !!it.left?.length)
}

function selectFollowupQuests(
  questId: string,
  questMap: Map<string, Objectives>,
  questsByRequiredAchievementId: Map<string, Objectives[]>,
): QuestRight[] {
  const quest = questMap.get(questId)
  if (!quest?.AchievementId) {
    return null
  }
  const quests = questsByRequiredAchievementId.get(quest.AchievementId)
  if (!quests?.length) {
    return null
  }
  const groups = groupBy(quests, (it) => it.AchievementId)
  const result = Object.values(groups).map((group) => {
    return {
      quest: group,
      right: selectFollowupQuests(group[0].ObjectiveID, questMap, questsByRequiredAchievementId),
    }
  })

  return result.filter((it) => !!it.quest || !!it.right?.length)
}

export interface QuestLeft {
  left: QuestLeft[]
  quest: Objectives
}

export interface QuestRight {
  quest: Objectives[]
  right: QuestRight[]
}
