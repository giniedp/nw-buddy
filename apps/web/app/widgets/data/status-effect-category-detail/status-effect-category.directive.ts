import { Directive, forwardRef, Input, Output } from '@angular/core'
import { NwDbService } from '~/nw'
import { StatusEffectCategoryDetailStore } from './status-effect-category.store'

@Directive({
  standalone: true,
  selector: '[nwbStatusEffectCategoryDetail]',
  exportAs: 'effectCategoryDetail',
  providers: [
    {
      provide: StatusEffectCategoryDetailStore,
      useExisting: forwardRef(() => StatusEffectCategoryDetailDirective),
    },
  ],
})
export class StatusEffectCategoryDetailDirective extends StatusEffectCategoryDetailStore {
  @Input()
  public set nwbStatusEffectCategoryDetail(value: string) {
    this.patchState({ categoryId: value })
  }

  @Output()
  public nwbStatusEffectCategoryChange = this.category$

  public constructor(db: NwDbService) {
    super(db)
  }
}
