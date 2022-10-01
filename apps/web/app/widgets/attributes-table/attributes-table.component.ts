import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core'
import { combineLatest, defer, map, of } from 'rxjs'
import { NwDbService } from '~/nw'
import { getAffixStats, getPerkAffixStat, getPerkbucketPerks } from '~/nw/utils'

const ATTRIBUTES = [
  { attribute: 'AttributeStr', name: 'Strength' },
  { attribute: 'AttributeDex', name: 'Dexterity' },
  { attribute: 'AttributeInt', name: 'Intelligence' },
  { attribute: 'AttributeFoc', name: 'Focus' },
  { attribute: 'AttributeCon', name: 'Constitution' },
]

@Component({
  selector: 'nwb-attributes-table',
  templateUrl: './attributes-table.component.html',
  styleUrls: ['./attributes-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributesTableComponent implements OnInit {
  public attributes = ATTRIBUTES
  public table = defer(() => combineLatest({
    items: this.items,
    buckets: this.db.perkBucketsMap,
    perks: this.db.perksMap
  })).pipe(
    map(({ items, buckets, perks }) => {
      return ATTRIBUTES.map((primary) => {
        return ATTRIBUTES.map((secondary) => {
          const hasSecondary = primary.name !== secondary.name

          const item = items.find((it) => {
            if (it.IngredientCategories[1] !== primary.attribute) {
              return false
            }
            if (hasSecondary && it.IngredientCategories[2] !== secondary.attribute) {
              return false
            }
            return true
          })
          return {
            // primary,
            // secondary: hasSecondary ? secondary : null,
            item,
            suffix: getPerkbucketPerks(buckets.get(item.ItemID), perks).find((it) => it.AppliedSuffix)?.AppliedSuffix
          }
        })
      })
    })
  )

  private items = defer(() => this.db.items)
    .pipe(map((list) => {
      return list
        .filter((it) => it.IngredientCategories?.length > 1)
        .filter((it) => it.IngredientCategories.includes('PerkItem'))
    }))

  private perks = defer(() => this.db.perks).pipe(
    map((list) => {
      return list
        .filter((it) => it.ExclusiveLabels?.includes('Attribute'))
        .filter((it) => !!it.DisplayName)
        .filter((it) => it.PerkID.startsWith('PerkID_Stat_'))
    })
  )

  private perksWithAffix = defer(() =>
    combineLatest({
      perks: this.perks,
      affix: this.db.affixStatsMap,
    })
  ).pipe(
    map(({ perks, affix }) => {
      return perks.map((perk) => {
        return {
          perk,
          affix: affix.get(perk.Affix),
        }
      })
    })
  )

  public constructor(private db: NwDbService) {}

  public ngOnInit(): void {}
}
