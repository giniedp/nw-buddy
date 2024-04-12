import { Directive, inject, Input } from '@angular/core'
import { patchState } from '@ngrx/signals'
import { firstValueFrom, map } from 'rxjs'
import { NwDataService } from '~/data'
import { StatusEffectCategoryDetailStore } from './status-effect-category.store'
import { extractLimits } from './utils'

@Directive({
  standalone: true,
  selector: '[nwbStatusEffectCategoryDetail],[nwbStatusEffectCategoryDetailByProp]',
  exportAs: 'detail',
  providers: [StatusEffectCategoryDetailStore],
})
export class StatusEffectCategoryDetailDirective {
  private db = inject(NwDataService)
  private store = inject(StatusEffectCategoryDetailStore)
  public hasLimits = this.store.hasLimits
  @Input()
  public set nwbStatusEffectCategoryDetail(value: string) {
    patchState(this.store, { categoryId: value })
  }

  @Input()
  public set nwbStatusEffectCategoryDetailByProp(value: string) {
    this.loadByPropId(value)
  }

  private async loadByPropId(id: string) {
    const category = await firstValueFrom(
      this.db.statusEffectCategories.pipe(
        map((list) => {
          return list.find((it) => !!extractLimits(it.ValueLimits)?.[id])
        }),
      ),
    )
    patchState(this.store, { categoryId: category?.StatusEffectCategoryID })
  }
}
