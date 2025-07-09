import { computed, Injectable } from '@angular/core'
import { injectCharactersDB } from '../characters'
import { injectGearsetsDB } from '../gearsets'
import { GearsetRecord } from '../gearsets/types'
import { injectItemInstancesDB, ItemInstanceRecord } from '../items'
import { injectSkillTreesDB } from '../skill-tree'
import { SkillTreeRecord } from '../skill-tree/types'
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

  private gearsets = injectGearsetsDB()
  private skills = injectSkillTreesDB()
  private items = injectItemInstancesDB()
  private characters = injectCharactersDB()

  public readonly privateTables = {
    gearsets: this.adapter.initPrivateTable(this.gearsets),
    skillTrees: this.adapter.initPrivateTable(this.skills),
    items: this.adapter.initPrivateTable(this.items),
    characters: this.adapter.initPrivateTable(this.characters),
  }

  public readonly publicTables = {
    gearsets: this.adapter.initPublicTable<GearsetRecord>(`public_${this.gearsets.tableName}`),
    skillSets: this.adapter.initPublicTable<SkillTreeRecord>(`public_${this.skills.tableName}`),
    items: this.adapter.initPublicTable<ItemInstanceRecord>(this.items.tableName),
  }
}
