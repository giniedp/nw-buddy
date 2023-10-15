import { Injectable, Output } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { Gatherables } from '@nw-data/generated'
import { NwDbService } from '~/nw'

@Injectable()
export class GatherableDetailStore extends ComponentStore<{ gatherableId: string }> {
  public readonly gatherableId$ = this.select(({ gatherableId }) => gatherableId)

  @Output()
  public readonly gatherable$ = this.select(this.db.gatherable(this.gatherableId$), (it) => it)

  public readonly icon$ = this.select(this.gatherable$, (it) => NW_FALLBACK_ICON)
  public readonly name$ = this.select(this.gatherable$, (it) => it?.DisplayName)
  public readonly size$ = this.select(this.gatherable$, (it) => it?.FinalLootTable?.match(/(Tiny|Small|Medium|Large|Huge)/)?.[0])
  public readonly tradeSkill$ = this.select(this.gatherable$, (it) => it?.Tradeskill)
  public readonly lootTableId$ = this.select(this.gatherable$, (it) => it?.FinalLootTable)

  public readonly props$ = this.select(this.gatherable$, (it) => {
    const result: Array<{ label: string, value: string }> = []
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

  public constructor(protected db: NwDbService) {
    super({ gatherableId: null })
  }

  public load(idOrItem: string | Gatherables) {
    if (typeof idOrItem === 'string') {
      this.patchState({ gatherableId: idOrItem })
    } else {
      this.patchState({ gatherableId: idOrItem?.GatherableID })
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
