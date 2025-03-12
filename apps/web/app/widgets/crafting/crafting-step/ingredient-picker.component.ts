import { CdkMenuModule } from '@angular/cdk/menu'
import { Component, computed, input, output, signal } from '@angular/core'
import {
  getItemId,
  getItemRarity,
  getItemRarityNumeric,
  getItemRarityWeight,
  getItemTierAsRoman,
  isItemNamed,
  isItemResource,
  isMasterItem,
} from '@nw-data/common'
import { groupBy, sortBy } from 'lodash'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { apiResource } from '~/utils'
import { ItemDetailModule } from '~/widgets/data/item-detail'

@Component({
  selector: 'nwb-ingredient-picker',
  imports: [CdkMenuModule, NwModule, ItemDetailModule],
  templateUrl: './ingredient-picker.component.html',
  host: {
    class: 'menu menu-compact w-80 flex-nowrap overflow-auto bg-base-300 rounded-md shadow-md relative max-h-[400px]',
  },
})
export class IngredientPickerComponent {
  private db = injectNwData()
  public items = input<string[]>([])
  public selection = input<string>(null)
  public selectionChange = output<string>()
  protected resource = apiResource({
    request: this.items,
    loader: async () => {
      const items = await Promise.all(this.items().map((id) => this.db.itemOrHousingItem(id)))
      return items.map((item) => {
        return {
          item,
          value: getItemId(item),
          tier: item.Tier,
          tierLabel: getItemTierAsRoman(item.Tier),
          rarity: getItemRarity(item),
          isNamed: isMasterItem(item) && isItemNamed(item),
          isResource: isMasterItem(item) && isItemResource(item),
          name: item.Name,
        }
      })
    },
  })
  protected options = computed(() => this.resource.value())
  protected showTabs = computed(() => this.tabs().length > 1 && this.options()?.length > 20)
  protected tab = signal(0)
  protected tabs = computed(() => {
    const items = this.options()
    return Object.entries(groupBy(items, (it) => it.tier)).map(([tier, items]) => {
      return {
        tier,
        items: sortBy(items, (it) => getItemRarityNumeric(it.item)),
      }
    })
  })
}
