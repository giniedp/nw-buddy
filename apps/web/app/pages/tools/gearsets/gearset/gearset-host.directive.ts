import { Directive, EventEmitter, Input, OnInit, Output, inject } from '@angular/core'
import { patchState, signalState } from '@ngrx/signals'
import { CharacterStore, GearsetRecord, GearsetStore } from '~/data'
import { NwTextContextService } from '~/nw/expression'
import { Mannequin } from '~/nw/mannequin'

export type GearsetMode = 'player' | 'opponent'
interface GearsetHostState {
  mode: GearsetMode
  opponent: GearsetRecord
}

@Directive({
  selector: '[nwbGearsetHost]',
  standalone: true,
  providers: [GearsetStore, Mannequin, NwTextContextService],
  exportAs: 'gearsetHost',
})
export class GearsetHostDirective {
  @Input()
  public set mode(value: GearsetMode) {
    patchState(this.state, { mode: value })
  }
  public get mode() {
    return this.state.mode()
  }

  @Input()
  public set gearset(value: GearsetRecord) {
    patchState(this.store, { gearset: value })
  }
  public get gearset() {
    return this.store.gearset()
  }

  @Input()
  public set opponent(value: GearsetRecord) {
    patchState(this.state, { opponent: value })
  }
  public get opponent() {
    return this.state.opponent()
  }

  public get showCalculator() {
    return this.store.showCalculator() || !!this.opponent
  }

  private state = signalState<GearsetHostState>({
    mode: 'player',
    opponent: null,
  })

  private store = inject(GearsetStore)
  private character = inject(CharacterStore)
  public readonly mannequin = inject(Mannequin)

  public constructor() {
    this.store.connectLevel(this.character.level$)
    this.store.connectToMannequin(this.mannequin)
  }
}
