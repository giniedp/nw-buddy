import { computed, Injectable } from '@angular/core'
import { BookmarkRecord } from '../bookmarks/types'
import { CharacterRecord } from '../characters/types'
import { GearsetRecord } from '../gearsets/types'
import { ItemInstanceRecord } from '../items/types'
import { SkillTreeRecord } from '../skill-tree/types'
import { TablePresetRecord } from '../table-presets/types'
import { TransmogRecord } from '../transmogs/types'
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
    bookmarks: this.adapter.initPrivateTable<BookmarkRecord>('bookmarks'),
    characters: this.adapter.initPrivateTable<CharacterRecord>('characters'),
    gearsets: this.adapter.initPrivateTable<GearsetRecord>('gearsets'),
    grids: this.adapter.initPrivateTable<TablePresetRecord>('grids'),
    items: this.adapter.initPrivateTable<ItemInstanceRecord>('items'),
    skillTrees: this.adapter.initPrivateTable<SkillTreeRecord>('skilltrees'),
    transmogs: this.adapter.initPrivateTable<TransmogRecord>('transmogs'),
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
