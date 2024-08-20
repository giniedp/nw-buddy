import { Component, Pipe, PipeTransform, computed, inject, input, signal, viewChildren } from '@angular/core'
import { sortBy, uniq } from 'lodash'
import tinycolor from 'tinycolor2'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgAngleLeft } from '~/ui/icons/svg'
import { humanize } from '~/utils'
import { GameMapLayerDirective } from '~/widgets/game-map/game-map-layer.component'
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
  template: `
    @for (layer of items(); track layer.id) {
      @let data = layer.data[store.mapId()];
      <ng-container
        #mapLayer="mapLayer"
        [nwbMapLayer]="layer.id"
        [disalbed]="true"
        [heatmap]="true || !!layer.variants.length && !layer.variants[0].icon"
        [color]="layer.color"
        [data]="data?.geometry"
      />
    }

    <div class="flex flex-row gap-1" [class.pr-8]="!hasChevron()">
      <div class="join w-full">
        <button
          class="join-item flex-1 btn btn-sm btn-ghost justify-start items-center gap-2 text-left"
          (click)="toggleAll()"
          [class.text-primary]="isAnyEnabled()"
        >
        <span class="flex-1">
          {{ label() | nwText }}
        </span>

          @if (icon(); as icon) {
            <img [nwImage]="icon" class="w-6 flex-none" />
          }
        </button>


        @for (variant of variants(); track variant.id) {
          @let isActive = isVariantActive(variant.id);
          <button
            class="join-item flex-none btn btn-sm btn-square font-mono text-shadow-sm shadow-black"
            [class.btn-ghost]="!isActive"
            [style.--btn-color]="isActive ? (variant.color | toLCH) : null"
            (click)="toggleVariant(variant.id)"
          >
            @if (variant.icon; as icon) {
              <img [nwImage]="icon" class="w-6" />
            } @else {
              {{ variant.label }}
            }
          </button>
        } @empty {
          @if (isAnyEnabled() && items().length === 1) {
            <button
              class="join-item flex-none btn btn-sm btn-square font-mono text-shadow-sm shadow-black"
              [class.btn-ghost]="!isAnyEnabled()"
              [style.--btn-color]="isAnyEnabled() ? (color() | toLCH) : null"
              (click)="toggleAll()"
            ></button>
          }
        }

      </div>

      @if (hasChevron()) {
        <button class="flex-none btn btn-sm btn-square btn-ghost" (click)="isOpen.set(!isOpen())">
          <nwb-icon
            [icon]="iconArrowLeft"
            class="w-3 transition-transform"
            [class.-rotate-180]="!isOpen()"
            [class.-rotate-90]="isOpen()"
          />
        </button>
      }
    </div>

    @if (isOpen()) {
      <div class="grid grid-cols-2 gap-1 pl-8 mt-1">
        @for (item of items(); track $index) {
          @let isActive = isLayerActive(item.id);
          <div class="join">
            <button
              class="join-item flex-1 btn btn-sm btn-ghost justify-start text-left"
              (click)="toggleLayer(item.id)"
            >
              {{ (item.subcategoryLabel || item.subcategory) | nwText }}
            </button>
            @if (isActive) {
              <button
                class="join-item flex-none btn btn-sm btn-square"
                [class.btn-ghost]="!isActive"
                [style.--btn-color]="isActive ? (item.color | toLCH) : null"
                (click)="toggleLayer(item.id)"
              ></button>
            }
          </div>
        }
      </div>
    }
  `,
  imports: [NwModule, IconsModule, GameMapLayerDirective, ToLCHPipe],
  host: {
    class: 'block',
  },
})
export class MapFilterCategoryComponent {
  protected store = inject(ZoneMapStore)
  protected mapId = this.store.mapId
  protected isOpen = signal(false)
  protected iconArrowLeft = svgAngleLeft
  protected layers = viewChildren(GameMapLayerDirective)

  public section = input<string>(null)
  public category = input<string>(null)

  protected hasChevron = computed(() => this.items().length > 1)
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
