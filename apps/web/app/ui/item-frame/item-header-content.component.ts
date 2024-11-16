import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { RouterModule } from '@angular/router'
import {
  ItemRarity,
  getItemRarity,
  getItemRarityLabel,
  getItemSourceShort,
  isItemNamed,
  isMasterItem,
} from '@nw-data/common'
import { HouseItems, MasterItemDefinitions } from '@nw-data/generated'

@Component({
  standalone: true,
  selector: 'nwb-item-header-content,a[nwbItemHeaderContent]',
  templateUrl: './item-header-content.component.html',
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex-1 flex flex-col justify-between overflow-hidden',
  },
})
export class ItemHeaderContentComponent {
  @Input()
  public showSkeleton: boolean

  @Input()
  public isNamed: boolean

  @Input()
  public rarity: ItemRarity

  @Input()
  public title: string

  @Input()
  public titleLink: string | any[]

  @Input()
  public text1: string

  @Input()
  public text2: string

  @Input()
  public text3: string

  @Input()
  public set item(value: MasterItemDefinitions | HouseItems) {
    this.title = value?.Name
    this.text1 = getItemRarityLabel(value)
    this.text2 = value?.ItemType
    this.text3 = getItemSourceShort(value)
    this.rarity = getItemRarity(value)
    this.isNamed = isMasterItem(value) && isItemNamed(value)
  }
}
