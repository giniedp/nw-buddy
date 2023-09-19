import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy, Input, HostBinding } from '@angular/core'

@Component({
  standalone: true,
  selector: 'nwb-item-header',
  template: `
    <div class="nw-item-header-bg"></div>
    <div class="nw-item-header-fg" *ngIf="named"></div>
    <ng-content></ng-content>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  host: {
    class: 'nw-item-header flex flex-row p-1 text-shadow-sm shadow-black',
    '[class.nw-item-rarity-0]': '!artifact && !rarity',
    '[class.nw-item-rarity-1]': '!artifact && rarity === 1',
    '[class.nw-item-rarity-2]': '!artifact && rarity === 2',
    '[class.nw-item-rarity-3]': '!artifact && rarity === 3',
    '[class.nw-item-rarity-4]': '!artifact && rarity === 4',
    '[class.nw-item-rarity-artifact]': '!!artifact',
  },
})
export class ItemHeaderComponent {
  @Input()
  public rarity: number

  @Input()
  @HostBinding('class.named')
  public named: boolean

  @Input()
  @HostBinding('class.artifact')
  public artifact: boolean

  public constructor() {
    //
  }
}
