import { Directive, forwardRef, Input, Output } from '@angular/core'
import { firstValueFrom, map } from 'rxjs'
import { StatusEffectCategoryDetailStore } from './status-effect-category.store'
import { extractLimits } from './utils'

@Directive({
  standalone: true,
  selector: '[nwbStatusEffectCategoryDetail],[nwbStatusEffectCategoryDetailByProp]',
  exportAs: 'detail',
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

  @Input()
  public set nwbStatusEffectCategoryDetailByProp(value: string) {
    this.loadByPropId(value)
  }

  @Output()
  public nwbStatusEffectCategoryChange = this.category$

  private async loadByPropId(id: string) {
    const category = await firstValueFrom(
      this.db.statusEffectCategories.pipe(
        map((list) => {
          return list.find((it) => !!extractLimits(it.ValueLimits)?.[id])
        })
      )
    )
    this.patchState({ categoryId: category?.StatusEffectCategoryID })
  }
}
