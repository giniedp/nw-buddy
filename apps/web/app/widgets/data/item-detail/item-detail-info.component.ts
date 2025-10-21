import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { getWeaponScaling, getWeaponScalingTiers } from '@nw-data/common'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { apiResource, resourceValue } from '~/utils'
import { ItemStatComponent } from '../../../ui/item-frame'
import { ItemDetailStore } from './item-detail.store'

@Component({
  selector: 'nwb-item-detail-info',
  templateUrl: './item-detail-info.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemStatComponent],
  host: {
    class: 'block',
    '[class.hidden]': 'isHidden()',
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

  protected weight = resourceValue({
    defaultValue: null,
    keepPrevious: true,
    params: () => {
      return {
        ref: this.item()?.ItemStatsRef,
        record: this.record(),
      }
    },
    loader: async ({ params: { ref, record } }) => {
      if (!record || !ref) {
        return null
      }
      const weapon = await this.db.weaponItemsById(ref)
      const armor = await this.db.armorItemsById(ref)
      return Math.floor(weapon?.WeightOverride || armor?.WeightOverride || record?.Weight) / 10
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

  protected scalesWith = resourceValue({
    keepPrevious: true,
    defaultValue: [],
    params: () => {
      return {
        item: this.store.item(),
      }
    },
    loader: async ({ params: { item } }) => {
      const ref = item?.ItemStatsRef
      if (!ref) {
        return []
      }
      const weapon = await this.db.weaponItemsById(ref)
      return this.db.weaponTiersAll().then((list) => {
        const scaling = getWeaponScaling(item, weapon)
        return getWeaponScalingTiers(scaling, list)
      })
    },
  })
}
