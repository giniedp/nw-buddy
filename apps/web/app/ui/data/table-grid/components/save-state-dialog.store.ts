import { inject, Injectable } from '@angular/core'
import { rxResource } from '@angular/core/rxjs-interop'
import { patchState, signalState } from '@ngrx/signals'
import { TablePresetRecord, TablePresetsService } from '~/data'

interface SaveStateDialogState {
  entries: TablePresetRecord[]
  key: string
  selection: string
}
@Injectable()
export class SaveStateDialogStore {
  private service = inject(TablePresetsService)
  private state = signalState<SaveStateDialogState>({
    entries: [],
    key: null,
    selection: null,
  })

  public readonly key = this.state.key
  public readonly entries = rxResource({
    params: this.key,
    stream: ({ params }) => this.service.observeRecords({ key: params }),
    defaultValue: [],
  }).value

  public readonly selection = this.state.selection
  public readonly selectedData = rxResource({
    params: this.selection,
    stream: ({ params }) => this.service.observeRecord({ id: params }),
    defaultValue: null,
  }).value

  public select(id: string) {
    patchState(this.state, {
      selection: id,
    })
  }

  public selectScope(key: string) {
    patchState(this.state, {
      key,
    })
  }

  public delete(id: string) {
    return this.service.delete(id)
  }

  public create(name: string) {
    return this.service.create({
      name: name,
      key: this.key(),
    })
  }

  public rename(id: string, name: string) {
    return this.service.update(id, { name })
  }

  public save(id: string, data: Pick<TablePresetRecord, 'columns' | 'filter'>) {
    return this.service.update(id, data)
  }
}
