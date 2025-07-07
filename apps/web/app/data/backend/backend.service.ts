import { computed, inject, Injectable } from '@angular/core'
import { CharactersDB } from '../characters'
import { GearsetsDB } from '../gearsets/gearsets.db'
import { GearsetRecord } from '../gearsets/types'
import { ItemInstanceRecord, ItemInstancesDB } from '../items'
import { SkillTreesDB } from '../skill-tree/skill-trees.db'
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

  private gearsets = inject(GearsetsDB)
  private skills = inject(SkillTreesDB)
  private items = inject(ItemInstancesDB)
  private characters = inject(CharactersDB)

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
