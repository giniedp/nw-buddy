import { CdkMenuModule } from '@angular/cdk/menu'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'
import { rxResource } from '@angular/core/rxjs-interop'
import { getEquipSlotForId } from '@nw-data/common'
import { ArmorAppearanceDefinitions } from '@nw-data/generated'
import { combineLatest, from, map } from 'rxjs'
import { injectNwData } from '~/data'
import { TransmogRecord, TransmogSlotId } from '~/data/transmogs'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { TooltipModule } from '~/ui/tooltip'
import { ItemDetailModule } from '~/widgets/data/item-detail'

@Component({
  selector: 'nwb-transmog-loadout-slot',
  templateUrl: './transmog-loadout-slot.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemDetailModule, IconsModule, CdkMenuModule, TooltipModule],
  providers: [],
  host: {
    class: 'block w-14 overflow-clip relative',
  },
})
export class TransmogLoadoutSlotComponent {
  private db = injectNwData()
  public readonly slotId = input<TransmogSlotId>()
  public readonly record = input<TransmogRecord>()

  protected iconResource = rxResource({
    params: () => {
      return {
        slotId: this.slotId(),
        record: this.record(),
      }
    },
    stream: ({ params: { slotId, record } }) => {
      const slot = record?.slots?.[slotId]
      return from(this.db.armorAppearancesByName(slot.item)).pipe(
        map((list) => list.find((it) => isSameGender(it, record))),
        map((it) => it.IconPath),
      )
    },
  })
  protected slotIcon = computed(() => {
    return getEquipSlotForId(this.slotId())?.iconSlot
  })
  protected icon = computed(() => {
    return this.iconResource.hasValue() ? this.iconResource.value() : null
  })
  protected isLoading = this.iconResource.isLoading

  protected colorResource = rxResource({
    params: () => {
      return {
        slotId: this.slotId(),
        record: this.record(),
      }
    },
    stream: ({ params: { slotId, record } }) => {
      const slot = record?.slots?.[slotId]
      return combineLatest({
        r: this.db.dyeColorsByIndex(slot?.dyeR),
        g: this.db.dyeColorsByIndex(slot?.dyeG),
        b: this.db.dyeColorsByIndex(slot?.dyeB),
        a: this.db.dyeColorsByIndex(slot?.dyeA),
      }).pipe(
        map(({ r, g, b, a }) => {
          return [r?.Color, g?.Color, b?.Color, a?.Color]
        }),
      )
    },
  })
  protected colors = computed(() => (this.colorResource.hasValue() ? this.colorResource.value() : []))
}

function isSameGender(armor: ArmorAppearanceDefinitions, record: TransmogRecord) {
  const isFemale = record.gender === 'female'
  return armor.Gender?.toLowerCase() === (isFemale ? 'female' : 'male')
}
