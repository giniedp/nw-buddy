import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Injector, Input, Output, computed, inject } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { getState, patchState } from '@ngrx/signals'
import {
  NW_FALLBACK_ICON,
  NW_MAX_CHARACTER_LEVEL,
  NW_MAX_ENEMY_LEVEL,
  getVitalFamilyInfo,
  getZoneIcon,
  getZoneName,
} from '@nw-data/common'
import { filter, map } from 'rxjs'
import { NwModule } from '~/nw'
import { LootContext } from '~/nw/loot'
import { DataViewModule, DataViewPicker } from '~/ui/data/data-view'
import { IconsModule } from '~/ui/icons'
import { svgInfo } from '~/ui/icons/svg'
import { InputSliderComponent } from '~/ui/input-slider'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { GameModeTableAdapter } from '../data/game-mode-table'
import { TerritoryTableAdapter } from '../data/territory-table'
import { VitalTableAdapter } from '../data/vital-table'
import { ZoneTableAdapter } from '../data/zone-table'
import { LootContextEditorState, LootContextEditorStore } from './loot-context-editor.store'
import { LootTagComponent } from './loot-tag.component'

@Component({
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
    OverlayModule,
    IconsModule,
    InputSliderComponent,
    LayoutModule,
    LootTagComponent,
  ],
  providers: [LootContextEditorStore],
  host: {
    class: 'block',
  },
})
export class LootContextEditorComponent {
  protected store = inject(LootContextEditorStore)
  private injector = inject(Injector)

  @Output()
  public stateChange = toObservable(
    computed(() => {
      const state = getState(this.store)
      return {
        playerLevel: state.playerLevel,
        contLevel: state.contLevel,
        poiLevel: state.poiLevel,
        enemyLevel: state.enemyLevel,
        vitalId: state.vitalId,
        vitalLevel: state.vitalLevel,

        salvageItemGearScore: state.salvageItemGearScore,
        salvageItemRarity: state.salvageItemRarity,
        salvageItemTier: state.salvageItemTier,

        territoryId: state.territoryId,
        poiId: state.poiId,
        gameModeId: state.gameModeId,
        mutaDifficultyId: state.mutaDifficultyId,
        mutaElementTypeId: state.mutaElementTypeId,

        customTags: state.customTags,
      }
    }),
  )

  @Input()
  public set vitalId(value: string) {
    patchState(this.store, { vitalId: value })
  }
  public get vitalId() {
    return this.store.vitalId()
  }
  public get vital() {
    return this.store.vital()
  }
  public get vitalName() {
    return this.store.vital()?.DisplayName
  }
  public get vitalIcon() {
    return getVitalFamilyInfo(this.store.vital())?.Icon
  }
  public get vitalTags() {
    return this.store.vitalTags()
  }

  @Input()
  public set territoryId(value: number) {
    patchState(this.store, { territoryId: value })
  }
  public get territoryId() {
    return this.store.territoryId()
  }
  public get territory() {
    return this.store.territory()
  }
  public get territoryName() {
    return getZoneName(this.store.territory())
  }
  public get territoryIcon() {
    return getZoneIcon(this.store.territory())
  }
  public get territoryTags() {
    return this.store.territoryTags()
  }

  @Input()
  public set poiId(value: number) {
    patchState(this.store, { poiId: value })
  }
  public get poiId() {
    return this.store.poiId()
  }
  public get poi() {
    return this.store.poi()
  }
  public get poiName() {
    return getZoneName(this.store.poi())
  }
  public get poiIcon() {
    return getZoneIcon(this.store.poi())
  }
  public get poiTags() {
    return this.store.poiTags()
  }

  @Input()
  public set gameModeId(value: string) {
    patchState(this.store, { gameModeId: value })
  }
  public get gameModeId() {
    return this.store.gameModeId()
  }
  public get gameMode() {
    return this.store.gameMode()
  }
  public get gameModeName() {
    return this.store.gameMode()?.DisplayName
  }
  public get gameModeIcon() {
    return this.store.gameMode()?.IconPath || NW_FALLBACK_ICON
  }
  public get gameModeIsMutable() {
    return this.store.gameModeIsMutable()
  }
  public get gameModeTags() {
    return this.store.gameModeTags()
  }

  @Input()
  public set mutaDifficultyId(value: number | string) {
    patchState(this.store, { mutaDifficultyId: Number(value) })
  }
  public get mutaDifficultyId() {
    return this.store.mutaDifficultyId()
  }
  public mutaDifficultyOptions = computed(() => {
    const items = this.store.nwData()?.mutaDifficulties || []
    return items.map((it) => {
      return {
        value: it.MutationDifficulty,
        label: `M${it.MutationDifficulty}`,
      }
    })
  })

  @Input()
  public set mutaElementTypeId(value: string) {
    patchState(this.store, { mutaElementTypeId: value })
  }
  public get mutaElementTypeId() {
    return this.store.mutaElementTypeId()
  }
  public mutaElementTypeOptions = computed(() => {
    const elements = this.store.nwData()?.mutaElements || []
    return elements.map((it) => {
      return {
        value: it.ElementalMutationTypeId,
        label: it.InjectedLootTags,
      }
    })
  })

  @Input()
  public set playerLevel(value: number) {
    patchState(this.store, { playerLevel: value - 1 || 0 })
  }
  public get playerLevel() {
    return (this.store.playerLevel() || 0) + 1
  }

  @Input()
  public set contLevel(value: number) {
    patchState(this.store, { contLevel: value - 1 || 0 })
  }
  public get contLevel() {
    return (this.store.contLevel() || 0) + 1
  }

  @Input()
  public set poiLevel(value: number) {
    patchState(this.store, { poiLevel: value - 1 || 0 })
  }
  public get poiLevel() {
    return (this.store.poiLevel() || 0) + 1
  }

  @Input()
  public set vitalLevel(value: number) {
    patchState(this.store, { enemyLevel: value - 1 || 0 })
  }
  public get vitalLevel() {
    return (this.store.enemyLevel() || 0) + 1
  }

  @Output()
  public context = toObservable(
    computed((): LootContext => {
      return new LootContext({
        tags: this.store.contextTags(),
        values: this.store.contextValues(),
      })
    }),
  )

  public tags = toObservable(this.store.tags)

  @Output()
  public contextTags = toObservable(this.store.contextTags)

  @Output()
  public contextTagValues = toObservable(this.store.contextValues)

  protected iconInfo = svgInfo

  protected playerLevelMin = 1
  protected playerLevelMax = NW_MAX_CHARACTER_LEVEL

  protected enemyLevelMin = 1
  protected enemyLevelMax = NW_MAX_ENEMY_LEVEL

  protected contentLevelMin = 1
  protected contentLevelMax = NW_MAX_ENEMY_LEVEL

  protected poiLevelMin = 1
  protected poiLevelMax = NW_MAX_ENEMY_LEVEL

  protected mutaDifficultyMin = 0
  protected mutaDifficultyMax = 3

  public constructor() {
    this.store.loadNwData()
    this.playerLevel = NW_MAX_CHARACTER_LEVEL
  }

  protected setTerritory(selection: number) {
    this.territoryId = selection
  }

  protected setPoi(selection: number) {
    this.poiId = selection
  }

  protected setGameMode(selection: string) {
    this.gameModeId = selection
  }

  protected setMutaDifficulty(selection: number) {
    this.mutaDifficultyId = selection
  }

  protected setMutaElement(selection: string) {
    this.mutaElementTypeId = selection
  }

  public pickVital() {
    DataViewPicker.from({
      injector: this.injector,
      title: 'Pick Vital',
      dataView: { adapter: VitalTableAdapter },
    })
      .pipe(
        filter((it) => it !== undefined),
        map((it) => it?.[0] as string),
        map((id) => this.store.nwData().vitalsMap.get(id)),
      )
      .subscribe((vital) => {
        this.vitalId = vital?.VitalsID
        this.vitalLevel = vital?.Level
        this.poiLevel = vital?.Level
      })
  }

  public pickTerritory() {
    DataViewPicker.from({
      injector: this.injector,
      title: 'Pick Territory',
      dataView: { adapter: TerritoryTableAdapter },
    })
      .pipe(
        filter((it) => it !== undefined),
        map((it) => it?.[0] as number),
        map((it) => this.store.nwData().territoriesMap.get(it)),
      )
      .subscribe((territory) => {
        this.territoryId = territory?.TerritoryID
        this.contLevel = territory?.RecommendedLevel
      })
  }

  public pickPoi() {
    DataViewPicker.from({
      injector: this.injector,
      title: 'Pick POI',
      dataView: { adapter: ZoneTableAdapter },
    })
      .pipe(
        filter((it) => it !== undefined),
        map((it) => Number(it?.[0])),
        map((id) => this.store.nwData().territoriesMap.get(id)),
      )
      .subscribe((poi) => {
        this.poiId = poi?.TerritoryID
      })
  }

  public pickGameMode() {
    DataViewPicker.from({
      injector: this.injector,
      title: 'Pick Game Mode',
      dataView: { adapter: GameModeTableAdapter },
    })
      .pipe(filter((it) => it !== undefined))
      .pipe(map((it) => it?.[0] as string))
      .subscribe((it) => {
        patchState(this.store, { gameModeId: it })
      })
  }

  public addTag(tag: string) {
    this.store.addTag(tag)
  }

  public removeTag(tag: string) {
    this.store.removeTag(tag)
  }

  public resetState() {
    this.store.reset()
  }

  public restoreState(state: Partial<LootContextEditorState>) {
    this.store.restore(state)
  }
}
