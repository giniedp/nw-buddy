import { Injectable, Output, inject } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { Cursemutations, Mounts } from '@nw-data/generated'
import { NwDataService } from '~/data'
import { ModelViewerService } from '~/widgets/model-viewer'

@Injectable()
export class MutaCurseDetailStore extends ComponentStore<{ curseId: string; wildcard: string }> {
  public readonly curseId$ = this.select(({ curseId }) => curseId)
  public readonly curse$ = this.select(this.db.mutatorCurse(this.curseId$), (it) => it)
  public readonly wildcard$ = this.select(({ wildcard }) => wildcard)

  public readonly icon$ = this.select(this.curse$, (it) => it?.IconPath || NW_FALLBACK_ICON)
  public readonly name$ = this.select(this.curse$, (it) => it?.Name)
  public readonly cursoMinorId$ = this.select(this.curse$, this.wildcard$, (it, wc) =>
    it?.CurseMinor?.replace('_Wildcard_', `_${wc}_`)
  )
  public readonly curseMajorId$ = this.select(this.curse$, this.wildcard$, (it, wc) =>
    it?.CurseMajor?.replace('_Wildcard_', `_${wc}_`)
  )

  public readonly curses$ = this.select(
    this.db.statusEffect(this.cursoMinorId$),
    this.db.statusEffect(this.curseMajorId$),
    (minor, major) => [minor, major].filter((it) => !!it)
  )

  public constructor(private db: NwDataService) {
    super({ curseId: null, wildcard: null })
  }

  public load(idOrItem: string | Cursemutations) {
    if (typeof idOrItem === 'string') {
      this.patchState({ curseId: idOrItem })
    } else {
      this.patchState({ curseId: idOrItem?.CurseMutationId })
    }
  }
}
