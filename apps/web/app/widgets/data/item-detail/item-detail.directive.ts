import { Directive, effect, inject, input, untracked } from '@angular/core'
import { ItemDetailStore } from './item-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbItemDetail]',
  exportAs: 'itemDetail',
  providers: [ItemDetailStore],
})
export class ItemDetailDirective {
  public store = inject(ItemDetailStore)
  //private storeOld = inject(ItemDetailStoreOld)

  public itemId = input<string>(null, { alias: 'nwbItemDetail' })
  public gsOverride = input<number>()
  public perkOverride = input<Record<string, string>>()

  public item = this.store.item
  public houseItem = this.store.houseItem
  public record = this.store.record
  public icon = this.store.icon
  public name = this.store.name
  public rarity = this.store.rarity
  public rarityLabel = this.store.rarityLabel
  public isNamed = this.store.isNamed

  #fxLoad = effect(() => {
    const itemId = this.itemId()
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
