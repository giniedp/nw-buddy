import { inject, Injectable } from '@angular/core'
import { NPCData, VariationData } from '@nw-data/generated'
import { ScannedNpc, ScannedVariation } from '@nw-data/generated'
import { groupBy, uniq } from 'lodash'
import { switchMap } from 'rxjs'
import { injectNwData } from '~/data'
import { table, tableGroupBy, tableIndexBy, tableLookup } from '~/data/nw-data/dsl'
import { LocaleService, TranslateService } from '~/i18n'
import { humanize, selectStream } from '~/utils'

export interface NpcInfo {
  id: string

  data: NPCData
  meta: ScannedNpc
  variations: Array<{
    data: VariationData
    meta: ScannedVariation
  }>
}
export interface NpcGroup {
  id: string
  title: string
  name: string
  npcs: NpcInfo[]
}

@Injectable({ providedIn: 'root' })
export class NpcService {
  private db = injectNwData()
  private tl8 = inject(TranslateService)
  private locale = inject(LocaleService)

  public npc$ = tableLookup(() => this.npcsMap$)
  public npcsMap$ = tableIndexBy(() => this.npcs$, 'id')
  public npcs$ = selectStream(
    {
      npcsMap: this.db.npcsByIdMap(),
      npcMetaMap: this.db.npcsMetadataByIdMap(),
      npcsVariationsMap: this.db.npcsVariationsByNpcIdMap(),
      variationMetaMap: this.db.variationsMetadataByIdMap(),
    },
    (data) => {
      if (!data.npcsMap || !data.npcMetaMap || !data.npcsVariationsMap || !data.variationMetaMap) {
        return []
      }
      const npcIds = uniq([
        ...data.npcsMap.keys(),
        //...data.npcsVariationsMap.keys(),
      ])
      return npcIds.map((id): NpcInfo => {
        const npcs = data.npcsMap.get(id)
        const meta = data.npcMetaMap.get(id)

        const variations =
          data.npcsVariationsMap.get(id)?.map((variation) => {
            return {
              data: variation,
              meta: data.variationMetaMap.get(variation.VariantID),
            }
          }) || []
        return {
          id: id,
          data: npcs?.[0],
          meta: meta,
          variations: variations,
        }
      })
    },
  )

  public npcsVariantChunksMap$ = tableIndexBy(() => this.npcsVariantChunks$, 'id')
  public npcsVariantChunks$ = table(() => {
    return this.npcs$.pipe(
      switchMap(async (list) => {
        const ids: number[] = []
        for (const npc of list) {
          for (const variation of npc.variations) {
            if (!variation?.meta?.spawns?.length) {
              continue
            }
            for (const spawn of variation.meta.spawns || []) {
              if (!ids.includes(spawn.positions.chunkID)) {
                ids.push(spawn.positions.chunkID)
              }
            }
          }
        }
        return Promise.all(
          ids.map(async (id) => {
            return {
              id,
              data: await this.db.variationsChunk(id),
            }
          }),
        )
      }),
    )
  })

  public groups$ = selectStream(
    {
      npcs: this.npcs$,
      locale: this.locale.value$,
    },
    ({ npcs }) => selectNpcs(npcs, this.tl8),
  )

  public groupsMap$ = tableIndexBy(() => this.groups$, 'id')
  public group$ = tableLookup(() => this.groupsMap$)
  public groupsByNpcIdMap$ = tableGroupBy(
    () => this.groups$,
    (group) => group.npcs.map((it) => it.id),
  )
  public groupsByNpcId$ = tableLookup(() => this.groupsByNpcIdMap$)
}

function selectNpcs(items: NpcInfo[], tl8: TranslateService): NpcGroup[] {
  const groups = groupBy(items, (it) => npcGroupName(it, tl8))
  return Object.entries(groups).map(([groupId, npcs]) => {
    const npc = npcs[0].data
    return {
      id: groupId,
      name: npc ? npc.GenericName : humanize(groupId),
      title: npc?.Title,
      npcs: npcs,
    }
  })
}

function npcGroupName(npc: NpcInfo, tl8: TranslateService) {
  if (!npc) {
    return null
  }
  const data = npc.data
  if (data?.GenericName) {
    return tl8.get(data.GenericName)
  }
  const names = uniq((npc.variations || []).map((it) => tl8.get(it.data.Name)).filter((it) => !!it))
  if (names.length === 1) {
    return names[0]
  }
  return npc.id
}
