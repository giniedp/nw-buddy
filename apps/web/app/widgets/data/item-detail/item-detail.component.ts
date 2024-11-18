import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, untracked } from '@angular/core'
import { getItemId } from '@nw-data/common'
import { HouseItems, MasterItemDefinitions } from '@nw-data/generated'
import { ItemDetailStore } from './item-detail.store'

@Component({
  standalone: true,
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
  //private storeOld = inject(ItemDetailStoreOld)

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
    untracked(() => {
      this.store.load({
        recordId: itemId,
        gsOverride: this.gsOverride(),
        perkOverride: this.perkOverride(),
      })
      //this.storeOld.patchState({ recordId: itemId })
    })
  })

  #fxOverrideGs = effect(() => {
    const gsOverride = this.gsOverride()
    untracked(() => {
      //this.storeOld.patchState({ gsOverride })
      this.store.updateGsOverride(gsOverride)
    })
  })

  #fxOverridePerks = effect(() => {
    const perkOverride = this.perkOverride()
    untracked(() => {
      //this.storeOld.patchState({ perkOverride })
      this.store.updatePerkOverride(perkOverride)
    })
  })
}
