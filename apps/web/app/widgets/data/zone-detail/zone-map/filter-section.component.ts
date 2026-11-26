import { Component, computed, effect, inject, input, signal, untracked, viewChildren } from '@angular/core'
import { groupBy, sortBy } from 'lodash'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { FilterDataSet } from './data/types'
import { MapFilterCategoryComponent } from './filter-category.component'
import { formatCount } from './utils/format-count'
import { ZoneMapStore } from './zone-map.store'

@Component({
  selector: 'nwb-map-filter-section',
  template: `
    <details [open]="isOpen() || !!search()" (toggle)="handleToggle($event)">
      <summary
        class="btn btn-block btn-ghost no-animation rounded-none flex flex-row justify-start items-center group pr-2 text-sm"
      >
        @if (icon()) {
          <nwb-icon [icon]="icon()" class="w-4" />
        }
        <span class="flex-1 text-start" [class.text-primary]="activeCount() > 0">
          {{ label() | nwText }}
        </span>
        <span class="font-mono text-xs font-normal opacity-60">{{ countLabel() }}</span>
        <span class="join">
          <button
            class="join-item btn btn-xs text-xs"
            [class.btn-primary]="isAllActive()"
            (click)="setAll($event, true)"
          >
            All
          </button>
          <button class="join-item btn btn-xs text-xs" (click)="setAll($event, false)" [disabled]="!activeCount()">
            None
          </button>
        </span>
      </summary>
      <div class="px-2 space-y-1 pt-1 pb-8">
        @for (row of rows(); track row.key) {
          <nwb-map-filter-category [source]="row.items" [search]="search()" />
        }
      </div>
    </details>
  `,
  imports: [NwModule, MapFilterCategoryComponent, IconsModule],
  host: {
    class: 'block',
    '[class.hidden]': '!matchSearch()',
  },
})
export class MapFilterSectionComponent {
  private store = inject(ZoneMapStore)
  public source = input.required<FilterDataSet[]>()
  public search = input<string>()

  protected children = viewChildren(MapFilterCategoryComponent)
  protected data = computed(() => {
    const items = this.source()
    const entries = Object.entries(groupBy(items, (it) => it.category)).map(([category, items]) => {
      return {
        key: category,
        items,
      }
    })

    const rows = sortBy(entries, ({ key }) => key)
    const first = items[0]

    return {
      items,
      rows,
      label: first?.sectionLabel,
      icon: first?.sectionIcon,
    }
  })
  protected matchSearch = computed(() => {
    const search = this.search()
    if (!search) {
      return true
    }
    return this.children().some((it) => it.matchSearch())
  })

  protected items = computed(() => this.data().items)
  protected rows = computed(() => this.data().rows)
  protected label = computed(() => this.data().label)
  protected icon = computed(() => this.data().icon)
  protected count = computed(() => {
    const mapId = this.store.mapId()
    return this.items().reduce((sum, it) => sum + (it.data[mapId]?.count || 0), 0)
  })
  protected countLabel = computed(() => formatCount(this.count()))
  protected activeCount = computed(() => {
    const selection = this.store.layers()
    return this.items().filter((it) => !!selection[it.id]).length
  })
  protected isAllActive = computed(() => this.activeCount() === this.items().length)

  /**
   * Collapsed by default, opens once a layer of this section is active (e.g. restored from preferences)
   */
  protected isOpen = signal(false)
  private touched = false

  public constructor() {
    effect(() => {
      const active = this.activeCount() > 0
      untracked(() => {
        if (active && !this.touched) {
          this.isOpen.set(true)
        }
      })
    })
  }

  protected handleToggle(event: Event) {
    const open = (event.target as HTMLDetailsElement).open
    if (this.search()) {
      return
    }
    if (open !== this.isOpen()) {
      this.touched = true
      this.isOpen.set(open)
    }
  }

  protected setAll(event: Event, enabled: boolean) {
    event.preventDefault()
    event.stopPropagation()
    this.store.setLayersEnabled(
      this.items().map((it) => it.id),
      enabled,
    )
  }
}
