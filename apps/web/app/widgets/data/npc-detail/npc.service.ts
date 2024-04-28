import { Injectable, inject } from '@angular/core'
import { Npc } from '@nw-data/generated'
import { groupBy } from 'lodash'
import { NwDataService } from '~/data'
import { tableGroupBy, tableIndexBy, tableLookup } from '~/data/nw-data/dsl'
import { LocaleService, TranslateService } from '~/i18n'
import { selectStream } from '~/utils'

export interface NpcGroup {
  id: string
  name: string,
  title: string
  groupId: string
  npcs: Npc[]
}

@Injectable({ providedIn: 'root' })
export class NpcService {
  private db = inject(NwDataService)
  private tl8 = inject(TranslateService)
  private locale = inject(LocaleService)

  public groups$ = selectStream(
    {
      npcs: this.db.npcs,
      locale: this.locale.value$,
    },
    ({ npcs }) => selectNpcs(npcs, this.tl8),
  )
  public groupsMap$ = tableIndexBy(() => this.groups$, 'id')
  public group$ = tableLookup(() => this.groupsMap$)
  public groupByNpcIdMap$ = tableGroupBy(() => this.groups$,  (group) => group.npcs.map((npc) => npc.NPCId))
  public groupByNpcId$ = tableLookup(() => this.groupByNpcIdMap$)

  public npcGroupName(npc: Npc) {
    return npcGroupName(npc, this.tl8)
  }
}

function selectNpcs(items: Npc[], tl8: TranslateService): NpcGroup[] {
  const groups = groupBy(items, (it) => npcGroupName(it, tl8))
  return Object.entries(groups).map(([groupId, npcs]) => {
    const npc = npcs[0]
    return {
      id: npc.NPCId,
      name: npc.GenericName,
      title: npc.Title,
      groupId,
      npcs,
    }
  })
}

function npcGroupName(npc: Npc, tl8: TranslateService) {
  if (!npc) {
    return null
  }
  if (!npc.GenericName && !npc.Title) {
    return npc.NPCId
  }
  return tl8.get(npc.GenericName)
}
