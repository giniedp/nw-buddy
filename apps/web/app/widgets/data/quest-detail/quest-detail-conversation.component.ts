import { Component, computed, input } from '@angular/core'
import { RouterModule } from '@angular/router'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgInfoCircle } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { apiResource } from '~/utils'
import { RequiredAchievementComponent } from './required-achievement.component'

export interface Chat {
  isPlayer: boolean
  text: string
}

@Component({
  selector: 'nwb-quest-detail-conversation',
  template: `
    @if (npcs()?.length) {
      <h3 class="font-bold flex flex-row justify-between">
        <span> Talk to </span>
        <nwb-icon [icon]="infoIcon" class="w-4 h-4 opacity-50" [tooltip]="tipNpcs" />
        <ng-template #tipNpcs>
          <div class="p-2 text-sm max-w-48 ">
            Multiple entries of the same NPC name indicates that this conversation may take place at different
            locations.
          </div>
        </ng-template>
      </h3>
    }
    @for (npc of npcs(); track $index) {
      <div class="flex flex-row items-center gap-1">
        <a [nwLinkTooltip]="['npc', npc.NPCId]" class="flex-none">
          <img [src]="'/assets/icons/menu/icon_head.png'" class="w-5 h-5" />
        </a>
        <a class="flex-1 link-hover" [routerLink]="['npc', npc.NPCId] | nwLink">
          <span>{{ npc.GenericName | nwText }}</span>
        </a>
      </div>
    }
    @if (dialog(); as text) {
      <div class="chat chat-start ml-4">
        <div class="chat-bubble" [nwHtml]="text | nwText | nwTextBreak"></div>
      </div>
    }
    @if (hasRequirements()) {
      <div class="flex flex-col gap-1">
        @if (conversation()?.RequiredAchievement; as value) {
          <h5 class="font-bold">Required Achievement</h5>
          <nwb-required-achievement [achievementId]="value" />
        }

        @if (conversation()?.RequiredFaction; as value) {
          <h5 class="font-bold">Required Faction: {{ value }}</h5>
        }
        @if (conversation()?.RequiredFactionCooldown; as value) {
          <h5 class="font-bold">Required Faction Cooldown: {{ value }}</h5>
        }
        @if (conversation()?.RequiredLevel; as value) {
          <h5 class="font-bold">Required Level: {{ value }}</h5>
        }
        @if (conversation()?.RequiredProgression; as value) {
          <h5 class="font-bold">Required Progression</h5>
          <code class="ml-4 text-xs">{{ value }}</code>
        }
        @if (requiredActiveQuest(); as quest) {
          <h5 class="font-bold">Required Active Quest:</h5>
          <a [routerLink]="['quest', quest.ObjectiveID] | nwLink">
            {{ quest.Title || quest.ObjectiveID | nwText }}
          </a>
        }
        @if (requiredCompletedQuest(); as quest) {
          <h5 class="font-bold">Required Completed Quest:</h5>
          <a [routerLink]="['quest', quest.ObjectiveID] | nwLink">
            {{ quest.Title || quest.ObjectiveID | nwText }}
          </a>
        }
      </div>
    }
  `,
  imports: [NwModule, RouterModule, IconsModule, TooltipModule, RequiredAchievementComponent],
  host: {
    class: 'flex flex-col gap-1',
  },
})
export class QuestDetailConversationComponent {
  private db = injectNwData()
  public conversationId = input.required<string>()
  private resource = apiResource({
    request: this.conversationId,
    loader: async ({ request }) => {
      const npcs = await this.db.npcsByConversationStateId(request)
      const conversation = await this.db.conversationStatesById(request)
      const requiredActiveQuest = await this.db.objectivesById(conversation?.RequiredActiveObjectiveId)
      const requiredActiveTask = await this.db.objectiveTasksById(conversation?.RequiredActiveTaskId)
      const requiredCompletedQuest = await this.db.objectivesById(conversation?.RequiredCompletedObjective)
      return {
        npcs,
        conversation,
        requiredActiveQuest,
        requiredActiveTask,
        requiredCompletedQuest,
      }
    },
  })

  protected infoIcon = svgInfoCircle
  protected npcs = computed(() => this.resource.value()?.npcs)
  protected conversation = computed(() => this.resource.value()?.conversation)
  protected dialog = computed(() => this.conversation()?.DefaultDialogue)

  protected requiredLevel = computed(() => this.conversation()?.RequiredLevel)
  protected requiredFaction = computed(() => this.conversation()?.RequiredFaction)
  protected requiredFactionCooldown = computed(() => this.conversation()?.RequiredFactionCooldown)
  protected requiredProgression = computed(() => this.conversation()?.RequiredProgression)
  protected requiredAchievement = computed(() => this.conversation()?.RequiredAchievement)
  protected requiredActiveQuest = computed(() => this.resource.value()?.requiredActiveQuest)
  protected requiredActiveTask = computed(() => this.resource.value()?.requiredActiveTask)
  protected requiredCompletedQuest = computed(() => this.resource.value()?.requiredCompletedQuest)

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
