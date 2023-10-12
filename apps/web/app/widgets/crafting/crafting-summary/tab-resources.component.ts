import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { combineLatest, map, of, switchMap } from 'rxjs'
import { NwModule } from '~/nw'

import { RouterModule } from '@angular/router'
import { ComponentStore } from '@ngrx/component-store'
import { isHousingItem } from '@nw-data/common'
import { sumBy } from 'lodash'
import { ItemPreferencesService } from '~/preferences'
import { TooltipModule } from '~/ui/tooltip'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { ItemTrackerModule } from '~/widgets/item-tracker'
import { CraftingCalculatorService } from '../crafting-calculator.service'
import { CraftingStepWithAmount, ResourceRow, ResourceRowMode, SummaryRow } from './types'

@Component({
  standalone: true,
  selector: 'tab-resources',
  templateUrl: './tab-resources.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, RouterModule, ItemTrackerModule, ItemDetailModule, TooltipModule],
  providers: [],
  host: {
    class: 'block',
  },
})
export class TabResourcesComponent extends ComponentStore<{
  tree: CraftingStepWithAmount
  rowModes: Record<string, ResourceRowMode>
}> {
  @Input()
  public set tree(value: CraftingStepWithAmount) {
    this.patchState({ tree: value })
  }

  protected readonly summary$ = this.select(({ tree }) => aggregate(tree))
  protected readonly rowModes$ = this.select(({ rowModes }) => rowModes)
  protected readonly rows$ = this.select(this.resourcesTable(), (it) => it)
  protected readonly value$ = this.select(this.rows$, (rows) => sumBy(rows, (row) => row.price))

  protected trackByIndex = (i: number) => i

  public constructor(private service: CraftingCalculatorService, private itemPref: ItemPreferencesService) {
    super({
      tree: null,
      rowModes: {},
    })
  }

  protected toggleIgnore = this.updater((state, row: ResourceRow) => {
    const modes = { ...state.rowModes }
    if (modes[row.itemId]) {
      modes[row.itemId] = ResourceRowMode.None
    } else {
      modes[row.itemId] = ResourceRowMode.Ignore
    }
    return {
      ...state,
      rowModes: modes,
    }
  })

  protected toggleStock = this.updater((state, row: ResourceRow) => {
    const modes = { ...state.rowModes }
    if (modes[row.itemId] === ResourceRowMode.Stock) {
      modes[row.itemId] = ResourceRowMode.None
    } else {
      modes[row.itemId] = ResourceRowMode.Stock
    }
    return {
      ...state,
      rowModes: modes,
    }
  })

  private resourcesTable() {
    return this.summary$.pipe(switchMap((rows) => combineLatest(rows.map((row) => this.resolveRow(row)))))
  }

  private resolveRow({ itemId, currencyId, amount }: SummaryRow) {
    return combineLatest({
      item: currencyId ? of(null) : this.service.fetchItem(itemId),
      mode: this.rowModes$.pipe(map((modes) => modes[itemId])),
      meta: this.itemPref.observe(itemId).pipe(map((it) => it.meta)),
    }).pipe(
      map(({ item, mode, meta }): ResourceRow => {
        const row: ResourceRow = {
          itemId,
          currencyId,
          itemPrice: meta?.price || 0,
          amount,
          amountNeeded: amount,
          amountOwned: meta?.stock || 0,
          price: 0,
          link: currencyId ? [isHousingItem(item) ? 'items' : 'housing', 'table', itemId] : null,
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
      })
    )
  }
}

function aggregate(step: CraftingStepWithAmount) {
  const result = new Map<string, SummaryRow>()
  collectLeafNodes(step, (node) => {
    const leafId = selectLeafId(node)
    const isCurrency = node.ingredient?.type === 'Currency'
    if (!result.has(leafId)) {
      result.set(leafId, {
        recipeId: node.recipeId,
        itemId: isCurrency ? null : leafId,
        currencyId: isCurrency ? leafId : null,
        amount: 0,
      })
    }
    result.get(leafId).amount += node.amount
  })
  return Array.from(result.values())
}

function collectLeafNodes(step: CraftingStepWithAmount, fn: (step: CraftingStepWithAmount) => void) {
  if (step?.expand) {
    step.steps?.forEach((it) => collectLeafNodes(it, fn))
  } else if (step) {
    fn(step)
  }
}

function selectLeafId(node: CraftingStepWithAmount) {
  switch (node.ingredient?.type) {
    case 'Item':
      return node.ingredient.id
    case 'Category_Only':
      return node.selection
    case 'Currency':
      return node.ingredient.id
    default:
      return null
  }
}
