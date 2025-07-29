import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { HouseItems, MasterItemDefinitions } from '@nw-data/generated'
import { NwModule } from '~/nw'

@Component({
  selector: 'nwb-item-icon,a[nwbItemIcon]',
  template: `
    @if (!borderless()) {
      <div class="nw-item-icon-border" [class.rounded-full]="rounded()"></div>
    }
    <picture class="absolute top-[1px] left-[1px] right-[1px] bottom-[1px]">
      <img [nwImage]="icon()" class="w-full h-full" [class.object-contain]="!cover()" [class.object-cover]="cover()" />
    </picture>
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NwModule],
  host: {
    class: 'block nw-item-icon-frame aspect-square relative',
    '[class.nw-item-rarity-common]': 'rarity() === "common"',
    '[class.nw-item-rarity-uncommon]': 'rarity() === "uncommon"',
    '[class.nw-item-rarity-rare]': 'rarity() === "rare"',
    '[class.nw-item-rarity-epic]': 'rarity() === "epic"',
    '[class.nw-item-rarity-legendary]': 'rarity() === "legendary"',
    '[class.nw-item-rarity-artifact]': 'rarity() === "artifact"',
    '[class.nw-item-icon-bg]': 'solid()',
    '[class.nw-item-icon-mask]': '!solid()',
    '[class.named]': 'isNamed()',
    '[class.rounded-full]': 'rounded()',
    '[class.overflow-clip]': 'rounded()',
  },
})
export class ItemIconFrameComponent {
  public icon = input<string | MasterItemDefinitions | HouseItems>(null, { alias: 'nwbItemIcon' })
  public rarity = input<string>()
  public solid = input<boolean>(false)
  public isNamed = input<boolean>()
  public cover = input<boolean>(false)
  public borderless = input<boolean>(false)
  public rounded = input<boolean>(false)
}
