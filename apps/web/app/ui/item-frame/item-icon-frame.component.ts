import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy, Input } from '@angular/core'

@Component({
  standalone: true,
  selector: 'nwb-item-icon-frame',
  template: '<ng-content></ng-content>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  host: {
    class: 'inline-block nw-item-icon-frame aspect-square relative',
    '[class.nw-item-rarity-1]': 'rarity === 1',
    '[class.nw-item-rarity-2]': 'rarity === 2',
    '[class.nw-item-rarity-3]': 'rarity === 3',
    '[class.nw-item-rarity-4]': 'rarity === 4',
    '[class.nw-item-icon-bg]': 'solid',
    '[class.nw-item-icon-mask]': '!solid'
  },
})
export class ItemIconFrameComponent {

  @Input()
  public rarity: number

  @Input()
  public solid: boolean

  public constructor() {
    //
  }
}
