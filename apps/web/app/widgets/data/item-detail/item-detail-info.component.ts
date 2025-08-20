import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, HostBinding, inject } from '@angular/core'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { apiResource } from '~/utils'
import { ItemDetailStore } from './item-detail.store'

@Component({
  selector: 'nwb-item-detail-info',
  templateUrl: './item-detail-info.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule],
  host: {
    class: 'block',
    "[class.hidden]": 'isHidden()',
  },
})
export class ItemDetailInfoComponent {
  protected db = injectNwData()
  protected store = inject(ItemDetailStore)
  protected isHidden = computed(() => !this.store.record())

  protected item = this.store.item
  protected record = this.store.record

  protected bindOnEquip = computed(() => !!this.store.item()?.BindOnEquip)
  protected bindOnPickup = computed(() => !!this.store.record()?.BindOnPickup)
  protected tierLabel = this.store.tierLabel
  protected canReplaceGem = computed(() => this.item()?.CanHavePerks && this.item()?.CanReplaceGem)
  protected cantReplaceGem = computed(() => this.item()?.CanHavePerks && !this.item()?.CanReplaceGem)

  protected weight = apiResource({
    request: () => {
      return {
        ref: this.item()?.ItemStatsRef,
        record: this.record(),
      }
    },
    loader: async ({ request }) => {
      const item = request.record
      if (!item) {
        return null
      }
      const weapon = await this.db.weaponItemsById(request.ref)
      const armor = await this.db.armorItemsById(request.ref)
      return Math.floor(weapon?.WeightOverride || armor?.WeightOverride || item?.Weight) / 10
    },
  })

  protected durability = computed(() => this.item()?.Durability)
  protected maxStackSize = computed(() => this.record()?.MaxStackSize)
  protected requiredLevel = computed(() => this.item()?.RequiredLevel)
  protected ingredientTypes = apiResource({
    request: () => this.item()?.IngredientCategories,
    loader: async ({ request }) => {
      if (!request?.length) {
        return []
      }
      return Promise.all(
        request.map(async (it) => {
          const category = await this.db.recipeCategoriesById(it)
          return category?.DisplayText
        }),
      )
    },
  })
}
