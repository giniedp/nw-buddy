import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy, Input, HostBinding } from '@angular/core'
import { ItemRarity, getItemRarity, isItemArtifact, isItemNamed, isMasterItem } from '@nw-data/common'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/generated'

@Component({
  standalone: true,
  selector: 'nwb-item-header',
  template: `
    <div class="nw-item-header-bg"></div>
    <div class="nw-item-header-fg" *ngIf="isNamed"></div>
    <ng-content></ng-content>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  host: {
    class: 'nw-item-header flex flex-row p-1 text-shadow-sm shadow-black',
    '[class.nw-item-rarity-common]': 'rarity === "common"',
    '[class.nw-item-rarity-uncommon]': 'rarity === "uncommon"',
    '[class.nw-item-rarity-rare]': 'rarity === "rare"',
    '[class.nw-item-rarity-epic]': 'rarity === "epic"',
    '[class.nw-item-rarity-legendary]': 'rarity === "legendary"',
    '[class.nw-item-rarity-artifact]': 'rarity === "artifact"',
  },
})
export class ItemHeaderComponent {
  @Input()
  public rarity: ItemRarity

  @Input()
  @HostBinding('class.named')
  public isNamed: boolean

  @Input()
  public set item(value: ItemDefinitionMaster | Housingitems) {
    this.rarity = getItemRarity(value)
    this.isNamed = isMasterItem(value) && isItemNamed(value)
  }

  public constructor() {
    //
  }
}
