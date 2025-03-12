import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, untracked } from '@angular/core'
import { getItemId } from '@nw-data/common'
import { HouseItems, MasterItemDefinitions } from '@nw-data/generated'
import { ItemDetailStore } from './item-detail.store'

@Component({
  selector: 'nwb-item-detail',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  exportAs: 'detail',
  host: {
    class: 'block font-nimbus',
  },
  providers: [ItemDetailStore],
})
export class ItemDetailComponent {
  public store = inject(ItemDetailStore)

  public itemId = input<string | MasterItemDefinitions | HouseItems>(null)
  public gsOverride = input<number>()
  public perkOverride = input<Record<string, string>>()

  public fullName = this.store.fullName
  public slottedGemIcon = computed(() => this.store.gemPerk()?.IconPath)
  public rarity = this.store.rarity
  public isNamed = this.store.isNamed
  public tierLabel = this.store.tierLabel

  #fxLoad = effect(() => {
    const item = this.itemId()
    const itemId = typeof item === 'string' ? item : getItemId(item)
    if (itemId || this.store.isLoaded()) {
      untracked(() => this.store.load({ recordId: itemId }))
    }
  })

  #fxOverride = effect(() => {
    const gsOverride = this.gsOverride()
    const perkOverride = this.perkOverride()
    this.store.record() // track it
    untracked(() => {
      this.store.updateGsOverride(gsOverride)
      this.store.updatePerkOverride(perkOverride)
    })
  })
}
