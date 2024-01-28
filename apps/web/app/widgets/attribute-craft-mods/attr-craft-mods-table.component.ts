import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { AttributeType, NW_ATTRIBUTE_TYPES, PerkBucket, PerkBucketEntry, getItemIconPath, getPerkBucketPerks } from '@nw-data/common'
import { ItemDefinitionMaster, Perks } from '@nw-data/generated'
import { of, startWith } from 'rxjs'
import { NwModule } from '~/nw'
import { NwDataService } from '~/data'
import { selectStream } from '~/utils'
import { ItemDetailModule } from '../data/item-detail'

export interface AttributeCraftMod {
  item: ItemDefinitionMaster
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
  protected readonly attributes$ = of(NW_ATTRIBUTE_TYPES)
  protected readonly table$ = selectStream(
    {
      attributes: this.attributes$,
      items: selectStream(this.db.items, selectItems),
      perks: this.db.perksMap,
      buckets: this.db.perkBucketsMap,
    },
    selectMods
  )

  public constructor(private db: NwDataService) {
    //
  }
}

function selectItems(items: ItemDefinitionMaster[]) {
  return items
    .filter((it) => it.IngredientCategories?.length > 1)
    .filter((it) => it.IngredientCategories.includes('PerkItem'))
}

function selectPerks(perks: Perks[]) {
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
  items: ItemDefinitionMaster[]
  buckets: Map<string, PerkBucket<PerkBucketEntry>>
  perks: Map<string, Perks>
}) {
  return attributes.map((secondary) => {
    return attributes.map((primary): AttributeCraftMod => {
      const hasSecondary = primary.type !== secondary.type

      const item = items.find((it) => {
        if (it.IngredientCategories[1] !== `Attribute${primary.type.substring(0,3)}`) {
          return false
        }
        if (hasSecondary && it.IngredientCategories[2] !== `Attribute${secondary.type.substring(0,3)}`) {
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
        suffix: suffix
      }
    })
  })
}
