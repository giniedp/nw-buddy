import { Dialog } from '@angular/cdk/dialog'
import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Injector, Input, Output } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { combineLatest, filter, map } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { DataViewModule, DataViewPicker } from '~/ui/data/data-view'
import { GsSliderComponent } from '~/ui/gs-input'
import { IconsModule } from '~/ui/icons'
import { svgInfoCircle } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { GameModeTableAdapter } from '../data/game-mode-table'
import { TerritoryTableAdapter } from '../data/territory-table'
import { VitalTableAdapter } from '../data/vital-table'
import { ZoneTableAdapter } from '../data/zone-table'
import { LootContextEditorStore } from './loot-context-editor.store'

@Component({
  standalone: true,
  selector: 'nwb-loot-context-editor',
  exportAs: 'contextEditor',
  templateUrl: './loot-context-editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    FormsModule,
    DataViewModule,
    TooltipModule,
    GsSliderComponent,
    OverlayModule,
    IconsModule,
  ],
  providers: [LootContextEditorStore],
  host: {
    class: 'block',
  },
})
export class LootContextEditorComponent {
  @Input()
  public size: 'sm' | 'xs' | 'md' = 'md'

  @Input()
  public set vitalId(value: string) {
    this.store.patchState({ vitalId: value })
  }

  @Input()
  public set territoryId(value: number) {
    this.store.patchState({ territoryId: value })
  }

  @Input()
  public set poiId(value: number) {
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

  protected get isSm() {
    return this.size === 'sm'
  }

  protected get isXs() {
    return this.size === 'xs'
  }
  protected iconInfo = svgInfoCircle
  protected isEditingEnemyLevel = false
  protected isEditingPoiLevel = false
  protected trackByIndex = (i: number) => i
  protected vm$ = combineLatest({
    enemyLevel: this.store.enemyLevel$,
    playerLevel: this.store.playerLevel$,
    minContLevel: this.store.minContLevel$,
    minPoiLevel: this.store.minPoiLevel$,

    vital: this.store.vital$,
    territory: this.store.territory$,
    poi: this.store.poi$,

    gameMode: this.store.gameMode$,
    mutaDifficulty: this.store.mutaDifficulty$,
    mutaElement: this.store.mutaElement$,
    isMutation: this.store.isMutation$,
    isMutable: this.store.isMutable$,
  })

  public constructor(
    protected store: LootContextEditorStore,
    private dialog: Dialog,
    private injector: Injector,
    private db: NwDbService,
  ) {
    this.store.loadEnemyLevelAndGameMode()
    this.store.loadMinPoiLevel()
    this.store.loadContentLevel()
  }

  protected setTerritory(selection: number) {
    this.store.patchState({ territoryId: selection })
  }

  protected setPoi(selection: number) {
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

  public pickVital() {
    DataViewPicker.open(this.dialog, {
      title: 'Pick Vital',
      dataView: { adapter: VitalTableAdapter },
      config: {
        maxWidth: 1024,
        maxHeight: 1024,
        panelClass: ['w-full', 'h-full', 'p-4'],
        injector: this.injector,
      },
    })
      .closed.pipe(filter((it) => it !== undefined))
      .pipe(map((it) => it?.[0] as string))
      .subscribe((it) => {
        this.store.patchState({ vitalId: it })
      })
  }

  public pickPoi() {
    DataViewPicker.open(this.dialog, {
      title: 'Pick POI',
      dataView: { adapter: ZoneTableAdapter },
      config: {
        maxWidth: 1024,
        maxHeight: 1024,
        panelClass: ['w-full', 'h-full', 'p-4'],
        injector: this.injector,
      },
    })
      .closed.pipe(filter((it) => it !== undefined))
      .pipe(map((it) => it?.[0] as number))
      .subscribe((it) => {
        this.store.patchState({ poiId: it })
      })
  }

  public pickGameMode() {
    DataViewPicker.open(this.dialog, {
      title: 'Pick Game Mode',
      dataView: { adapter: GameModeTableAdapter },
      config: {
        maxWidth: 1024,
        maxHeight: 1024,
        panelClass: ['w-full', 'h-full', 'p-4'],
        injector: this.injector,
      },
    })
      .closed.pipe(filter((it) => it !== undefined))
      .pipe(map((it) => it?.[0] as string))
      .subscribe((it) => {
        this.store.patchState({ gameModeId: it })
      })
  }

  public pickTerritory() {
    DataViewPicker.open(this.dialog, {
      title: 'Pick Territory',
      dataView: { adapter: TerritoryTableAdapter },
      config: {
        maxWidth: 1024,
        maxHeight: 1024,
        panelClass: ['w-full', 'h-full', 'p-4'],
        injector: this.injector,
      },
    })
      .closed.pipe(filter((it) => it !== undefined))
      .pipe(map((it) => it?.[0] as number))
      .subscribe((it) => {
        this.store.patchState({ territoryId: it })
      })
  }
}
