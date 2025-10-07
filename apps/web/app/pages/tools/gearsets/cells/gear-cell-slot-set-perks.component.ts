import { ChangeDetectionStrategy, Component, computed, inject, resource } from '@angular/core'
import { EquipmentSet } from '@nw-data/common'
import { MasterItemDefinitions } from '@nw-data/generated'
import { GearsetStore, injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { eqCaseInsensitive } from '~/utils'
import { ItemDetailModule } from '~/widgets/data/item-detail'

@Component({
  selector: 'nwb-gear-cell-slot-set-perks',
  templateUrl: './gear-cell-slot-set-perks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NwModule, ItemDetailModule],
  host: {
    class: 'block bg-black rounded-md flex flex-col gap-2 overflow-hidden p-4',
    '[class.hidden]': 'isHidden()',
    '[class.screenshot-hidden]': 'isScreenshotHidden()',
  },
})
export class GearCellSlotSetPerksComponent {
  private db = injectNwData()
  public store = inject(GearsetStore)
  protected isHidden = computed(() => !this.rowCount())
  protected isScreenshotHidden = computed(() => !this.isAnyActive())

  protected resource = resource({
    params: () => {
      return this.store
        .resolvedSlots()
        .map((it) => it.instance?.itemId)
        .filter((it) => !!it)
    },
    loader: async ({ params }) => {
      return await Promise.all(
        params.map(async (itemId) => {
          const item = await this.db.itemsById(itemId)
          const setId = null // 'TestEquipmentSet_1' // getEquipmentSetId(item)
          const equipmentSet = await this.db.equipmentSetsById(setId)
          return {
            item,
            equipmentSet,
          }
        }),
      ).then(transformData)
    },
  })

  protected rows = computed(() => (this.resource.hasValue() ? this.resource.value() : []))
  protected rowCount = computed(() => this.rows().length)
  protected isAnyActive = computed(() => this.rows().some((it) => it.active))
}

export interface EquipmentSetRow {
  items: MasterItemDefinitions[]
  equipmentSet: EquipmentSet
  active: boolean
  max: number
}

function transformData(data: Array<{ item: MasterItemDefinitions; equipmentSet: EquipmentSet }>) {
  const result: EquipmentSetRow[] = []
  if (!data) {
    return result
  }
  for (const { item, equipmentSet } of data) {
    if (!equipmentSet || !item) {
      continue
    }
    const index = result.findIndex((it) =>
      eqCaseInsensitive(it.equipmentSet.EquipmentSetId, equipmentSet.EquipmentSetId),
    )
    if (index >= 0) {
      result[index].items.push(item)
    } else {
      result.push({
        items: [item],
        equipmentSet,
        active: false,
        max: Math.max(...equipmentSet.Perks.map((it) => it.PerkThreshold || 0)),
      })
    }
  }
  for (const it of result) {
    it.active = it.equipmentSet.Perks.some((perk) => it.items.length >= perk.PerkThreshold)
  }
  return result
}
