import { Component, computed, inject, input } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { RouterModule } from '@angular/router'
import { NwDataService } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgInfoCircle } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { RequiredAchievementComponent } from './required-achievement.component'

export interface Chat {
  isPlayer: boolean
  text: string
}

@Component({
  standalone: true,
  selector: 'nwb-quest-detail-conversation',
  templateUrl: './quest-detail-conversation.component.html',
  imports: [NwModule, RouterModule, IconsModule, TooltipModule, RequiredAchievementComponent],
  host: {
    class: 'flex flex-col gap-1',
  },
})
export class QuestDetailConversationComponent {
  private db = inject(NwDataService)
  public conversationId = input.required<string>()
  protected infoIcon = svgInfoCircle
  protected npcs = toSignal(this.db.npcsByConversationStateId(this.conversationId))
  protected conversation = toSignal(this.db.conversationState(this.conversationId))
  protected dialog = computed(() => this.conversation()?.DefaultDialogue)

  protected requiredLevel = computed(() => this.conversation()?.RequiredLevel)
  protected requiredFaction = computed(() => this.conversation()?.RequiredFaction)
  protected requiredFactionCooldown = computed(() => this.conversation()?.RequiredFactionCooldown)
  protected requiredProgression = computed(() => this.conversation()?.RequiredProgression)

  protected requiredAchievement = computed(() => this.conversation()?.RequiredAchievement)

  protected requiredActiveQuestId = computed(() => this.conversation()?.RequiredActiveObjectiveId)
  protected requiredActiveQuest = toSignal(this.db.objective(this.requiredActiveQuestId))

  protected requiredActiveTaskId = computed(() => this.conversation()?.RequiredActiveTaskId)
  protected requiredActiveTask = toSignal(this.db.objectiveTask(this.requiredActiveQuestId))

  protected requiredCompletedQuestId = computed(() => this.conversation()?.RequiredCompletedObjective)
  protected requiredCompletedQuest = toSignal(this.db.objective(this.requiredCompletedQuestId))

  protected hasRequirements = computed(() => {
    return !!(
      this.requiredLevel() ||
      this.requiredFaction() ||
      this.requiredFactionCooldown() ||
      this.requiredProgression() ||
      this.requiredAchievement() ||
      this.requiredActiveQuest() ||
      this.requiredActiveTask() ||
      this.requiredCompletedQuest()
    )
  })
}
