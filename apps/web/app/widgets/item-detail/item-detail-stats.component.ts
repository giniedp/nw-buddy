import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, EventEmitter, Output, ViewChild } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ItemDefinitionMaster, ItemdefinitionsArmor, ItemdefinitionsRunes, ItemdefinitionsWeapons } from '@nw-data/types'
import { combineLatest, map, of } from 'rxjs'
import { NwModule } from '~/nw'
import { getArmorRatingElemental, getArmorRatingPhysical } from '~/nw/utils'
import { ItemDetailService } from './item-detail.service'
import { CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay'

export interface ItemStat {
  item: ItemDefinitionMaster
  label: string
  value: string | number
}

@Component({
  standalone: true,
  selector: 'nwb-item-detail-stats',
  exportAs: 'itemDetailStats',
  templateUrl: 'item-detail-stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, OverlayModule],
  host: {
    class: 'block p-3',
  },
})
export class ItemDetailStatsComponent {
  @Input()
  public gsEditable: boolean = false

  @Output()
  public gsChange = new EventEmitter<number>()

  @Output()
  public gearScoreEdit = new EventEmitter<MouseEvent>()

  @Input()
  public gearScoreEditable: boolean = false

  @ViewChild(CdkOverlayOrigin)
  public gearScoreOverlayOrigin: CdkOverlayOrigin

  protected gsLabel$ = this.detail.itemGSLabel$

  protected stats$ = combineLatest({
    item: this.detail.item$,
    weapon: this.detail.weaponStats$,
    armor: this.detail.armorStats$,
    rune: this.detail.runeStats$,
    gearScore: this.detail.itemGS$
  }).pipe(
    map(({ item, weapon, rune, armor, gearScore }) => {
      return [...this.getWeponStats(item, weapon || rune, gearScore), ...this.getArmorStats(item, armor, gearScore)]
    })
  )
  public constructor(protected detail: ItemDetailService) {
    //
  }

  protected onGearScoreEdit(e: MouseEvent) {
    if (this.gearScoreEditable) {
      this.gearScoreEdit.emit(e)
    }
  }

  protected getWeponStats(item: ItemDefinitionMaster, stats: ItemdefinitionsWeapons | ItemdefinitionsRunes, score: number) {
    const result: ItemStat[] = []
    if (stats?.BaseDamage != null) {
      result.push({
        item,
        label: 'Base Damage',
        value: stats.BaseDamage,
      })
    }
    if (stats?.CritChance != null) {
      result.push({
        item,
        label: 'Critical Hit Chance',
        value: toPercent(stats.CritChance),
      })
    }
    if (stats?.CritDamageMultiplier != null) {
      result.push({
        item,
        label: 'Critical Damage Multiplier',
        value: stats.CritDamageMultiplier.toFixed(1),
      })
    }
    if (stats?.BlockStaminaDamage != null) {
      result.push({
        item,
        label: 'Block Stamina Damage',
        value: stats.BlockStaminaDamage.toFixed(1),
      })
    }
    if (stats?.BaseStaggerDamage != null) {
      result.push({
        item,
        label: 'Base Stagger Damage',
        value: stats.BaseStaggerDamage.toFixed(1),
      })
    }
    if (stats && 'ElementalArmorSetScaleFactor' in stats) {
      if (stats?.ElementalArmorSetScaleFactor != null && !!stats?.ArmorRatingScaleFactor) {
        result.push({
          item,
          label: 'Armor Rating - Elemental',
          value: getArmorRatingElemental(stats, score).toFixed(1),
        })
      }
    }
    if (stats && 'PhysicalArmorSetScaleFactor' in stats) {
      if (stats?.PhysicalArmorSetScaleFactor != null && !!stats?.ArmorRatingScaleFactor) {
        result.push({
          item,
          label: 'Armor Rating - Physical',
          value: getArmorRatingPhysical(stats, score).toFixed(1),
        })
      }
    }
    if (stats?.BlockStability != null) {
      result.push({
        item,
        label: 'Blocking Stability',
        value: `${stats.BlockStability}%`,
      })
    }
    return result
  }

  protected getArmorStats(item: ItemDefinitionMaster, stats: ItemdefinitionsArmor, score: number) {
    const result: ItemStat[] = []
    if (stats?.ElementalArmorSetScaleFactor != null && !!stats?.ArmorRatingScaleFactor) {
      result.push({
        item,
        label: 'Armor Rating - Elemental',
        value: getArmorRatingElemental(stats, score).toFixed(1),
      })
    }
    if (stats?.PhysicalArmorSetScaleFactor != null && !!stats?.ArmorRatingScaleFactor) {
      result.push({
        item,
        label: 'Armor Rating - Physical',
        value: getArmorRatingPhysical(stats, score).toFixed(1),
      })
    }
    return result
  }
}

function toPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}
