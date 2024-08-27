import { Component, Injector, computed, effect, inject, input, output, signal, untracked } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { NW_MAX_ENEMY_LEVEL } from '@nw-data/common'
import { Point } from 'geojson'
import { MapGeoJSONFeature } from 'maplibre-gl'
import { debounceTime, filter, map } from 'rxjs'
import { NwModule } from '~/nw'
import { DataViewPicker } from '~/ui/data/data-view'
import { ExpressionTreeModule } from '~/ui/expression-tree'
import { TreeNodeComponent, TreeNodeToggleComponent } from '~/ui/tree'
import { GameMapLayerDirective, GameMapPopupComponent } from '~/widgets/game-map'
import {
  ExpressionBranchKeyDirective,
  ExpressionBranchValueDirective,
  ExpresssionBranchEditorComponent,
} from '../../../../ui/expression-branch/expresssion-branch-input.component'
import { VitalDetailModule } from '../../vital-detail'
import { VitalTableAdapter } from '../../vital-table'
import { VitalDataProperties, VitalDataSet } from './data/types'
import { FilterVitalsStore } from './filter-vitals.store'
import { CreatureCategoryPickerAdapter } from './picker/creature-category-picker.adapter'
import { CreatureTypePickerAdapter } from './picker/creature-type-picker.adapter'
import { LootTagPickerAdapter } from './picker/loot-tag-picker.adapter'
import { PoiTagPickerAdapter } from './picker/poi-tag-picker.adapter'
import { ZoneMapStore } from './zone-map.store'

@Component({
  standalone: true,
  selector: 'nwb-map-filter-vitals',
  templateUrl: './filter-vitals.component.html',
  host: {
    class: 'h-full flex flex-col',
  },
  providers: [FilterVitalsStore],
  imports: [
    ExpressionBranchKeyDirective,
    ExpressionBranchValueDirective,
    ExpressionTreeModule,
    ExpresssionBranchEditorComponent,
    FormsModule,
    GameMapLayerDirective,
    GameMapPopupComponent,
    NwModule,
    TreeNodeComponent,
    TreeNodeToggleComponent,
    VitalDetailModule,
  ],
})
export class MapFilterVitalsComponent {
  private injector = inject(Injector)
  protected mapStore = inject(ZoneMapStore)
  protected store = inject(FilterVitalsStore)
  public data = input.required<VitalDataSet>()
  public featureHover = output<VitalDataProperties[]>()
  protected popupPosition = signal<[number, number]>(null)
  protected hoverItems = signal<
    Array<{
      position: [number, number]
      data: VitalDataProperties
    }>
  >(null)

  protected lvlMin = signal(1)
  protected lvlMax = signal(NW_MAX_ENEMY_LEVEL)
  protected lvlMinDebounced = toSignal(toObservable(this.lvlMin).pipe(debounceTime(500)))
  protected lvlMaxDebounced = toSignal(toObservable(this.lvlMax).pipe(debounceTime(500)))
  protected creatureTypes = computed(() => {
    return this.mapStore
      .vitalsTypes()
      .sort()
      .map((it) => {
        return {
          value: it,
          label: it,
        }
      })
  })

  protected categories = computed(() => {
    const result = this.mapStore.vitalsCategories().map((it) => it.toLowerCase())
    result.length = 100
    return result
  })

  protected mapId = this.mapStore.mapId
  protected layerData = computed(() => {
    const data = this.data()
    return data.data[this.mapId()]?.geometry
  })

  public constructor() {
    effect(() => {
      const hideRandom = !this.mapStore.showRandomEncounter()
      const hideDarkness = !this.mapStore.showDarknessEncounter()
      const hideGoblin = !this.mapStore.showGoblinEncounter()
      untracked(() => {
        this.store.setHideRandomEncounters(hideRandom)
        this.store.setHideDarknessEncounters(hideDarkness)
        this.store.setHideGoblinEncounters(hideGoblin)
      })
    })
  }

  protected pickVitalId(input: ExpresssionBranchEditorComponent, index: number, value: string) {
    DataViewPicker.from({
      injector: this.injector,
      title: 'Select Vital',
      dataView: { adapter: VitalTableAdapter },
      selection: value ? [value] : null,
    })
      .pipe(
        filter((it) => it !== undefined),
        map((it) => it?.[0] as string),
      )
      .subscribe((value) => {
        if (value) {
          input.updateRow(index, { right: value.toLowerCase() })
        } else {
          input.removeRow(index)
        }
      })
  }

  protected pickVitalType(input: ExpresssionBranchEditorComponent, index: number, value: string) {
    DataViewPicker.from({
      dataView: {
        adapter: CreatureTypePickerAdapter,
      },
      injector: this.injector,
      title: 'Select Type',
      selection: value ? [value] : null,
      cssClassModal: 'ion-modal-full md:ion-modal-x-md',
    })
      .pipe(
        filter((it) => it !== undefined),
        map((it) => it?.[0] as string),
      )
      .subscribe((value) => {
        if (value) {
          input.updateRow(index, { right: value.toLowerCase() })
        } else {
          input.removeRow(index)
        }
      })
  }

  protected pickVitalCategory(input: ExpresssionBranchEditorComponent, index: number, value: string) {
    DataViewPicker.from({
      dataView: {
        adapter: CreatureCategoryPickerAdapter,
      },
      injector: this.injector,
      title: 'Select Category',
      selection: value ? [value] : null,
    })
      .pipe(
        filter((it) => it !== undefined),
        map((it) => it?.[0] as string),
      )
      .subscribe((value) => {
        if (value) {
          input.updateRow(index, { right: value.toLowerCase() })
        } else {
          input.removeRow(index)
        }
      })
  }

  protected pickVitalLootTag(input: ExpresssionBranchEditorComponent, index: number, value: string) {
    DataViewPicker.from({
      dataView: {
        adapter: LootTagPickerAdapter,
      },
      injector: this.injector,
      title: 'Select Loot Tag',
      selection: value ? [value] : null,
    })
      .pipe(
        filter((it) => it !== undefined),
        map((it) => it?.[0] as string),
      )
      .subscribe((value) => {
        if (value) {
          input.updateRow(index, { right: value.toLowerCase() })
        } else {
          input.removeRow(index)
        }
      })
  }

  protected pickVitalPoiTag(input: ExpresssionBranchEditorComponent, index: number, value: string) {
    DataViewPicker.from({
      dataView: {
        adapter: PoiTagPickerAdapter,
      },
      injector: this.injector,
      title: 'Select POI Tag',
      selection: value ? [value] : null,
    })
      .pipe(
        filter((it) => it !== undefined),
        map((it) => it?.[0] as string),
      )
      .subscribe((value) => {
        if (value) {
          input.updateRow(index, { right: value.toLowerCase() })
        } else {
          input.removeRow(index)
        }
      })
  }

  protected handleMouseEnter(features: MapGeoJSONFeature[]) {
    const items = features.map((it) => it.properties as VitalDataProperties)
    this.featureHover.emit(items)

    this.hoverItems.set(
      features.map((it) => {
        const point = (it.geometry as any as Point)?.coordinates
        const props = it.properties as VitalDataProperties
        return { position: [point[0], point[1]], data: props }
      }),
    )
  }

  protected handleMouseMove(features: MapGeoJSONFeature[]) {
    const items = features.map((it) => it.properties as VitalDataProperties)
    this.featureHover.emit(items)

    this.hoverItems.set(
      features.map((it) => {
        const point = (it.geometry as any as Point)?.coordinates
        const props = it.properties as VitalDataProperties
        return { position: [point[0], point[1]], data: props }
      }),
    )
  }

  protected handleMouseLeave(features: MapGeoJSONFeature[]) {
    this.featureHover.emit(null)
    this.hoverItems.set(null)
  }
}
