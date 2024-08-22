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
  imports: [NwModule, IconsModule, GameMapLayerDirective, TooltipModule, LootModule, PropertyGridModule, ToLCHPipe],
  host: {
    class: 'block',
    '[class.text-neutral-500]': '!hasPoints()',
  },
})
export class MapFilterCategoryComponent {
  protected store = inject(ZoneMapStore)
  protected mapId = this.store.mapId
  protected isOpen = signal(false)
  protected iconArrowLeft = svgAngleLeft
  protected iconInfo = svgInfo
  protected layers = viewChildren(GameMapLayerDirective)

  public section = input.required<string>()
  public category = input.required<string>()

  protected hasChevron = computed(() => this.items().length > 1)
  protected pointsTotal = computed(() => {
    let count = 0
    for (const item of this.items()) {
      count += item.data[this.mapId()]?.count || 0
    }
    return count
  })
  protected hasPoints = computed(() => this.pointsTotal() > 0)

  protected items = computed(() => {
    return this.store.gatherables().filter((it) => {
      return it.section === this.section() && it.category === this.category()
    })
  })

  protected data = computed(() => {
    const items = this.items()
    const subcategories = uniq(items.map((it) => it.subcategory))
    const first = items[0]

    return {
      items,
      subcategories,
      label: first?.categoryLabel || humanize(first?.category),
      icon: first?.categoryIcon,
      color: first?.color,
      variants: sortBy(first?.variants || [], (it) => SIZE_ORDER.indexOf(it.label)),
    }
  })

  protected subcategories = computed(() => this.data().subcategories)
  protected label = computed(() => this.data().label)
  protected icon = computed(() => this.data().icon)
  protected color = computed(() => this.data().color)
  protected variants = computed(() => this.data().variants)

  public isAnyEnabled = computed(() => {
    return this.layers().some((it) => !it.disalbed())
  })
  public isAllEnabled = computed(() => {
    return this.layers().some((it) => !it.disalbed())
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
    if (layer.disalbed()) {
      return false
    }
    const variants = layer.variants()
    return !variants || variants.includes(variant)
  }

  protected isLayerActive(id: string) {
    for (const layer of this.layers()) {
      if (layer.layerId() === id) {
        return !layer.disalbed()
      }
    }
    return false
  }

  protected toggleAll() {
    const isDisabled = !this.isAllEnabled()
    this.layers().forEach((layer) => {
      layer.disalbed.set(!isDisabled)
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
