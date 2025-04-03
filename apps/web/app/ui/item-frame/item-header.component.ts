import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { ItemRarity } from '@nw-data/common'

@Component({
  selector: 'nwb-item-header',
  template: `
    <div class="nw-item-header-bg"></div>
    @if (isNamed) {
      <div class="nw-item-header-fg"></div>
    }
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  host: {
    class: 'nw-item-header flex text-shadow-sm shadow-black',
    '[class.nw-item-rarity-common]': 'rarity() === "common"',
    '[class.nw-item-rarity-uncommon]': 'rarity() === "uncommon"',
    '[class.nw-item-rarity-rare]': 'rarity() === "rare"',
    '[class.nw-item-rarity-epic]': 'rarity() === "epic"',
    '[class.nw-item-rarity-legendary]': 'rarity() === "legendary"',
    '[class.nw-item-rarity-artifact]': 'rarity() === "artifact"',
    '[class.named]': 'isNamed()',
    '[class.p-1]': 'isPadded()',
    '[class.flex-row]': 'isRow()',
    '[class.flex-col]': '!isRow()',
  },
})
export class ItemHeaderComponent {
  public rarity = input<string>('common')
  public isNamed = input<boolean>(false)
  public isPadded = input<boolean>(true)
  public isRow = input<boolean>(true)
}
