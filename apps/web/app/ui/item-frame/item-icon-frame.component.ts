import { animate, style, transition, trigger } from '@angular/animations'
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'
import { getItemId, ItemRarity } from '@nw-data/common'
import { HouseItems, MasterItemDefinitions } from '@nw-data/generated'
import { NwModule } from '~/nw'

@Component({
  standalone: true,
  selector: 'nwb-item-icon,a[nwbItemIcon]',
  template: `
    <div class="nw-item-icon-border"></div>
    @for (item of icons(); track item.id) {
      <picture class="absolute top-[1px] left-[1px] right-[1px] bottom-[1px]" [@inOut]>
        <img
          [nwImage]="item.value"
          class="w-full h-full"
          [class.object-contain]="!cover()"
          [class.object-cover]="cover()"
        />
      </picture>
    }
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
  },
  animations: [
    trigger('inOut', [
      transition(':enter', [style({ opacity: 0 }), animate('0.15s ease', style({ opacity: 1 }))]),
      transition(':leave', [style({ opacity: '*' }), animate('0.15s ease', style({ opacity: 0 }))]),
    ]),
  ],
})
export class ItemIconFrameComponent {
  public icon = input<string | MasterItemDefinitions | HouseItems>(null, { alias: 'nwbItemIcon' })
  public rarity = input<ItemRarity>()
  public solid = input<boolean>(false)
  public isNamed = input<boolean>()
  public cover = input<boolean>(false)

  protected icons = computed(() => {
    const value = this.icon()
    if (!value) {
      return null
    }

    return [
      {
        id: typeof value === 'string' ? value : getItemId(value),
        value: this.icon(),
      },
    ]
  })
}
