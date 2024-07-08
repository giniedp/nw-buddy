import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core'
import { patchState } from '@ngrx/signals'
import { StatusEffectCategoryData } from '@nw-data/generated'
import { NwDataService } from '~/data'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridCell, PropertyGridModule } from '~/ui/property-grid'
import { StatusEffectCategoryDetailStore } from './status-effect-category.store'

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

  public formatValue = (value: any, key: keyof StatusEffectCategoryData): PropertyGridCell[] => {
    switch (key) {
      case 'StatusEffectCategoryID': {
        return statusEffectCells(value)
      }
      default: {
        if (Array.isArray(value)) {
          return value.map((it) => ({
            value: String(it),
            secondary: true,
          }))
        }

        if (typeof value === 'object') {
          return Object.keys(value).map((key): PropertyGridCell => {
            return {
              value: `${key}: ${String(value[key])}`,
              block: true,
            }
          })
        }
        if (typeof value === 'number') {
          return [
            {
              value: this.decimals.transform(value, '0.0-7'),
              accent: true,
            },
          ]
        }
        return [
          {
            value: String(value),
            accent: typeof value === 'number',
            info: typeof value === 'boolean',
            bold: typeof value === 'boolean',
          },
        ]
      }
    }
  }
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
