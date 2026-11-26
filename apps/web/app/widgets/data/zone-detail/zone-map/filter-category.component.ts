import { Component, computed, inject, input, signal } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { Feature } from 'geojson'
import { sortBy, uniq, uniqBy } from 'lodash'
import { FilterSpecification } from 'maplibre-gl'
import { TranslateService } from '~/i18n'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgAngleLeft, svgDice, svgInfo } from '~/ui/icons/svg'
import { PropertyGridModule } from '~/ui/property-grid'
import { TooltipModule } from '~/ui/tooltip'
import { humanize, selectSignal } from '~/utils'
import { GameMapHost, GameMapMouseTipDirective } from '~/widgets/game-map'
import { GameMapLayerDirective } from '~/widgets/game-map/game-map-layer.component'
import { isLootTableEmpty } from '../../gatherable'
import { GatherableDetailDirective } from '../../gatherable-detail'
import { FilterDataSet, FilterFeatureProperties } from './data/types'
import { FilterPopoverComponent } from './filter-popover.component'
import { formatCount } from './utils/format-count'
import { ZoneMapStore } from './zone-map.store'

const SIZE_ORDER = ['XXS', 'XS', 'SM', 'MD', 'LG', 'XL', 'XXL', 'XXXL']

@Component({
  selector: 'nwb-map-filter-category',
  templateUrl: './filter-category.component.html',
  imports: [
    NwModule,
    IconsModule,
    GameMapLayerDirective,
    GameMapMouseTipDirective,
    TooltipModule,
    FilterPopoverComponent,
    PropertyGridModule,
    GatherableDetailDirective,
  ],
  host: {
    class: 'block',
    '[class.hidden]': '!matchSearch()',
  },
})
export class MapFilterCategoryComponent {
  public source = input.required<FilterDataSet[]>()
  public search = input<string>()
  protected i18n = inject(TranslateService)
  protected mapStore = inject(ZoneMapStore)
  protected mapHost = inject(GameMapHost)
  protected mapId = this.mapStore.mapId
  protected showHeatmap = this.mapStore.showHeatmap
  protected isOpen = signal(false)
  protected iconArrowLeft = svgAngleLeft
  protected iconInfo = svgInfo
  protected hasChevron = computed(() => this.items().length > 1)
  protected hasInfo = computed(() => !isLootTableEmpty(this.lootTable()))
  protected hoverItems = signal<FilterFeatureProperties[]>(null)
  protected hoverTips = signal<string[]>(null)
  protected items = this.source
  protected diceIcon = svgDice

  protected data = computed(() => {
    const items = this.items()
    const subcategories = uniqBy(items, (it) => it.subcategory)
    const first = items[0]
    const variants = sortBy(first?.variants || [], (it) => SIZE_ORDER.indexOf(it.label))
    return {
      items,
      subcategories,
      label: first?.categoryLabel || humanize(first?.category),
      affix: first?.categoryAffix,
      icon: first?.categoryIcon,
      color: first?.properties.color,
      lootTable: first?.properties.lootTableID,
      variants: variants,
    }
  })

  protected subcategories = computed(() => this.data().subcategories)
  protected label = computed(() => this.data().label)
  protected affix = computed(() => this.data().affix)

  public matchSearch = selectSignal(
    {
      label: this.i18n.observe(toObservable(this.label)),
      affix: this.i18n.observe(toObservable(this.affix)),
      search: this.search,
    },
    ({ label, affix, search }) => {
      if (!search) {
        return true
      }
      if (label && label.toLocaleLowerCase().includes(search.toLocaleLowerCase())) {
        return true
      }
      if (affix && affix.toLocaleLowerCase().includes(search.toLocaleLowerCase())) {
        return true
      }
      return false
    },
  )

  protected icon = computed(() => this.data().icon)
  protected color = computed(() => this.data().color)
  protected variants = computed(() => this.data().variants)
  protected lootTable = computed(() => this.data().lootTable)
  protected filter = computed((): FilterSpecification => {
    const filter: FilterSpecification[] = []
    // filter.push(['!=', 0, ['length', ['get', 'encounter']]])

    // if (!this.mapStore.showRandomEncounter()) {
    filter.push(['!', ['in', 'random', ['get', 'encounter']]])
    // }
    // if (!this.mapStore.showGoblinEncounter()) {
    //   filter.push(['!', ['in', 'goblin', ['get', 'encounter']]])
    // }
    // if (!this.mapStore.showDarknessEncounter()) {
    //   filter.push(['!', ['in', 'darkness', ['get', 'encounter']]])
    // }
    if (!filter.length) {
      return null
    }
    return ['all', ...filter] as any
  })

  protected selection = this.mapStore.layers
  protected layerIds = computed(() => this.items().map((it) => it.id))

  public isAnyEnabled = computed(() => {
    const selection = this.selection()
    return this.layerIds().some((id) => !!selection[id])
  })

  /**
   * Points on the current map, of all layers in this row
   */
  protected count = computed(() => {
    const mapId = this.mapId()
    return this.items().reduce((sum, it) => sum + (it.data[mapId]?.count || 0), 0)
  })
  protected countLabel = computed(() => formatCount(this.count()))
  protected formatCount = formatCount

  /**
   * Point count tooltip per variant id
   */
  protected variantTips = computed(() => {
    const mapId = this.mapId()
    const result: Record<string, string> = {}
    for (const variant of this.variants()) {
      const count = this.items().reduce((sum, it) => sum + (it.data[mapId]?.variantCounts[variant.id] || 0), 0)
      result[variant.id] = `${variant.label}: ${count} points`
    }
    return result
  })

  protected isVariantActive(variant: string) {
    const selection = this.selection()[this.layerIds()[0]]
    if (!selection) {
      return false
    }
    return !selection.variants || selection.variants.includes(variant)
  }

  protected isLayerActive(id: string) {
    return !!this.selection()[id]
  }

  protected toggleAll() {
    this.mapStore.setLayersEnabled(this.layerIds(), !this.isAnyEnabled())
  }

  protected toggleVariant(id: string) {
    this.mapStore.toggleVariant(this.layerIds(), id)
  }

  protected toggleLayer(id: string) {
    this.mapStore.toggleLayer(id)
  }

  protected handleMouseEnter(features: Array<Feature<any, FilterFeatureProperties>>) {
    const items = features.map((it) => it.properties as FilterFeatureProperties)
    const tips = uniq(items.map((it) => it.title)).filter((it) => !!it)
    this.hoverTips.set(tips)
    const uniqueItems = uniqBy(items, (it) =>
      [it.vitalID, it.lootTableID, it.loreID, it.gatherableID, it.variationID].join(),
    )
    this.hoverItems.set(uniqueItems)
  }

  protected handleMouseMove(features: Array<Feature<any, FilterFeatureProperties>>) {
    const items = features.map((it) => it.properties as FilterFeatureProperties)
    const tips = uniq(items.map((it) => it.title)).filter((it) => !!it)
    this.hoverTips.set(tips)
    const uniqueItems = uniqBy(items, (it) =>
      [it.vitalID, it.lootTableID, it.loreID, it.gatherableID, it.variationID].join(),
    )
    this.hoverItems.set(uniqueItems)
  }

  protected handleMouseLeave(features: Array<Feature<any, FilterFeatureProperties>>) {
    this.hoverItems.set(null)
    this.hoverTips.set(null)
    this.mapHost.map.getCanvas().style.cursor = ''
  }

  protected handleMouseClick(features: Array<Feature<any, FilterFeatureProperties>>) {}
}
