import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, Output } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { combineLatest, map } from 'rxjs'
import { NwModule } from '~/nw'
import { LootContextEditorStore } from './loot-context-editor.store'

@Component({
  standalone: true,
  selector: 'nwb-loot-context-editor',
  exportAs: 'contextEditor',
  templateUrl: './loot-context-editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule],
  providers: [LootContextEditorStore],
  host: {
    class: 'layout-content',
  },
})
export class LootContextEditorComponent {
  @Input()
  public set vitalId(value: string) {
    this.store.patchState({ vitalId: value })
  }

  @Input()
  public set territoryId(value: string) {
    this.store.patchState({ territoryId: value })
  }

  @Input()
  public set poiId(value: string) {
    this.store.patchState({ poiId: value })
  }

  @Input()
  public set gameMode(value: string) {
    this.store.patchState({ gameModeId: value })
  }

  @Input()
  public set mitation(value: boolean) {
    this.store.patchState({ isMutation: value })
  }

  @Output()
  public context = this.store.context$

  @Output()
  public contextTags = this.store.context$.pipe(map((it) => it.tags))

  @Output()
  public contextTagValues = this.store.context$.pipe(map((it) => it.values))

  @Output()
  public vitalDropChance = this.store.vital$.pipe(
    map((it) => {
      if (!it) {
        return 1
      }
      return (Number(it.LootDropChance) || 0) / 100
    })
  )

  protected trackByIndex = (i: number) => i
  protected vm$ = combineLatest({
    vital: this.store.vital$,
    territory: this.store.territory$,
    poi: this.store.poi$,
    gameMode: this.store.gameMode$,
    mutaDifficulty: this.store.mutaDifficulty$,
    mutaElement: this.store.mutaElement$,
    isMutation: this.store.isMutation$,
    isMutable: this.store.isMutable$,
    playerLevel: this.store.playerLevel$,
    contentLevel: this.store.contentLevel$,
  })

  public constructor(protected store: LootContextEditorStore) {
    //
  }

  protected setTerritory(selection: string) {
    this.store.patchState({ territoryId: selection })
  }

  protected setPoi(selection: string) {
    this.store.patchState({ poiId: selection })
  }

  protected setGameMode(selection: string) {
    this.store.patchState({ gameModeId: selection })
  }

  protected setMutaDifficulty(selection: string) {
    this.store.patchState({ mutaDifficulty: selection })
  }

  protected setMutaElement(selection: string) {
    this.store.patchState({ mutaElement: selection })
  }

  protected setMutation(selection: boolean) {
    this.store.patchState({ isMutation: selection })
  }
}
