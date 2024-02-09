import { CommonModule } from '@angular/common'
import { Component, EventEmitter, Output, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { NW_MAX_CHARACTER_LEVEL } from '@nw-data/common'
import { groupBy, sortBy } from 'lodash'
import { CharacterStore, NwDataService } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgCircle, svgCircleCheck } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { selectSignal } from '~/utils'

@Component({
  standalone: true,
  selector: 'nwb-xp-unlock-line',
  templateUrl: './xp-unlock-line.component.html',
  styleUrl: './xp-unlock-line.component.scss',
  imports: [CommonModule, NwModule, IconsModule, TooltipModule],
  host: {
    class: 'block',
  },
})
export class XpUnlockLineComponent {
  @Output()
  public readonly levelClicked = new EventEmitter<number>()

  protected level = toSignal(inject(CharacterStore).level$, {
    initialValue: NW_MAX_CHARACTER_LEVEL,
  })

  protected data = selectSignal(inject(NwDataService).mileStoneRewards, (data) => {
    data = sortBy(data || [], (it) => it.MilestoneLevel)
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
    this.handleLevelClick(value)
  }
}
