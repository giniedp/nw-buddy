import { Component, Pipe, PipeTransform, computed, inject, input, signal, viewChildren } from '@angular/core'
import { sortBy, uniq } from 'lodash'
import tinycolor from 'tinycolor2'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgAngleLeft, svgInfo } from '~/ui/icons/svg'
import { PropertyGridModule } from '~/ui/property-grid'
import { TooltipModule } from '~/ui/tooltip'
import { humanize } from '~/utils'
import { GameMapLayerDirective } from '~/widgets/game-map/game-map-layer.component'
import { LootModule } from '~/widgets/loot'
import { ZoneMapStore } from './zone-map.store'
import { FilterPopoverComponent } from './filter-popover.component'
import { FilterDataSet } from './data/types'

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
  standalone: true,
  selector: 'nwb-map-filter-category',
  templateUrl: './filter-category.component.html',
  imports: [NwModule, IconsModule, GameMapLayerDirective, TooltipModule, FilterPopoverComponent, ToLCHPipe],
  host: {
    class: 'block',
  },
})
export class MapFilterCategoryComponent {
  public source = input.required<FilterDataSet[]>()
  protected mapId = inject(ZoneMapStore).mapId
  protected isOpen = signal(false)
  protected iconArrowLeft = svgAngleLeft
  protected iconInfo = svgInfo
  protected layers = viewChildren(GameMapLayerDirective)

  protected hasChevron = computed(() => this.items().length > 1)

  protected items = this.source

  protected data = computed(() => {
    const items = this.items()
    const subcategories = uniq(items.map((it) => it.subcategory))
    const first = items[0]
    const variants = sortBy(first?.variants || [], (it) => SIZE_ORDER.indexOf(it.label))
    return {
      items,
      subcategories,
      label: first?.categoryLabel || humanize(first?.category),
      icon: first?.categoryIcon,
      color: first?.color,
      lootTable: first?.lootTable,
      variants: variants,
    }
  })

  protected subcategories = computed(() => this.data().subcategories)
  protected label = computed(() => this.data().label)
  protected icon = computed(() => this.data().icon)
  protected color = computed(() => this.data().color)
  protected variants = computed(() => this.data().variants)
  protected lootTable = computed(() => this.data().lootTable)

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
}
