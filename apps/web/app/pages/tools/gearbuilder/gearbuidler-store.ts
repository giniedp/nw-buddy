import { Injectable } from '@angular/core'
import { customAlphabet } from 'nanoid/non-secure'
import { map } from 'rxjs'
import { EquipSlotId } from '~/nw/utils'
import { PreferencesService, StorageScopeNode } from '~/preferences'

const createId = customAlphabet('abcdefghijklmnopqestuvwxyz0123456789', 10)

export type GearsetRecord = {
  name?: string
  items?: Record<string, GearsetItem>
}

export type GearsetItem = {
  itemId?: string
  gearScore?: number
  perks?: Record<string, string>
}

@Injectable({ providedIn: 'root' })
export class GearbuilderStore {
  private storage: StorageScopeNode

  public constructor(pref: PreferencesService) {
    this.storage = pref.storage.storageScope('gearbuilder:')
  }

  public async getIds() {
    return this.storage.keys()
  }

  public observe(id: string) {
    return this.storage.observe<GearsetRecord>(id).pipe(map((it) => it.value))
  }

  public async create(value?: GearsetRecord) {
    const id = createId()
    this.update(id, (data) => {
      data = value || data
      data.name = 'Unnamed Gearset'
      return data
    })
    return id
  }

  public update(id: string, fn: (old: GearsetRecord) => GearsetRecord) {
    const data = this.storage.get<GearsetRecord>(id) || {}
    data.items = data.items || {}
    const update = fn(data)
    this.storage.set(id, update)
  }

  public delete(id: string) {
    this.storage.delete(id)
  }
}
