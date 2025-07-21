import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, EventEmitter, Output, input, signal } from '@angular/core'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgCheck, svgPlus } from '~/ui/icons/svg'

@Component({
  selector: 'nwb-loot-tag',
  templateUrl: './loot-tag.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, IconsModule],
  host: {
    class: 'badge badge-sm whitespace-nowrap',
    '[class.bg-secondary/25]': '!isChecked',
    '[class.bg-secondary/90]': 'isChecked',
  },
})
export class LootTagComponent {
  public tag = input<string>(null)
  public tagValue = input<string>(null)
  public checked = input<boolean>(false)
  public actions = input<boolean>(false)

  protected iconPlus = svgPlus
  protected iconCheck = svgCheck
  protected isHover = signal(false)

  protected get isChecked() {
    return this.checked()
  }
  protected get isEditable() {
    return !!this.actions()
  }
  protected get canAdd() {
    return this.isEditable && !this.isChecked
  }
  protected get canRemove() {
    return this.isEditable && this.isChecked
  }

  @Output()
  public removeClicked = new EventEmitter<string>()

  @Output()
  public addClicked = new EventEmitter<string>()

  protected onActionClicked() {
    if (!this.isEditable) {
      return
    }
    if (this.isChecked) {
      this.removeClicked.emit(this.tag())
    } else {
      this.addClicked.emit(this.tag())
    }
  }

  protected mouseEnter() {
    this.isHover.set(true)
  }

  protected mouseLeave() {
    this.isHover.set(false)
  }
}
