import { Directive, inject, Input } from '@angular/core'
import { MutaPromotionDetailStore } from './muta-promotion-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbMutaPromotionDetail]',
  exportAs: 'promotionDetail',
  providers: [MutaPromotionDetailStore],
})
export class MutaPromotionDetailDirective {
  private store = inject(MutaPromotionDetailStore)
  @Input()
  public set nwbMutaPromotionDetail(value: string) {
    this.store.load({ promotionId: value, elementId: null })
  }
}
