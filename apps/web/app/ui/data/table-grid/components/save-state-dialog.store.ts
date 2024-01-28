import { Injectable } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ComponentStore } from '@ngrx/component-store'
import { combineLatest, map } from 'rxjs'
import { TablePresetDB, TablePresetRecord } from '~/data'
import { eqCaseInsensitive } from '~/utils'

@Injectable()
export class SaveStateDialogStore extends ComponentStore<{
  entries: TablePresetRecord[]
  key: string
  selection: string
}> {
  public readonly key$ = this.selectSignal(({ key }) => key)
  public readonly entries$ = this.selectSignal(({ entries }) => entries)
  public readonly selection$ = this.selectSignal(({ selection }) => selection)
  public readonly selectedData$ = this.selectSignal(
    toSignal(this.db.observeByid(this.select(({ selection }) => selection)))
  )

  public constructor(private db: TablePresetDB) {
    super({
      entries: null,
      selection: null,
      key: null,
    })
    this.load()
  }

  private load = this.effect<void>(() => {
    return combineLatest({
      entries: this.db.observeAll(),
      key: this.select(({ key }) => key),
    }).pipe(
      map(({ entries, key }) => {
        entries = entries?.filter((it) => eqCaseInsensitive(it.key, key))
        this.patchState({ entries })
      })
    )
  })

  public deleteEntry(id: string) {
    return this.db.destroy(id)
  }

  public createEntry(name: string) {
    return this.db.create({
      name: name,
      key: this.key$(),
    })
  }

  public updateName(id: string, name: string) {
    return this.db.update(id, { name })
  }

  public saveData(id: string, data: Pick<TablePresetRecord, 'columns' | 'filter'>) {
    return this.db.update(id, data)
  }
}
