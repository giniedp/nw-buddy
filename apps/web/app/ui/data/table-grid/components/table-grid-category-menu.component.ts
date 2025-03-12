import { CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, HostListener, Input } from '@angular/core'
import { RouterModule } from '@angular/router'
import { ComponentStore } from '@ngrx/component-store'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { eqCaseInsensitive } from '~/utils'
import { DataTableCategory } from '../types'
import { svgChevronLeft } from '~/ui/icons/svg'

@Component({
  selector: 'nwb-table-grid-category-menu,button[nwbGridCateogryMenu]',
  templateUrl: './table-grid-category-menu.component.html',
  imports: [CommonModule, OverlayModule, IconsModule, NwModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex flex-row gap-2 items-center py-1',
  },
  hostDirectives: [CdkOverlayOrigin],
})
export class TableGridCategoryMenuComponent extends ComponentStore<{
  categories: DataTableCategory[]
  category: string | number | null
  rowCounter?: number
  rowCounterEnabled?: boolean
  routePrefix?: string
  defaultTitle?: string
  defaultIcon?: string
  defaultRoute?: string
}> {
  @Input()
  public set nwbGridCateogryMenu(value: DataTableCategory[]) {
    this.categories = value
  }

  @Input()
  public set categories(value: DataTableCategory[]) {
    this.patchState({
      categories: value,
    })
  }

  @Input()
  public set category(value: string | number | null) {
    this.patchState({
      category: value,
    })
  }

  @Input()
  public set rowCounter(value: number) {
    this.patchState({
      rowCounter: value,
      rowCounterEnabled: true,
    })
  }

  @Input()
  public set routePrefix(value: string) {
    this.patchState({
      routePrefix: value,
    })
  }

  @Input({ required: true })
  public set defaultTitle(value: string) {
    this.patchState({ defaultTitle: value })
  }

  @Input()
  public set defaultIcon(value: string) {
    this.patchState({ defaultIcon: value })
  }

  @Input({ required: true })
  public set defaultRoute(value: string) {
    this.patchState({ defaultRoute: value })
  }

  protected isPanelOpen = false
  protected iconChevron = svgChevronLeft

  protected readonly counter$ = this.select(({ rowCounter, rowCounterEnabled }) => {
    return rowCounterEnabled ? { value: rowCounter || 0 } : null
  })
  protected readonly categories$ = this.select(celectCategories)
  protected readonly hasCategories$ = this.select(this.categories$, (it) => it.length > 0)
  protected readonly activeCateogry$ = this.select(this.categories$, (it) => {
    return it.find((it) => it.active)
  })
  protected readonly defaultCategory$ = this.select(({ defaultTitle, defaultRoute, defaultIcon, routePrefix }) => {
    return {
      id: defaultRoute,
      route: [routePrefix || './', defaultRoute.toLowerCase()],
      label: defaultTitle,
      icon: defaultIcon,
    }
  })

  public constructor(protected cdkOrigin: CdkOverlayOrigin) {
    super({
      categories: [],
      category: null,
    })
  }

  @HostListener('click')
  public open() {
    this.isPanelOpen = true
  }
}

function celectCategories({
  categories,
  category,
  routePrefix,
}: {
  categories: DataTableCategory[]
  category: string | number | null
  routePrefix?: string
}) {
  categories = categories || []
  return categories.map((it) => {
    return {
      ...it,
      route: [routePrefix || './', it.id.toLowerCase()],
      active: eqCaseInsensitive(String(it.id), String(category)),
    }
  })
}
