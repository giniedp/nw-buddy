import { computed, inject, Injectable } from '@angular/core'
import { CharactersDB } from '../characters'
import { GearsetsDB } from '../gearsets/gearsets.db'
import { GearsetRecord } from '../gearsets/types'
import { ItemInstanceRecord, ItemInstancesDB } from '../items'
import { SkillBuildsDB } from '../skillbuilds/skill-builds.db'
import { SkillTreeRecord } from '../skillbuilds/types'
import { injectBackendAdapter } from './provider'

@Injectable({
  providedIn: 'root',
})
export class BackendService {
  private adapter = injectBackendAdapter()

  public readonly isEnabled = this.adapter.isEnabled
  public readonly isOnline = this.adapter.isOnline
  public readonly session = this.adapter.session
  public readonly isSignedIn = computed(() => !!this.session()?.token)
  public readonly sessionUserId = computed(() => this.session()?.id || null)

  public signIn() {
    return this.adapter.signIn()
  }

  public signOut() {
    return this.adapter.signOut()
  }

  private gearsets = inject(GearsetsDB)
  private skillBuilds = inject(SkillBuildsDB)
  private itemInstances = inject(ItemInstancesDB)
  private characters = inject(CharactersDB)

  public readonly privateTables = {
    gearsets: this.adapter.initPrivateTable(this.gearsets),
    skillSets: this.adapter.initPrivateTable(this.skillBuilds),
    items: this.adapter.initPrivateTable(this.itemInstances),
    characters: this.adapter.initPrivateTable(this.characters),
  }

  public readonly publicTables = {
    gearsets: this.adapter.initPublicTable<GearsetRecord>(`public_${this.gearsets.tableName}`),
    skillSets: this.adapter.initPublicTable<SkillTreeRecord>(`public_${this.skillBuilds.tableName}`),
    items: this.adapter.initPublicTable<ItemInstanceRecord>(this.itemInstances.tableName),
  }
}
