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
    class: 'nw-item-header flex flex-row p-1',
    '[class.nw-item-rarity-0]': '!rarity',
    '[class.nw-item-rarity-1]': 'rarity === 1',
    '[class.nw-item-rarity-2]': 'rarity === 2',
    '[class.nw-item-rarity-3]': 'rarity === 3',
    '[class.nw-item-rarity-4]': 'rarity === 4'
  },
})
export class ItemHeaderComponent {

  @Input()
  public rarity: number

  @Input()
  @HostBinding('class.named')
  public named: boolean


  public constructor() {
    //
  }
}
