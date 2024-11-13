import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, signal } from '@angular/core'
import { AttributeType, getPerkBucketPerks, NW_ATTRIBUTE_TYPES, PerkBucket, PerkBucketEntry } from '@nw-data/common'
import { MasterItemDefinitions, PerkData } from '@nw-data/generated'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { apiResource } from '~/utils'
import { ItemDetailModule } from '../data/item-detail'

export interface AttributeCraftMod {
  item: MasterItemDefinitions
  isPure: boolean
  primaryAttribute: string
  secondaryAttribute: string
  name: string
  suffix: string
}

@Component({
  standalone: true,
  selector: 'nwb-attr-craft-mods-table',
  templateUrl: './attr-craft-mods-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemDetailModule],
  host: {
    class: 'd-block',
  },
})
export class AttributeCraftModsComponent {
  private db = injectNwData()
  protected attributes = signal(NW_ATTRIBUTE_TYPES)
  protected resource = apiResource({
    loader: async () => {
      return selectMods({
        attributes: NW_ATTRIBUTE_TYPES,
        items: await this.db.itemsAll().then(selectItems),
        perks: await this.db.perksByIdMap(),
        buckets: await this.db.perkBucketsByIdMap(),
      })
    },
  })
}

function selectItems(items: MasterItemDefinitions[]) {
  return items
    .filter((it) => it.IngredientCategories?.length > 1)
    .filter((it) => it.IngredientCategories.includes('PerkItem'))
}

function selectPerks(perks: PerkData[]) {
  return perks
    .filter((it) => it.ExclusiveLabels?.includes('Attribute'))
    .filter((it) => !!it.DisplayName)
    .filter((it) => it.PerkID.startsWith('PerkID_Stat_'))
}

function selectMods({
  attributes,
  items,
  buckets,
  perks,
}: {
  attributes: AttributeType[]
  items: MasterItemDefinitions[]
  buckets: Map<string, PerkBucket<PerkBucketEntry>>
  perks: Map<string, PerkData>
}) {
  return attributes.map((secondary) => {
    return attributes.map((primary): AttributeCraftMod => {
      const hasSecondary = primary.type !== secondary.type

      const item = items.find((it) => {
        if (it.IngredientCategories[1] !== `Attribute${primary.type.substring(0, 3)}`) {
          return false
        }
        if (hasSecondary && it.IngredientCategories[2] !== `Attribute${secondary.type.substring(0, 3)}`) {
          return false
        }
        return true
      })
      const suffix = getPerkBucketPerks(buckets.get(item.ItemID), perks).find((it) => it.AppliedSuffix)?.AppliedSuffix
      return {
        item: item,
        isPure: !hasSecondary,
        primaryAttribute: primary.shortName,
        secondaryAttribute: secondary.shortName,
        name: item.Name,
        suffix: suffix,
      }
    })
  })
}
