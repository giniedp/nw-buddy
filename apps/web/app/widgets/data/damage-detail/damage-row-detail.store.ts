import { Injectable, Output } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { Affixstats, Damagetable } from '@nw-data/generated'
import { switchMap } from 'rxjs'
import { NwDbService } from '~/nw'
import { combineLatestOrEmpty, rejectKeys } from '~/utils'

@Injectable()
export class DamageRowDetailStore extends ComponentStore<{ rowId: string }> {
  public readonly rowId$ = this.select(({ rowId }) => rowId)

  @Output()
  public readonly row$ = this.select(this.db.damageTable(this.rowId$), (it) => it)

  public readonly properties$ = this.select(this.row$, selectProperties)

  public readonly affixId$ = this.select(this.row$, (it) => it?.Affixes)
  public readonly affix$ = this.select(this.db.affixStat(this.affixId$), (it) => it)
  public readonly affixProps$ = this.select(this.affix$, selectAffixProperties)

  public readonly statusEffectIds$ = this.select(this.row$, (it) => it?.StatusEffect)
  public readonly statusEffects$ = this.statusEffectIds$.pipe(
    switchMap((ids) => combineLatestOrEmpty(ids.map((id) => this.db.statusEffect(id)))),
  )

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

function selectAffixProperties(item: Affixstats) {
  const reject = ['$source']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key))
}
