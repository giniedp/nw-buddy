import { Injectable, Output } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { Spelltable } from '@nw-data/generated'
import { NwDataService } from '~/data'
import { rejectKeys } from '~/utils'

@Injectable()
export class SpellDetailStore extends ComponentStore<{ spellId: string }> {
  public readonly spellId$ = this.select(({ spellId }) => spellId)

  @Output()
  public readonly spell$ = this.select(this.db.spell(this.spellId$), (it) => it)

  public readonly properties$ = this.select(this.spell$, selectProperties)

  public constructor(protected db: NwDataService) {
    super({ spellId: null })
  }

  public update(entityId: string) {
    this.patchState({ spellId: entityId })
  }
}

function selectProperties(item: Spelltable) {
  const reject = ['$source', 'SpellPrefabPath']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key))
}
