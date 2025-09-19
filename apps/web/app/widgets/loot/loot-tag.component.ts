import { NgTemplateOutlet } from '@angular/common'
import { ChangeDetectionStrategy, Component, EventEmitter, Output, computed, input, signal } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgCheck, svgLink, svgPlus } from '~/ui/icons/svg'

@Component({
  selector: 'nwb-loot-tag',
  templateUrl: './loot-tag.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NwModule, IconsModule, RouterModule, NgTemplateOutlet],
  host: {
    class: 'badge badge-sm whitespace-nowrap items-center',
    '[class.bg-secondary/25]': '!isChecked',
    '[class.bg-secondary/90]': 'isChecked',
  },
})
export class LootTagComponent {
  public tag = input<string>(null)
  public tagValue = input<string>(null)
  public checked = input<boolean>(false)
  public actions = input<boolean>(false)
  public limitId = computed(() => {
    if (this.tag()?.startsWith('[LIM]')) {
      return this.tag().replace('[LIM]', '').toLowerCase()
    }
    return null
  })

  protected iconPlus = svgPlus
  protected iconCheck = svgCheck
  protected iconLink = svgLink
  protected isHover = signal(false)

  protected get isChecked() {
    return !!this.limitId() || this.checked()
  }
  protected get isEditable() {
    return !this.limitId() && !!this.actions()
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
