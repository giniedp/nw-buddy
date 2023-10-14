import { Injectable, inject } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { Statuseffectcategories } from '@nw-data/generated'
import { combineLatest } from 'rxjs'
import { NwDbService } from '~/nw'
import { extractLimits, selectLimitsTable } from './utils'
import { toSignal } from '@angular/core/rxjs-interop'

@Injectable()
export class StatusEffectCategoryDetailStore extends ComponentStore<{ categoryId: string }> {
  protected db: NwDbService = inject(NwDbService)

  public readonly categoryId$ = this.select(({ categoryId }) => categoryId)
  public readonly category$ = this.select(this.db.statusEffectCategory(this.categoryId$), (it) => it)
  public readonly limits$ = this.select(this.category$, (it) => extractLimits(it))
  public readonly limitsTable$ = this.select(
    combineLatest({
      category: this.category$,
      categories: this.db.statusEffectCategories,
    }),
    ({ category, categories }) => selectLimitsTable(category, categories)
  )
  public readonly hasLimits$ = this.select(this.limitsTable$, (it) => !!it)
  public readonly hasLimitsSig = toSignal(this.hasLimits$)


  public constructor() {
    super({ categoryId: null })
  }

  public load(idOrItem: string | Statuseffectcategories) {
    if (typeof idOrItem === 'string') {
      this.patchState({ categoryId: idOrItem })
    } else {
      this.patchState({ categoryId: idOrItem?.StatusEffectCategoryID })
    }
  }
}
