import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core'
import { ItemDefinitionMaster, Perks } from '@nw-data/types'
import { groupBy, sortBy } from 'lodash'
import { combineLatest, filter, map, Subject, takeUntil } from 'rxjs'
import { NwService } from '~/core/nw'

const PERK_PREFIX = 'PerkID_Armor_'

export interface PerkItemSet {
  perkId: string
  name: string
  icon: string
  items: FamilyItemSet[]
}

export interface FamilyItemSet {
  family: string
  items: TierItemSet[]
}

export interface TierItemSet {
  tier: number
  items: ItemClassItemSet[]
}

export interface ItemClassItemSet {
  itemClass: string
  items: ItemDefinitionMaster[]
}

export interface ItemSet {
  perkId: string
  family: string
  tier: number
  weight: string
  items: ItemDefinitionMaster[]
}

@Component({
  selector: 'nwb-sets',
  templateUrl: './sets.component.html',
  styleUrls: ['./sets.component.scss'],
})
export class SetsComponent implements OnInit, OnDestroy {

  public itemSets: PerkItemSet[]

  private destroy$ = new Subject()

  public constructor(private nw: NwService, private cdRef: ChangeDetectorRef) {}

  public ngOnInit(): void {
    combineLatest([this.nw.db.items, this.nw.db.perksMap])
      .pipe(map(([items, perks]) => {
        return this.findSets(items, perks)
      }))
      .pipe(takeUntil(this.destroy$))
      .subscribe((sets) => {
        this.itemSets = sets
        this.cdRef.markForCheck()
      })
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }


  public iconPath(path: string) {
    return this.nw.iconPath(path)
  }

  public itemName(item: ItemDefinitionMaster) {
    return this.nw.translate(item.Name)
  }

  public itemRarity(item: ItemDefinitionMaster) {
    return this.nw.itemRarity(item)
  }

  private findSets(items: ItemDefinitionMaster[], perks: Map<string, Perks>) {
  items = items
    .filter((it) => it['$source'] === 'loot' && it.ItemType === 'Armor')
    .filter((it) => {
      return (
        it.Perk1?.startsWith(PERK_PREFIX) ||
        it.Perk2?.startsWith(PERK_PREFIX) ||
        it.Perk3?.startsWith(PERK_PREFIX) ||
        it.Perk4?.startsWith(PERK_PREFIX) ||
        it.Perk5?.startsWith(PERK_PREFIX)
      )
    })

  return Object.entries(groupByPerkPrefix(items, PERK_PREFIX)).map(([perkId, items]): PerkItemSet => {
    const perk = perks.get(perkId)
    return {
      perkId: perkId,
      icon: perk?.IconPath,
      name: this.nw.translate(perk?.DisplayName) || perkId,
      items: Object.entries(groupByFamily(items)).map(([family, items]): FamilyItemSet => {
        return {
          family,
          items: Object.entries(groupByTier(items)).map(([tier, items]): TierItemSet => {
            return {
              tier: tier as any as number,
              items: Object.entries(groupByItemClass(items)).map(([itemClass, items]): ItemClassItemSet => {
                return {
                  itemClass: itemClass,
                  items: items,
                }
              }),
            }
          }),
        }
      }),
    }
  })
}
}


function groupByPerk(items: ItemDefinitionMaster[], mapper: (perks: string[]) => string) {
  return groupBy(items, (it) => {
    return mapper([it.Perk1, it.Perk2, it.Perk3, it.Perk4, it.Perk5].filter((it) => !!it))
  })
}

function groupByPerkPrefix(items: ItemDefinitionMaster[], prefix: string) {
  return groupByPerk(items, (perks) => {
    return perks.find((it) => it.startsWith(prefix))
  })
}

function groupBySamePerks(items: ItemDefinitionMaster[]) {
  return groupByPerk(items, (perks) => perks.sort().join('-'))
}

function groupByTier(items: ItemDefinitionMaster[]) {
  return groupBy(items, (it) => it.Tier)
}

function groupByFamily(items: ItemDefinitionMaster[]) {
  return groupBy(items, (it) => it.ItemID.replace(/(Head|Chest|Hands|Legs|Feet|Heavy|Light|Medium|_)/gi, ''))
}

function groupByItemClass(items: ItemDefinitionMaster[]) {
  return groupBy(items, (it) => {
    return it.ItemClass?.split('+')?.find((token) => token === 'Medium' || token === 'Light' || token === 'Heavy')
  })
}
