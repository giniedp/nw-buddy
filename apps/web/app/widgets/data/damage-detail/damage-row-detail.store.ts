import { Injectable, Output } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { Damagetable } from '@nw-data/types'
import { NwDbService } from '~/nw'
import { rejectKeys } from '~/utils'

@Injectable()
export class DamageRowDetailStore extends ComponentStore<{ rowId: string }> {
  public readonly rowId$ = this.select(({ rowId }) => rowId)

  @Output()
  public readonly gameEvent$ = this.select(this.db.damageTable(this.rowId$), (it) => it)

  public readonly properties$ = this.select(this.gameEvent$, selectProperties)

  public constructor(protected db: NwDbService) {
    super({ rowId: null })
  }

  public update(rowId: string) {
    this.patchState({ rowId: rowId })
  }
}

function selectProperties(item: Damagetable) {
  const reject = ['$source']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key))
}
