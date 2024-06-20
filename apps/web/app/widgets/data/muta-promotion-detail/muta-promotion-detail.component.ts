import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, forwardRef, Input } from '@angular/core'
import { StatusEffectData } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridModule } from '~/ui/property-grid'
import { MutaPromotionDetailStore } from './muta-promotion-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-muta-promotion-detail',
  templateUrl: './muta-promotion-detail.component.html',
  exportAs: 'promotionDetail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, PropertyGridModule],
  providers: [
    {
      provide: MutaPromotionDetailStore,
      useExisting: forwardRef(() => MutaPromotionDetailComponent),
    },
  ],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class MutaPromotionDetailComponent extends MutaPromotionDetailStore {
  @Input()
  public set promotionId(value: string) {
    this.patchState({ promotionId: value })
  }

  @Input()
  public set elementId(value: string) {
    this.patchState({ elementId: value })
  }

  protected description(item: StatusEffectData) {
    return item.Description || `${item.StatusID}_Tooltip`
  }
}
