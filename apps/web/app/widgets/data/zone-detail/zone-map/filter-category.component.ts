import { Component, Pipe, PipeTransform, computed, inject, input, output, signal, viewChildren } from '@angular/core'
import { Feature } from 'geojson'
import { sortBy, uniq, uniqBy } from 'lodash'
import { FilterSpecification } from 'maplibre-gl'
import tinycolor from 'tinycolor2'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgAngleLeft, svgDice, svgInfo } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { humanize, selectSignal } from '~/utils'
import { GameMapHost, GameMapMouseTipDirective } from '~/widgets/game-map'
import { GameMapLayerDirective } from '~/widgets/game-map/game-map-layer.component'
import { LootGraphComponent } from '../../../loot/loot-graph.component'
import { FilterFeatureProperties, FilterDataSet } from './data/types'
import { FilterPopoverComponent } from './filter-popover.component'
import { ZoneMapStore } from './zone-map.store'
import { PropertyGridModule } from '~/ui/property-grid'
import { TranslateService } from '~/i18n'
import { toObservable } from '@angular/core/rxjs-interop'
import { isLootTableEmpty } from '../../gatherable'
import { GatherableDetailDirective } from '../../gatherable-detail'

@Pipe({
  standalone: true,
  name: 'toLCH',
})
export class ToLCHPipe implements PipeTransform {
  public transform(value: string): string {
    const hsl = tinycolor(value).toHsl()
    return `from hsl(${hsl.h} ${Math.round(hsl.s * 100)}% ${Math.round(hsl.l * 100)}%) l c h`
  }
}

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
    ToLCHPipe,
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
  public layers = viewChildren(GameMapLayerDirective)
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

  public isAnyEnabled = computed(() => {
    return this.layers().some((it) => !it.disabled())
  })
  public isAllEnabled = computed(() => {
    return this.layers().some((it) => !it.disabled())
  })
  protected activeVariants = computed(() => {
    return uniq(
      this.layers()
        .map((it) => it.variants())
        .flat(),
    )
  })

  protected isVariantActive(variant: string) {
    const layer = this.layers()[0]
    if (layer.disabled()) {
      return false
    }
    const variants = layer.variants()
    return !variants || variants.includes(variant)
  }

  protected isLayerActive(id: string) {
    for (const layer of this.layers()) {
      if (layer.layerId() === id) {
        return !layer.disabled()
      }
    }
    return false
  }

  protected toggleAll() {
    const isDisabled = !this.isAllEnabled()
    this.layers().forEach((layer) => {
      layer.disabled.set(!isDisabled)
    })
  }

  protected toggleVariant(id: string) {
    for (const layer of this.layers()) {
      layer.toggleVariant(id)
    }
  }

  protected toggleLayer(id: string) {
    for (const layer of this.layers()) {
      if (layer.layerId() === id) {
        layer.toggle()
      }
    }
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
