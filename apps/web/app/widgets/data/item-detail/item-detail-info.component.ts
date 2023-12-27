import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { NwModule } from '~/nw'
import { mapProp, selectSignal } from '~/utils'
import { ItemDetailStore } from './item-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-item-detail-info',
  templateUrl: './item-detail-info.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule],
  host: {
    class: 'block',
  },
})
export class ItemDetailInfoComponent {
  protected store = inject(ItemDetailStore)

  protected bindOnEquip = toSignal(this.store.isBindOnEquip$)
  protected bindOnPickup = toSignal(this.store.isBindOnPickup$)
  protected tierLabel = toSignal(this.store.tierLabel$)
  protected canReplaceGem = toSignal(this.store.canReplaceGem$)
  protected cantReplaceGem = toSignal(this.store.cantReplaceGem$)
  protected weight = selectSignal(
    {
      weapon: this.store.weaponStats$,
      armor: this.store.armorStats$,
      item: this.store.item$,
    },
    ({ weapon, armor, item }) => {
      return Math.floor(weapon?.WeightOverride || armor?.WeightOverride || item?.Weight) / 10
    },
  )
  protected durability = toSignal(this.store.item$.pipe(mapProp('Durability')))
  protected maxStackSize = toSignal(this.store.entity$.pipe(mapProp('MaxStackSize')))
  protected requiredLevel = toSignal(this.store.item$.pipe(mapProp('RequiredLevel')))
  protected ingredientTypes = toSignal(this.store.ingredientCategories$)
  protected isMissing = toSignal(this.store.isMissing$)
}
