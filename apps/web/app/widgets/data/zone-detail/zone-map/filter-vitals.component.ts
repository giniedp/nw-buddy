import { Component, Injector, TemplateRef, computed, inject, input, signal, viewChild } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { NW_MAX_ENEMY_LEVEL } from '@nw-data/common'
import { uniqBy } from 'lodash'
import { debounceTime, filter, map } from 'rxjs'
import { NwModule } from '~/nw'
import { DataViewPicker } from '~/ui/data/data-view'
import { ExpressionTreeModule } from '~/ui/expression-tree'
import { ModalService } from '~/ui/layout'
import { GameMapHost, GameMapLayerDirective, GameMapMouseTipDirective } from '~/widgets/game-map'
import {
  ExpressionBranchKeyDirective,
  ExpressionBranchValueDirective,
  ExpresssionBranchEditorComponent,
} from '../../../../ui/expression-branch/expresssion-branch-input.component'
import { VitalDetailModule } from '../../vital-detail'
import { VitalTableAdapter } from '../../vital-table'
import { VitalDataSet, VitalsFeature } from './data/types'
import { FilterVitalsStore } from './filter-vitals.store'
import { CreatureCategoryPickerAdapter } from './picker/creature-category-picker.adapter'
import { CreatureTypePickerAdapter } from './picker/creature-type-picker.adapter'
import { LootTagPickerAdapter } from './picker/loot-tag-picker.adapter'
import { PoiTagPickerAdapter } from './picker/poi-tag-picker.adapter'
import { ZoneMapStore } from './zone-map.store'

@Component({
  selector: 'nwb-map-filter-vitals',
  templateUrl: './filter-vitals.component.html',
  host: {
    class: 'block',
  },
  providers: [FilterVitalsStore],
  imports: [
    ExpressionBranchKeyDirective,
    ExpressionBranchValueDirective,
    ExpressionTreeModule,
    ExpresssionBranchEditorComponent,
    FormsModule,
    GameMapLayerDirective,
    GameMapMouseTipDirective,
    NwModule,
    VitalDetailModule,
    RouterModule,
  ],
})
export class MapFilterVitalsComponent {
  private injector = inject(Injector)
  private mapHost = inject(GameMapHost)
  private modal = inject(ModalService)

  protected mapStore = inject(ZoneMapStore)
  protected store = inject(FilterVitalsStore)
  public data = input.required<VitalDataSet>()

  protected popupPosition = signal<[number, number]>(null)
  protected hoverItems = signal<Array<{ id: string; level: number }>>(null)
  protected clickItems = signal<Array<{ id: string; level: number }>>(null)
  protected clickModal = viewChild('clickModal', { read: TemplateRef })

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
    return data.data[this.mapId()]?.data
  })

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

  protected handleMouseClick(features: VitalsFeature[]) {
    const items = uniqBy(
      features.map((it) => {
        return {
          id: it.properties.id,
          level: it.properties.level,
        }
      }),
      (it) => `${it.id}-${it.level}`,
    )
    this.clickItems.set(items)
    this.modal.open({
      content: this.clickModal(),
      size: ['x-sm', 'y-auto'],
    })
  }

  protected handleMouseEnter(features: VitalsFeature[]) {
    this.mapHost.map.getCanvas().style.cursor = 'pointer'
    const items = uniqBy(
      features.map((it) => {
        return {
          id: it.properties.id,
          level: it.properties.level,
        }
      }),
      (it) => `${it.id}-${it.level}`,
    )
    this.hoverItems.set(items)
  }

  protected handleMouseMove(features: VitalsFeature[]) {
    const items = uniqBy(
      features.map((it) => {
        return {
          id: it.properties.id,
          level: it.properties.level,
        }
      }),
      (it) => `${it.id}-${it.level}`,
    )
    this.hoverItems.set(items)
  }

  protected handleMouseLeave(features: VitalsFeature[]) {
    this.mapHost.map.getCanvas().style.cursor = ''
    this.hoverItems.set(null)
  }
}
