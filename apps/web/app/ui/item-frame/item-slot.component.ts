import { Component, computed, effect, inject, input, signal } from '@angular/core'
import { rxResource } from '@angular/core/rxjs-interop'
import { isHousingItem, isMasterItem, ItemRarity } from '@nw-data/common'
import { HouseItems, MasterItemDefinitions } from '@nw-data/generated'
import { ItemSlotService } from './item-slot.service'

@Component({
  selector: 'nwb-item-slot',
  template: `
    @if (tileIcon()) {
      <img [src]="tileIcon()" class="w-full" />
    }
  `,
  host: {
    class: 'block aspect-square border overflow-clip',
    '[style.background-color]': 'rarityC0()',
    '[style.border-color]': 'rarityC1()',
  },
})
export class ItemSlotComponent {
  private service = inject(ItemSlotService)

  public icon = input<string | MasterItemDefinitions | HouseItems>()
  public rarity = input<string>()
  public isNamed = input<boolean>()
  public isLinked = input<boolean>()
  public gemIcon = input<string>()
  public slotIcon = input<string>()

  protected rarityStyle = computed(() => this.service.rarityStyle(this.rarity() as ItemRarity))
  protected rarityC0 = computed(() => this.rarityStyle().c0)
  protected rarityC1 = computed(() => this.rarityStyle().c1)


  private itemIcon = computed(() => {
    const icon = this.icon()
    if (typeof icon === 'string') {
      return icon
    }
    if (isHousingItem(icon)) {
      return icon.IconPath
    }
    if (isMasterItem(icon)) {
      return icon.IconPath
    }
    return null
  })
  private resource = rxResource({
    params: () => {
      return {
        rarity: this.rarity(),
        isNamed: this.isNamed(),
        isLinked: this.isLinked(),
        icon: this.itemIcon(),
        gemIcon: this.gemIcon(),
        slotIcon: this.slotIcon(),
      }
    },
    stream: ({ params }) => {
      return this.service.loadTile({
        rarity: params.rarity as ItemRarity,
        isNamed: params.isNamed,
        icon: params.icon,
        gemIcon: params.gemIcon,
        slotIcon: params.slotIcon,
        isLinked: params.isLinked,
      })
    },
  })
  public tileIcon = signal<string>(null)

  public constructor() {
    effect(() => {
      if (this.resource.isLoading()) {
        return
      }
      if (this.resource.error() || !this.resource.hasValue()) {
        this.tileIcon.set(null)
        return
      }
      this.tileIcon.set(this.resource.value())
    })
  }
}
