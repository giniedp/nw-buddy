import { CommonModule } from '@angular/common'
import { Component, computed, inject, output, resource } from '@angular/core'
import { groupBy } from 'lodash'
import { CharacterStore, injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgCircle, svgCircleCheck } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'

@Component({
  selector: 'nwb-xp-unlock-line',
  templateUrl: './xp-unlock-line.component.html',
  styleUrl: './xp-unlock-line.component.css',
  imports: [CommonModule, NwModule, IconsModule, TooltipModule],
  host: {
    class: 'block',
  },
})
export class XpUnlockLineComponent {
  private db = injectNwData()
  private character = inject(CharacterStore)

  public readonly levelClicked = output<number>()

  protected level = this.character.level

  protected resource = resource({
    loader: () => this.db.milestoneRewardsAll(),
  })
  protected data = computed(() => {
    const data = this.resource.value() || []
    const groups = groupBy(data, (it) => it.MilestoneLevel)
    return Object.entries(groups).map(([key, rewards]) => {
      const reward = rewards.find((it) => it.Image)
      return {
        level: Number(key),
        reward: reward,
        rewards: rewards
          .filter((it) => it !== reward)
          .sort((a, b) => {
            if (a.Icon) {
              return -1
            }
            if (b.Icon) {
              return 1
            }
            return 0
          }),
      }
    })
  })

  protected iconChecked = svgCircleCheck
  protected iconUnchecked = svgCircle

  protected handleLevelClick(value: number) {
    this.levelClicked.emit(value)
  }
}
