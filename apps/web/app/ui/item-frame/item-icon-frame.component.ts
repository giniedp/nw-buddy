import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core'
import { ItemRarity } from '@nw-data/common'
import { HouseItems, MasterItemDefinitions } from '@nw-data/generated'
import { NwModule } from '~/nw'

@Component({
  standalone: true,
  selector: 'nwb-item-icon,a[nwbItemIcon]',
  template: `
    <div class="nw-item-icon-border"></div>
    @if (icon) {
      <picture class="aspect-square">
        <img [nwImage]="icon" class="w-full h-full" [class.object-contain]="!cover" [class.object-cover]="cover" />
      </picture>
    }
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NwModule],
  host: {
    class: 'block nw-item-icon-frame aspect-square relative',
    '[class.nw-item-rarity-common]': 'rarity === "common"',
    '[class.nw-item-rarity-uncommon]': 'rarity === "uncommon"',
    '[class.nw-item-rarity-rare]': 'rarity === "rare"',
    '[class.nw-item-rarity-epic]': 'rarity === "epic"',
    '[class.nw-item-rarity-legendary]': 'rarity === "legendary"',
    '[class.nw-item-rarity-artifact]': 'rarity === "artifact"',
    '[class.nw-item-icon-bg]': 'solid',
    '[class.nw-item-icon-mask]': '!solid',
  },
})
export class ItemIconFrameComponent {
  @Input()
  public rarity: ItemRarity

  @Input()
  public solid: boolean

  @Input()
  @HostBinding('class.named')
  public isNamed: boolean

  @Input('nwbItemIcon')
  public icon: string | MasterItemDefinitions | HouseItems

  @Input()
  public cover: boolean
}
