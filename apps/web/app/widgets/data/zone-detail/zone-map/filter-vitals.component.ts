import {
  Component,
  Injector,
  TemplateRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { NW_MAX_ENEMY_LEVEL } from '@nw-data/common'
import { groupBy, sortBy, uniqBy } from 'lodash'
import { filter, map } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwModule } from '~/nw'
import { DataViewPicker } from '~/ui/data/data-view'
import { ExpressionTreeModule } from '~/ui/expression-tree'
import { IconsModule } from '~/ui/icons'
import { svgChevronRight } from '~/ui/icons/svg'
import { ModalService } from '~/ui/layout'
import { humanize } from '~/utils'
import { GameMapHost, GameMapLayerDirective, GameMapMouseTipDirective } from '~/widgets/game-map'
import {
  ExpressionBranchKeyDirective,
  ExpressionBranchValueDirective,
  ExpresssionBranchEditorComponent,
} from '../../../../ui/expression-branch/expresssion-branch-input.component'
import { VitalDetailModule } from '../../vital-detail'
import { VitalCreature, VitalDataSet, VitalsFeature } from './data/types'
import { MapFilterStatusComponent } from './filter-status.component'
import { encounterLabel, ExpressionKey, FilterVitalsStore, PresetRecord } from './filter-vitals.store'
import { CreatureCategoryPickerAdapter } from './picker/creature-category-picker.adapter'
import { CreatureTypePickerAdapter } from './picker/creature-type-picker.adapter'
import { LootTagPickerAdapter } from './picker/loot-tag-picker.adapter'
import { PoiTagPickerAdapter } from './picker/poi-tag-picker.adapter'
import { formatCount } from './utils/format-count'
import { ZoneMapStore } from './zone-map.store'

interface CreatureRow extends VitalCreature {
  label: string
  selected: boolean
}

interface CreatureGroup {
  type: string
  label: string
  count: number
  selected: number
  creatures: CreatureRow[]
}

const ADVANCED_KEYS: ExpressionKey[] = [
  'typeExpression',
  'categoriesExpression',
  'lootTagsExpression',
  'poiTagsExpression',
]

@Component({
  selector: 'nwb-map-filter-vitals',
  templateUrl: './filter-vitals.component.html',
  host: {
    class: 'flex flex-col min-h-full',
  },
  imports: [
    ExpressionBranchKeyDirective,
    ExpressionBranchValueDirective,
    ExpressionTreeModule,
    ExpresssionBranchEditorComponent,
    FormsModule,
    GameMapLayerDirective,
    GameMapMouseTipDirective,
    IconsModule,
    MapFilterStatusComponent,
    NwModule,
    VitalDetailModule,
    RouterModule,
  ],
})
export class MapFilterVitalsComponent {
  private injector = inject(Injector)
  private mapHost = inject(GameMapHost)
  private modal = inject(ModalService)
  private tl8 = inject(TranslateService)

  protected mapStore = inject(ZoneMapStore)
  protected store = inject(FilterVitalsStore)
  public data = input.required<VitalDataSet>()

  protected hoverItems = signal<Array<{ id: string; level: number }>>(null)
  protected clickItems = signal<Array<{ id: string; level: number }>>(null)
  protected clickModal = viewChild('clickModal', { read: TemplateRef })

  protected mapId = this.mapStore.mapId
  protected mapData = computed(() => this.data().data[this.mapId()])
  protected layerData = computed(() => this.mapData()?.data)

  protected iconChevron = svgChevronRight
  protected creatureSearch = signal('')
  private selectedIds = computed(() => {
    return new Set(
      this.store
        .idExpression()
        .rows.filter((it) => it.operator === '==')
        .map((it) => it.right),
    )
  })

  /**
   * Creatures of the current map with translated labels
   */
  private creatures = computed((): CreatureRow[] => {
    this.tl8.locale.value()
    const selected = this.selectedIds()
    const rows = (this.mapData()?.creatures || []).map((it) => {
      return {
        ...it,
        label: this.tl8.get(it.name) || humanize(it.id),
        selected: selected.has(it.id),
      }
    })
    return sortBy(rows, (it) => it.label)
  })

  protected creatureGroups = computed((): CreatureGroup[] => {
    const search = this.creatureSearch().toLocaleLowerCase()
    const rows = this.creatures().filter((it) => {
      if (!search) {
        return true
      }
      return it.label.toLocaleLowerCase().includes(search) || it.id.includes(search)
    })
    const groups = Object.entries(groupBy(rows, (it) => it.type)).map(([type, creatures]): CreatureGroup => {
      return {
        type,
        label: encounterLabel(type || 'unknown'),
        count: creatures.reduce((sum, it) => sum + it.count, 0),
        selected: creatures.filter((it) => it.selected).length,
        creatures,
      }
    })
    return sortBy(groups, (it) => it.label)
  })

  /**
   * Creature type groups that are expanded. Groups with selected creatures open on their own until the user
   * toggles a group
   */
  protected openTypes = signal<string[]>([])
  private openTouched = false

  protected levelBounds = computed(() => {
    const creatures = this.mapData()?.creatures || []
    if (!creatures.length) {
      return { min: 1, max: NW_MAX_ENEMY_LEVEL }
    }
    return {
      min: Math.min(...creatures.map((it) => it.minLevel)),
      max: Math.max(...creatures.map((it) => it.maxLevel)),
    }
  })
  protected levelMinValue = computed(() => clamp(this.store.levelMin(), this.levelBounds()))
  protected levelMaxValue = computed(() => clamp(this.store.levelMax(), this.levelBounds()))

  protected isAdvancedActive = computed(() => {
    return ADVANCED_KEYS.some((key) => !!this.store[key]().rows.length)
  })

  protected visible = computed(() => {
    const matcher = this.store.matcher()
    let count = 0
    for (const it of this.mapData()?.summary || []) {
      if (matcher(it.properties)) {
        count += it.count
      }
    }
    return formatCount(count)
  })

  /**
   * Any filter differs from the defaults
   */
  protected hasActive = computed(() => {
    return (
      !!this.store.idExpression().rows.length ||
      !!this.store.hideEncounter().length ||
      this.store.levelMin() > 1 ||
      this.store.levelMax() < NW_MAX_ENEMY_LEVEL ||
      this.isAdvancedActive()
    )
  })

  public constructor() {
    effect(() => {
      const types = this.creatureGroups()
        .filter((it) => it.selected > 0)
        .map((it) => it.type)
      untracked(() => {
        if (this.openTouched || !types.length) {
          return
        }
        const open = new Set([...this.openTypes(), ...types])
        this.openTypes.set(Array.from(open))
      })
    })
  }

  protected isTypeOpen(type: string) {
    return !!this.creatureSearch() || this.openTypes().includes(type)
  }

  protected toggleType(type: string) {
    this.openTouched = true
    const open = this.openTypes()
    this.openTypes.set(open.includes(type) ? open.filter((it) => it !== type) : [...open, type])
  }

  protected setMinLevel(value: string | number) {
    this.store.setMinLevel(Math.min(Number(value), this.levelMaxValue()))
  }

  protected setMaxLevel(value: string | number) {
    this.store.setMaxLevel(Math.max(Number(value), this.levelMinValue()))
  }

  protected applyPreset(select: HTMLSelectElement, presets: PresetRecord[]) {
    const preset = presets[Number(select.value)]
    if (preset) {
      this.store.applyPreset(preset.data)
    }
    select.value = ''
  }

  protected pickVitalType(input: ExpresssionBranchEditorComponent, index: number, value: string) {
    this.pick(input, index, value, { adapter: CreatureTypePickerAdapter, title: 'Select Type', wide: true })
  }

  protected pickVitalCategory(input: ExpresssionBranchEditorComponent, index: number, value: string) {
    this.pick(input, index, value, { adapter: CreatureCategoryPickerAdapter, title: 'Select Category' })
  }

  protected pickVitalLootTag(input: ExpresssionBranchEditorComponent, index: number, value: string) {
    this.pick(input, index, value, { adapter: LootTagPickerAdapter, title: 'Select Loot Tag' })
  }

  protected pickVitalPoiTag(input: ExpresssionBranchEditorComponent, index: number, value: string) {
    this.pick(input, index, value, { adapter: PoiTagPickerAdapter, title: 'Select POI Tag' })
  }

  private pick(
    input: ExpresssionBranchEditorComponent,
    index: number,
    value: string,
    options: { adapter: any; title: string; wide?: boolean },
  ) {
    DataViewPicker.from({
      dataView: {
        adapter: options.adapter,
      },
      injector: this.injector,
      title: options.title,
      selection: value ? [value] : null,
      cssClassModal: options.wide ? 'ion-modal-full md:ion-modal-x-md' : undefined,
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
    this.clickItems.set(uniqueVitals(features))
    this.modal.open({
      content: this.clickModal(),
      size: ['x-sm', 'y-auto'],
    })
  }

  protected handleMouseEnter(features: VitalsFeature[]) {
    this.mapHost.map.getCanvas().style.cursor = 'pointer'
    this.hoverItems.set(uniqueVitals(features))
  }

  protected handleMouseMove(features: VitalsFeature[]) {
    this.hoverItems.set(uniqueVitals(features))
  }

  protected handleMouseLeave(features: VitalsFeature[]) {
    this.mapHost.map.getCanvas().style.cursor = ''
    this.hoverItems.set(null)
  }
}

function uniqueVitals(features: VitalsFeature[]) {
  return uniqBy(
    features.map((it) => {
      return {
        id: it.properties.id,
        level: it.properties.level,
      }
    }),
    (it) => `${it.id}-${it.level}`,
  )
}

function clamp(value: number, bounds: { min: number; max: number }) {
  return Math.max(bounds.min, Math.min(bounds.max, value))
}
