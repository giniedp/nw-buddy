import { computed, effect, Injectable } from '@angular/core'
import { CharacterRecord } from '../characters'
import { GearsetRecord } from '../gearsets/types'
import { ItemInstanceRecord } from '../items'
import { SkillTreeRecord } from '../skill-tree/types'
import { TablePresetRecord } from '../table-presets'
import { TransmogRecord } from '../transmogs'
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
  public readonly userSignedIn = this.adapter.userSignedIn
  public readonly userSignedOut = this.adapter.userSignedOut

  public readonly privateTables = {
    gearsets: this.adapter.initPrivateTable<GearsetRecord>('gearsets'),
    skillTrees: this.adapter.initPrivateTable<SkillTreeRecord>('skilltrees'),
    items: this.adapter.initPrivateTable<ItemInstanceRecord>('items'),
    characters: this.adapter.initPrivateTable<CharacterRecord>('characters'),
    transmogs: this.adapter.initPrivateTable<TransmogRecord>('transmogs'),
    grids: this.adapter.initPrivateTable<TablePresetRecord>('grids'),
  }

  public readonly publicTables = {
    gearsets: this.adapter.initPublicTable<GearsetRecord>(`public_gearsets`),
    skillSets: this.adapter.initPublicTable<SkillTreeRecord>(`public_skilltrees`),
    transmogs: this.adapter.initPublicTable<TransmogRecord>(`public_transmogs`),
  }

  public signIn() {
    return this.adapter.signIn()
  }

  public signOut() {
    return this.adapter.signOut()
  }
}
