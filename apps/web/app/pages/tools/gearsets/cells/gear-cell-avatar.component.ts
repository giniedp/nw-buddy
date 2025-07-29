import { CdkConnectedOverlay } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NW_MAX_CHARACTER_LEVEL } from '@nw-data/common'
import { GearsetStore } from '~/data'
import { NwModule } from '~/nw'
import { Mannequin } from '~/nw/mannequin'
import { IconsModule } from '~/ui/icons'
import { svgEllipsisVertical } from '~/ui/icons/svg'
import { InputSliderComponent } from '~/ui/input-slider'
import { ModalService } from '~/ui/layout'

@Component({
  selector: 'nwb-gear-cell-avatar',
  templateUrl: './gear-cell-avatar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, IconsModule, FormsModule, CdkConnectedOverlay, InputSliderComponent],
  host: {
    class: 'flex flex-col',
  },
})
export class GearCellAvatarComponent {
  private store = inject(GearsetStore)
  private mannequin = inject(Mannequin)
  private modal = inject(ModalService)

  public disabled = input<boolean>(false)
  public title = input<string>(null)
  public isEditable = computed(() => !this.disabled() && !!this.store.gearsetId())

  protected gearScore = this.mannequin.gearScore
  protected level = this.mannequin.level

  protected leveltarget: Element
  protected levelValue: number
  protected levelMin = 1
  protected levelMax = NW_MAX_CHARACTER_LEVEL
  protected iconMenu = svgEllipsisVertical

  protected openLevelEditor(e: MouseEvent) {
    this.leveltarget = e.currentTarget as Element
  }

  protected closeLevelEditor() {
    this.leveltarget = null
    if (this.levelValue) {
      this.store.updateLevel(this.levelValue)
    }
  }

  protected updateLevel(value: number) {
    this.levelValue = Number(value)
  }

  protected stepLevel(event: WheelEvent) {
    if (event.deltaY < 0) {
      this.levelValue += 1
    }
    if (event.deltaY > 0) {
      this.levelValue -= 1
    }
    this.levelValue = Math.max(this.levelMin, Math.min(this.levelMax, this.levelValue))
  }
}
