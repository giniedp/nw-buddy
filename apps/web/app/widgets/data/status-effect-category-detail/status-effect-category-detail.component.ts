import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core'
import { patchState } from '@ngrx/signals'
import { StatusEffectCategoryData } from '@nw-data/generated'
import { NwDataService } from '~/data'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridCell, PropertyGridModule, gridDescriptor } from '~/ui/property-grid'
import { StatusEffectCategoryDetailStore } from './status-effect-category.store'
import { valueCell } from '~/ui/property-grid/cells'

@Component({
  standalone: true,
  selector: 'nwb-status-effect-category-detail',
  templateUrl: './status-effect-category-detail.component.html',
  exportAs: 'detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, PropertyGridModule, DecimalPipe],
  providers: [DecimalPipe, StatusEffectCategoryDetailStore],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class StatusEffectCategoryDetailComponent {
  private decimals = inject(DecimalPipe)
  private db = inject(NwDataService)
  protected store = inject(StatusEffectCategoryDetailStore)

  @Input()
  public set categoryId(value: string) {
    patchState(this.store, { categoryId: value })
  }

  public descriptor = gridDescriptor<StatusEffectCategoryData>(
    {
      StatusEffectCategoryID: statusEffectCells,
    },
    (value) => {
      if (!Array.isArray(value) && typeof value === 'object') {
        return Object.keys(value).map((key) => valueCell({ value: `${key}: ${String(value[key])}` }))
      }
      return valueCell({ value })
    },
  )
}

function statusEffectCells(list: string | string[]): PropertyGridCell[] {
  list = typeof list === 'string' ? [list] : list
  return list?.map((it) => {
    const isLink = it !== 'All'
    return {
      value: String(it),
      accent: isLink,
      routerLink: isLink ? ['status-effect', it] : null,
    }
  })
}
