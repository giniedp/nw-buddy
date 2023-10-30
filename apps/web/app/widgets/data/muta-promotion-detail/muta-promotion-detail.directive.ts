import { Directive, forwardRef, Input } from '@angular/core'
import { MutaPromotionDetailStore } from './muta-promotion-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbMutaPromotionDetail]',
  exportAs: 'promotionDetail',
  providers: [
    {
      provide: MutaPromotionDetailStore,
      useExisting: forwardRef(() => MutaPromotionDetailDirective),
    },
  ],
})
export class MutaPromotionDetailDirective extends MutaPromotionDetailStore {
  @Input()
  public set nwbMutaPromotionDetail(value: string) {
    this.patchState({ promotionId: value })
  }
}
