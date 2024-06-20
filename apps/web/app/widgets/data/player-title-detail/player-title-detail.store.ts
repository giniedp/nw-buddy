import { Injectable, inject } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { PlayerTitleData } from '@nw-data/generated'
import { NwDataService } from '~/data'
import { rejectKeys, selectStream } from '~/utils'

@Injectable()
export class PlayerTitleDetailStore extends ComponentStore<{ titleId: string }> {
  protected db = inject(NwDataService)

  public readonly titleId$ = this.select(({ titleId }) => titleId)
  public readonly titleRecord$ = selectStream(this.db.playerTitle(this.titleId$))
  public readonly icon$ = ''
  public readonly type$ = this.select(this.titleRecord$, (it) => it?.TitleType)
  public readonly title$ = this.select(this.titleRecord$, (it) => it?.TitleMale)
  public readonly titleFemale$ = this.select(this.titleRecord$, (it) => it?.TitleFemale)
  public readonly titleNeutral$ = this.select(this.titleRecord$, (it) => it?.TitleNeutral)
  public readonly description$ = this.select(this.titleRecord$, (it) => it?.Description)

  public readonly properties$ = this.select(this.titleRecord$, selectProperties)

  public constructor() {
    super({ titleId: null })
  }

  public load(idOrItem: string | PlayerTitleData) {
    if (typeof idOrItem === 'string') {
      this.patchState({ titleId: idOrItem })
    } else {
      this.patchState({ titleId: idOrItem?.TitleID })
    }
  }
}

function selectProperties(item: PlayerTitleData) {
  const reject: Array<keyof PlayerTitleData> = ['TitleMale', 'TitleFemale', 'TitleNeutral', 'Description', 'TitleType']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key))
}
