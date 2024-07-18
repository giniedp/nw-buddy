import { Component, computed, inject } from '@angular/core'
import { QuestDetailStore } from './quest-detail.store'
import { uniq } from 'lodash'
import { selectSignal } from '~/utils'

@Component({
  standalone: true,
  selector: 'nwb-quest-detail-requirements',
  templateUrl: './quest-detail-requirements.component.html',
})
export class QuestDetailRequirementsComponent {
  private store = inject(QuestDetailStore)

  protected requirements = selectSignal(
    {
      quest: this.store.quest,
      conversations: this.store.conversations,
    },
    ({ quest, conversations }) => {
      const achievement = [quest?.RequiredAchievementId, conversations?.map((it) => it.RequiredAchievement)].flat()
      const activeObjective = [conversations?.map((it) => it.RequiredActiveObjectiveId)].flat()
      const completedObjective = [conversations?.map((it) => it.RequiredCompletedObjective)].flat()
      const faction = [quest?.RequiredFaction, conversations?.map((it) => it.RequiredFaction)].flat()
      const factionCooldown = [conversations?.map((it) => it.RequiredFactionCooldown)].flat()
      const progression = [quest?.RequiredProgression, conversations?.map((it) => it.RequiredProgression)].flat()
      const level = [quest?.RequiredLevel, conversations?.map((it) => it.RequiredLevel)].flat()
      // uniq(
      //   .flat().filter((it) => !!it),
      // )
    },
  )
}
