import { Injectable, inject } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { LoreData } from '@nw-data/generated'
import { map } from 'rxjs'
import { NwDataService } from '~/data'
import { eqCaseInsensitive, selectStream } from '~/utils'

@Injectable()
export class LoreDetailStore extends ComponentStore<{ recordId: string }> {
  protected db = inject(NwDataService)

  public readonly recordId$ = this.select(({ recordId }) => recordId)
  public readonly record$ = selectStream(this.db.loreItem(this.recordId$))

  public readonly parentId$ = this.select(this.record$, (it) => it?.ParentID)
  public readonly parent$ = selectStream(this.db.loreItem(this.parentId$))
  public readonly parentTitle$ = selectStream(this.parent$, (it) => it?.Title)

  public readonly grandParentId$ = this.select(this.parent$, (it) => it?.ParentID)
  public readonly grandParent$ = selectStream(this.db.loreItem(this.grandParentId$))
  public readonly grandParentTitle$ = selectStream(this.grandParent$, (it) => it?.Title)

  public readonly title$ = selectStream(this.record$, (it) => it?.Title)
  public readonly subtitle$ = selectStream(this.record$, (it) => it?.Subtitle)
  public readonly body$ = selectStream(this.record$, (it) => it?.Body)
  public readonly type$ = selectStream(this.record$, (it) => it?.Type)
  public readonly isTopic$ = selectStream(this.type$, (it) => eqCaseInsensitive(it, 'Topic'))
  public readonly isChapter$ = selectStream(this.type$, (it) => eqCaseInsensitive(it, 'Chapter'))
  public readonly isPage$ = selectStream(this.type$, (it) => eqCaseInsensitive(it, 'Default'))
  public readonly order$ = selectStream(this.record$, (it) => it?.Order)

  public readonly siblings$ = selectStream(this.db.loreItemsByParentId(this.parentId$), (it) => (it || []).sort((a, b) => a.Order - b.Order))
  public readonly children$ = selectStream(this.db.loreItemsByParentId(this.recordId$), (it) => (it || []).sort((a, b) => a.Order - b.Order))
  public readonly pageCount$ = selectStream(this.siblings$, (it) => it?.length)
  public readonly pageNumber$ = selectStream({
    siblings: this.siblings$,
    record: this.record$,
  }, ({ siblings, record }) => {
    if (!siblings?.length || !record) {
      return null
    }
    return siblings.findIndex((it) => eqCaseInsensitive(it.LoreID, record.LoreID)) + 1
  })
  public readonly nextId$ = selectStream({
    siblings: this.siblings$,
    record: this.record$,
  }, ({ siblings, record }) => {
    if (!siblings?.length || !record) {
      return null
    }
    const index = siblings.findIndex((it) => eqCaseInsensitive(it.LoreID, record.LoreID))
    return siblings[index + 1]?.LoreID
  })
  public readonly prevId$ = selectStream({
    siblings: this.siblings$,
    record: this.record$,
  }, ({ siblings, record }) => {
    if (!siblings?.length || !record) {
      return null
    }
    const index = siblings.findIndex((it) => eqCaseInsensitive(it.LoreID, record.LoreID))
    return siblings[index - 1]?.LoreID
  })

  public readonly image$ = selectStream(this.record$, (it) => it?.ImagePath)

  public constructor() {
    super({ recordId: null })
  }

  public load = this.effect<string | LoreData>((input$) => {
    return input$.pipe(map((idOrItem) => {
      if (typeof idOrItem === 'string') {
        this.patchState({ recordId: idOrItem })
      } else {
        this.patchState({ recordId: idOrItem?.LoreID })
      }
    }))
  })
}
