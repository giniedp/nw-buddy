import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, effect, inject, input, untracked } from '@angular/core'
import { StatusEffectCategoryData } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridCell, PropertyGridModule, gridDescriptor } from '~/ui/property-grid'
import { valueCell } from '~/ui/property-grid/cells'
import { StatusEffectCategoryDetailStore } from './status-effect-category.store'
import { diffButtonCell } from '~/widgets/diff-tool'

@Component({
  selector: 'nwb-status-effect-category-detail',
  templateUrl: './status-effect-category-detail.component.html',
  exportAs: 'detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, PropertyGridModule],
  providers: [DecimalPipe, StatusEffectCategoryDetailStore],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class StatusEffectCategoryDetailComponent {
  protected store = inject(StatusEffectCategoryDetailStore)
  public categoryId = input<string>(null)

  #fxLoad = effect(() => {
    const categoryId = this.categoryId()
    untracked(() => {
      this.store.load(categoryId)
    })
  })

  public descriptor = gridDescriptor<StatusEffectCategoryData>(
    {
      StatusEffectCategoryID: (value) => {
        return [
          ...statusEffectCells(value),
          diffButtonCell({
            record: this.store.category(),
            idKey: 'StatusEffectCategoryID',
          }),
        ]
      },
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
