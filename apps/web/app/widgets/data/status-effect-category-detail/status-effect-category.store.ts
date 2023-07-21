import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { Statuseffectcategories } from '@nw-data/generated'
import { NwDbService } from '~/nw'
import { rejectKeys, tapDebug } from '~/utils'

@Injectable()
export class StatusEffectCategoryDetailStore extends ComponentStore<{ categoryId: string }> {
  public readonly categoryId$ = this.select(({ categoryId }) => categoryId)
  public readonly category$ = this.select(this.db.statusEffectCategory(this.categoryId$), (it) => it)
  public readonly limits$ = this.select(this.category$, (it) => it?.ValueLimits)

  public readonly properties$ = this.select(this.category$, selectProperties)

  public constructor(private db: NwDbService) {
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

function selectProperties(item: Statuseffectcategories) {
  const reject = ['$source']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key))
}
