import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core'
import { combineLatest, map, switchMap } from 'rxjs'
import { NwLinkService, NwModule } from '~/nw'

import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { RouterModule } from '@angular/router'
import { sumBy } from 'lodash'
import { ItemPreferencesService } from '~/preferences'
import { TooltipModule } from '~/ui/tooltip'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { ItemTrackerModule } from '~/widgets/item-tracker'
import { ResourceRow, ResourceRowMode, SummaryRow } from './types'
import { CraftingCalculatorStore } from '../crafting-calculator.store'
import { combineLatestOrEmpty } from '~/utils'

@Component({
  selector: 'tab-resources',
  templateUrl: './tab-resources.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, RouterModule, ItemTrackerModule, ItemDetailModule, TooltipModule],
  providers: [],
  host: {
    class: 'block',
  },
})
export class TabResourcesComponent {
  public total = input<number>(1)
  private itemPref = inject(ItemPreferencesService)

  public summary = input<SummaryRow[]>()
  private summary$ = toObservable(this.summary)

  private rowModes = signal<Record<string, ResourceRowMode>>({})
  private rowModes$ = toObservable(this.rowModes)

  protected rows = toSignal(this.resourceRows())
  protected value = computed(() => sumBy(this.rows() || [], (row) => row.price))
  protected valuePerUnit = computed(() => this.value() / this.total())

  protected toggleIgnore(row: ResourceRow) {
    const modes = { ...this.rowModes() }
    if (modes[row.itemId]) {
      modes[row.itemId] = ResourceRowMode.None
    } else {
      modes[row.itemId] = ResourceRowMode.Ignore
    }
    this.rowModes.set(modes)
  }

  protected toggleStock(row: ResourceRow) {
    const modes = { ...this.rowModes() }
    if (modes[row.itemId] === ResourceRowMode.Stock) {
      modes[row.itemId] = ResourceRowMode.None
    } else {
      modes[row.itemId] = ResourceRowMode.Stock
    }
    this.rowModes.set(modes)
  }

  private resourceRows() {
    return this.summary$.pipe(
      switchMap((rows) => combineLatestOrEmpty((rows || []).map((row) => this.resolveRow(row)))),
    )
  }

  private resolveRow({ itemId, amount }: SummaryRow) {
    return combineLatest({
      mode: this.rowModes$.pipe(map((modes) => modes[itemId])),
      meta: this.itemPref.observe(itemId).pipe(map((it) => it.meta)),
    }).pipe(
      map(({ mode, meta }): ResourceRow => {
        const row: ResourceRow = {
          itemId,
          itemPrice: meta?.price || 0,
          amount,
          amountNeeded: amount,
          amountOwned: meta?.stock || 0,
          price: 0,
        }
        switch (mode || ResourceRowMode.None) {
          case ResourceRowMode.Ignore: {
            row.ignored = true
            row.stocked = false
            row.amountNeeded = 0
            row.price = 0
            break
          }
          case ResourceRowMode.Stock: {
            row.ignored = row.amountOwned >= amount
            row.stocked = true
            row.amountNeeded = Math.max(0, amount - row.amountOwned)
            row.price = row.amountNeeded * row.itemPrice
            break
          }
          default: {
            row.ignored = false
            row.stocked = false
            row.amountNeeded = amount
            row.price = row.amountNeeded * row.itemPrice
            break
          }
        }
        return row
      }),
    )
  }
}
