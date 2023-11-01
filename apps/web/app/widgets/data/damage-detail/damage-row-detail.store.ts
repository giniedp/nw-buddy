import { Injectable, Output } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { Affixstats, Damagetable } from '@nw-data/generated'
import { NwDbService } from '~/nw'
import { rejectKeys } from '~/utils'

@Injectable()
export class DamageRowDetailStore extends ComponentStore<{ rowId: string }> {
  public readonly rowId$ = this.select(({ rowId }) => rowId)

  @Output()
  public readonly row$ = this.select(this.db.damageTable(this.rowId$), (it) => it)

  public readonly properties$ = this.select(this.row$, selectProperties)

  public readonly affixId$ = this.select(this.row$, (it) => it?.Affixes)
  public readonly affix$ = this.select(this.db.affixstat(this.affixId$), (it) => it)
  public readonly affixProps$ = this.select(this.affix$, selectAffixProperties)

  public readonly statusEffectId$ = this.select(this.row$, (it) => it?.StatusEffect)
  public readonly statusEffect$ = this.select(this.db.statusEffect(this.statusEffectId$), (it) => it)

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
