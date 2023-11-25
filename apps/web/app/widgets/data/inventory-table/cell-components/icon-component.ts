import { ICellRendererParams } from '@ag-grid-community/core'
import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { ItemInstance, ItemInstanceRow } from '~/data'
import { ICellRendererAngularComp } from '~/ui/data/ag-grid'
import { ItemFrameModule } from '~/ui/item-frame'
import { TooltipModule } from '~/ui/tooltip'
import { ItemDetailModule } from '../../item-detail'

@Component({
  standalone: true,
  selector: 'nwb-icon',
  template: `
    <nwb-item-icon
      [nwbItemDetail]="itemId"
      [gsOverride]="instance?.gearScore"
      [perkOverride]="instance?.perks"
      #detail="itemDetail"
      [nwbItemIcon]="detail.icon$ | async"
      [isNamed]="detail.isNamed$ | async"
      [rarity]="detail.finalRarity$ | async"
      [solid]="true"
      [tooltip]="tplTip"
      [tooltipPlacement]="'right'"
      class="w-11 h-11 transition-all translate-x-0 hover:translate-x-1"
    />
    <ng-template #tplTip>
      <nwb-item-card
        class="relative flex-1"
        [entityId]="itemId"
        [gsOverride]="instance?.gearScore"
        [perkOverride]="instance?.perks"
      >
      </nwb-item-card>
    </ng-template>
  `,
  imports: [CommonModule, ItemFrameModule, ItemDetailModule, TooltipModule],
})
export class IconComponent implements ICellRendererAngularComp {
  protected itemId: string
  protected instance: ItemInstance
  public agInit(params: ICellRendererParams<ItemInstanceRow>): void {
    const item = params.data.item
    this.itemId = item.ItemID
    this.instance = params.data.record
  }

  public refresh(params: ICellRendererParams) {
    return false
  }
}
