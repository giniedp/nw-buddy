import { Directive, effect, inject, input, untracked } from '@angular/core'
import { injectNwData } from '~/data'
import { StatusEffectCategoryDetailStore } from './status-effect-category.store'
import { extractLimits } from './utils'

@Directive({
  standalone: true,
  selector: '[nwbStatusEffectCategoryDetail],[nwbStatusEffectCategoryDetailByProp]',
  exportAs: 'detail',
  providers: [StatusEffectCategoryDetailStore],
})
export class StatusEffectCategoryDetailDirective {
  private db = injectNwData()
  private store = inject(StatusEffectCategoryDetailStore)
  public hasLimits = this.store.hasLimits
  public categoryId = input<string>(null, {
    alias: 'nwbStatusEffectCategoryDetail',
  })
  public propId = input<string>(null, {
    alias: 'nwbStatusEffectCategoryDetailByProp',
  })

  #fxLoad = effect(() => {
    const categoryId = this.categoryId()
    const propId = this.propId()
    untracked(() => {
      if (!propId) {
        this.store.load(categoryId)
      }
      if (!categoryId) {
        this.loadByPropId(propId)
      }
    })
  })

  private async loadByPropId(id: string) {
    const categories = await this.db.statusEffectCategoriesAll()
    const category = categories.find((it) => !!extractLimits(it.ValueLimits)?.[id])
    this.store.load(category?.StatusEffectCategoryID)
  }
}
