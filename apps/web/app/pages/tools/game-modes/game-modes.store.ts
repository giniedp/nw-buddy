import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { Gamemodes } from '@nw-data/generated'

export interface GameModesState {
  all: Gamemodes[]
  selected: Gamemodes[]
}

@Injectable()
export class GameModesStore extends ComponentStore<GameModesState> {
  public readonly all$ = this.select(({ all }) => all)
  public readonly selected$ = this.select(({ selected }) => selected)
}
