import { Injectable, inject } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { NW_FALLBACK_ICON, getGatherableNodeSize, getGatherableNodeSizes } from '@nw-data/common'
import { Gatherables } from '@nw-data/generated'
import { uniq } from 'lodash'
import { combineLatest, map, of, switchMap } from 'rxjs'
import { NwDbService } from '~/nw'
import { combineLatestOrEmpty, mapList, mapProp, selectStream, switchMapCombineLatest } from '~/utils'
import { getGatherableIcon } from './utils'

@Injectable()
export class GatherableDetailStore extends ComponentStore<{ recordId: string }> {
  protected db = inject(NwDbService)

  public readonly recordId$ = this.select(({ recordId }) => recordId)

  public readonly variation$ = selectStream(this.db.gatherableVariation(this.recordId$))
  public readonly gatherable$ = selectStream(
    {
      byId: this.db.gatherable(this.recordId$),
      byVariation: this.db.gatherable(this.variation$.pipe(mapProp('GatherableID'))),
    },
    ({ byVariation, byId }) => byId ?? byVariation,
  )
  public readonly variations$ = selectStream(this.db.gatherableVariationsByGatherableId(this.recordId$), (it) => Array.from(it || []))

  public readonly gatherableId$ = selectStream(this.gatherable$, (it) => it?.GatherableID)
  public readonly gatherableMeta$ = selectStream(this.db.gatherablesMeta(this.gatherableId$))

  public readonly icon$ = this.select(this.gatherable$, (it) => getGatherableIcon(it) || NW_FALLBACK_ICON)
  public readonly name$ = this.select(this.gatherable$, (it) => it?.DisplayName)
  public readonly size$ = this.select(this.gatherableId$, (id) => (id ? getGatherableNodeSize(id) : null))
  public readonly tradeSkill$ = this.select(this.gatherable$, (it) => it?.Tradeskill)
  public readonly lootTableIds$ = this.select(this.gatherable$, this.variations$, (gatherable, variations) => {
    const result = []
    result.push(gatherable?.FinalLootTable)
    for (const variation of variations || []) {
      result.push(variation.LootTable)
    }
    return uniq(result.filter((it) => !!it && it !== 'Empty'))
  })

  public readonly siblings$ = selectStream(
    {
      size: this.size$,
      gatherableId: this.gatherableId$,
      gatherablesMap: this.db.gatherablesMap,
    },
    ({ size, gatherableId, gatherablesMap }) => {
      if (!gatherableId) {
        return null
      }
      if (!size) {
        return [gatherablesMap.get(gatherableId)]
      }
      const result: Gatherables[] = []
      for (const siblingSize of getGatherableNodeSizes()) {
        const siblingId = gatherableId.replace(size, siblingSize)
        const sibling = gatherablesMap.get(siblingId)
        if (sibling) {
          result.push(sibling)
        }
      }
      if (!result.length) {
        return null
      }
      return result
    },
  )

  public readonly siblingsVariations$ = selectStream(
    this.siblings$.pipe(
      switchMapCombineLatest((it) => this.db.gatherableVariationsByGatherableId(it.GatherableID)),
      mapList((it) => Array.from(it || [])),
      map((list) => list.flat()),
      map((list) => list.filter((it) => !!it)),
    ),
  )

  public readonly variationsMetadata$ = selectStream(
    this.siblingsVariations$.pipe(
      mapList((it) => it.VariantID),
      map(uniq),
      switchMapCombineLatest((it) => this.db.variationsMeta(it)),
      map((list) => list.filter((it) => !!it)),
    ),
  )

  public readonly variationsMetaChunks$ = selectStream(
    this.variationsMetadata$.pipe(
      map((list) => list.filter((it) => it?.variantPositions?.length)),
      switchMap((list) => {
        const chunkIds = uniq(list.map((it) => it.variantPositions.map((chunk) => chunk.chunk)).flat())
        const chunks = combineLatestOrEmpty(
          chunkIds.map((it) => {
            return combineLatest({
              chunk: of(it),
              data: this.db.variationsChunk(it),
            })
          }),
        )
        return chunks
      }),
    ),
  )

  public readonly props$ = this.select(this.gatherable$, (it) => {
    const result: Array<{ label: string; value: string }> = []
    if (it?.BaseGatherTime) {
      result.push({ label: 'Gather Time', value: secondsToDuration(it.BaseGatherTime) })
    }
    if (it?.MinRespawnRate) {
      result.push({ label: 'Min Respawn Time', value: secondsToDuration(it.MinRespawnRate) })
    }
    if (it?.MaxRespawnRate) {
      result.push({ label: 'Max Respawn Time', value: secondsToDuration(it.MaxRespawnRate) })
    }
    if (it?.Tradeskill) {
      result.push({ label: 'Tradeskill', value: it.Tradeskill })
    }
    return result
  })

  public constructor() {
    super({ recordId: null })
  }

  public load(idOrItem: string | Gatherables) {
    if (typeof idOrItem === 'string') {
      this.patchState({ recordId: idOrItem })
    } else {
      this.patchState({ recordId: idOrItem?.GatherableID })
    }
  }
}

function secondsToDuration(value: number) {
  const milliseconds = Math.floor(value * 1000) % 1000
  const seconds = Math.floor(value % 60)
  const minutes = Math.floor(value / 60) % 60
  const hours = Math.floor(value / 3600) % 24
  const days = Math.floor(value / 86400)
  const result = []
  if (milliseconds) {
    result.push(`${milliseconds}ms`)
  }
  if (seconds) {
    result.push(`${seconds}s`)
  }
  if (minutes) {
    result.push(`${minutes}m`)
  }
  if (hours) {
    result.push(`${hours}h`)
  }
  if (days) {
    result.push(`${days}d`)
  }
  return result.reverse().join(' ')
}
