import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, effect, inject, input, untracked } from '@angular/core'
import { StatusEffectData } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridModule } from '~/ui/property-grid'
import { MutaPromotionDetailStore } from './muta-promotion-detail.store'

@Component({
  selector: 'nwb-muta-promotion-detail',
  templateUrl: './muta-promotion-detail.component.html',
  exportAs: 'promotionDetail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, PropertyGridModule],
  providers: [MutaPromotionDetailStore],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class MutaPromotionDetailComponent {
  public store = inject(MutaPromotionDetailStore)
  public promotionId = input<string>(null)
  public elementId = input<string>(null)

  #loader = effect(() => {
    const promotionId = this.promotionId()
    const elementId = this.elementId()
    untracked(() => this.store.load({ promotionId, elementId }))
  })

  protected description(item: StatusEffectData) {
    return item.Description || `${item.StatusID}_Tooltip`
  }
}
