import { DialogModule } from '@angular/cdk/dialog'
import { CommonModule, DecimalPipe, PercentPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, TemplateRef, ViewChild } from '@angular/core'
import { Ability, Affixstats, Perks } from '@nw-data/types'
import { sortBy } from 'lodash'
import { combineLatest, defer, map, Observable, of, switchMap } from 'rxjs'
import { GearsetStore, ItemInstance, ItemInstancesDB } from '~/data'
import { NwDamagetypeService, NwDbService, NwModule } from '~/nw'
import {
  EquipSlotId,
  EQUIP_SLOTS,
  getAffixABSs,
  getAffixDMGs,
  getAffixMODs,
  getArmorRatingElemental,
  getArmorRatingPhysical,
  getItemMaxGearScore,
  getItemPerkBucketKeys,
  getItemPerkKeys,
  getPerkMultiplier,
  stripAbilityProperties,
  stripAffixProperties,
  totalGearScore,
} from '~/nw/utils'
import { PropertyGridModule } from '~/ui/property-grid'

interface PerkDetailInfo {
  perk: Perks
  count: number
  scale: number
  abilities: Array<Partial<Ability>>
  affix: Partial<Affixstats>
  maybeStackable?: boolean
  isWeapon: boolean
  isArmor: boolean
  isJewelery: boolean
  isShield: boolean
}

@Component({
  standalone: true,
  selector: 'nwb-gearset-stats',
  templateUrl: './gearset-stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, PropertyGridModule, DialogModule],
  providers: [PercentPipe, DecimalPipe],
  host: {
    class: 'block bg-base-100 rounded-md flex flex-col relative',
  },
})
export class GearsetStatsComponent {
  protected data$ = defer(() => this.resolvePerks())

  @ViewChild('tplSummary')
  protected tplSummary: TemplateRef<any>

  protected valueFormatter = (value: any, key?: string) => {
    if (typeof value !== 'number') {
      return value
    }
    return this.decimal.transform(value, '0.0-4')
  }

  public constructor(
    private db: NwDbService,
    private decimal: DecimalPipe,
    private damage: NwDamagetypeService,
    private store: GearsetStore,
    private itemsDb: ItemInstancesDB
  ) {
    //
  }

  protected damageIcon(type: string) {
    return this.damage.damageTypeIdIcon(type)
  }

  protected getPerkMultiplier(info: PerkDetailInfo) {
    if (info.maybeStackable) {
      return info.count * info.scale
    }
    return info.scale
  }

  private resolvePerks() {
    const sots$ = this.store.gearsetSlots$.pipe(
      switchMap((slots) => {
        const result: Record<string, Observable<ItemInstance>> = {}
        Object.entries(slots || {}).forEach(([key, value]) => {
          if (typeof value !== 'string') {
            result[key] = of(value)
          } else {
            result[key] = this.itemsDb.live((t) => t.get(value))
          }
        })
        return combineLatest(result)
      })
    )

    return combineLatest({
      slots: sots$,
      itemsMap: this.db.itemsMap,
      perksMap: this.db.perksMap,
      affixMap: this.db.affixstatsMap,
      abilityMap: this.db.abilitiesMap,
      armorsMap: this.db.armorsMap,
      weaponsMap: this.db.weaponsMap,
    }).pipe(
      map(({ slots, itemsMap, perksMap, affixMap, abilityMap, armorsMap, weaponsMap }) => {
        let weight = 0
        let ratingElemental = 0
        let ratingPhysical = 0
        const infos: Record<string, PerkDetailInfo> = {}
        const gsSlots: Array<{ id: EquipSlotId; gearScore: number }> = []

        const entries = Object.entries(slots).filter(([slotId]) => {
          return EQUIP_SLOTS.some((it) => it.id === slotId)
        })
        for (const [slotId, slot] of entries) {
          const item = itemsMap.get(slot?.itemId)
          if (!item) {
            continue
          }
          console.log(item)

          const gearScore = slot.gearScore || getItemMaxGearScore(item)
          gsSlots.push({
            id: slotId as EquipSlotId,
            gearScore: gearScore,
          })

          const weapon = weaponsMap.get(item.ItemStatsRef)
          const armor = armorsMap.get(item.ItemStatsRef)

          if (armor) {
            weight += armor.WeightOverride || item.Weight || 0
            ratingElemental += getArmorRatingElemental(armor, gearScore) || 0
            ratingPhysical += getArmorRatingPhysical(armor, gearScore) || 0
          } else if (weapon) {
            ratingElemental += getArmorRatingElemental(weapon, gearScore) || 0
            ratingPhysical += getArmorRatingPhysical(weapon, gearScore) || 0
          }

          const fixedPerks = getItemPerkKeys(item)
            .map((key) => perksMap.get(slot?.perks?.[key] || item[key]))
            .filter((it) => !!it)
          const addedPerks = (getItemPerkBucketKeys(item) || [])
            .map((key) => perksMap.get(slot?.perks?.[key]))
            .filter((it) => !!it)
          for (const perk of [...fixedPerks, ...addedPerks]) {
            if (infos[perk.PerkID]) {
              infos[perk.PerkID].count += 1
              continue
            }
            const affix = affixMap.get(perk.Affix)
            const abilities = perk.EquipAbility?.map((id) => abilityMap.get(id))?.map(stripAbilityProperties)
            infos[perk.PerkID] = {
              count: 1,
              perk: perk,
              scale: getPerkMultiplier(perk, gearScore),
              affix: affix ? stripAffixProperties(affix) : null,
              abilities: abilities,
              maybeStackable: abilities?.some((it) => it.IsStackableAbility),
              isWeapon: !!weapon,
              isArmor: !!armor || perk?.ItemClass?.includes('Armor'),
              isJewelery:
                perk?.ItemClass?.includes('EquippableAmulet') ||
                perk?.ItemClass?.includes('EquippableToken') ||
                perk?.ItemClass?.includes('EquippableRing'),
              isShield:
                perk?.ItemClass?.includes('Shield') ||
                perk?.ItemClass?.includes('RoundShield') ||
                perk?.ItemClass?.includes('KiteShield') ||
                perk?.ItemClass?.includes('TowerShield'),
            }
          }
        }
        const perks = Object.values(infos)
        const summary = this.collectStats(perks)

        summary.unshift({
          key: 'armor-rating-physical',
          label: 'Armor Rating - Physical',
          value: ratingPhysical,
          percent: 0,
        })
        summary.unshift({
          key: 'armor-rating-elemetnal',
          label: 'Armor Rating - Elemental',
          value: ratingElemental,
          percent: 0,
        })
        return {
          perks: perks,
          stackable: perks.filter((it) => it.maybeStackable),
          summary: summary,
          gearScore: totalGearScore(gsSlots),
          weight,
        }
      })
    )
  }

  private collectStats(data: PerkDetailInfo[]) {
    const stats: Record<
      string,
      { key: string; label: string[] | string; value: number; percent: number; icon?: string }
    > = {}
    for (const perk of data) {
      for (const mod of getAffixMODs(perk.affix, perk.scale)) {
        stats[mod.key] = stats[mod.key] || { key: mod.key, label: [mod.label], value: 0, percent: 0 }
        stats[mod.key].value += Number(mod.value) * perk.count
      }
      if (perk.isArmor || perk.isJewelery || perk.isShield) {
        for (const mod of getAffixABSs(perk.affix, perk.scale)) {
          console.log()
          stats[mod.key] = stats[mod.key] || { key: mod.key, label: mod.label, value: 0, percent: 0 }
          stats[mod.key].percent += Number(mod.value) * perk.count
          stats[mod.key].icon = this.damageIcon(mod.key.replace('ABS', ''))
        }
        for (const mod of getAffixDMGs(perk.affix, perk.scale)) {
          stats[mod.key] = stats[mod.key] || { key: mod.key, label: mod.label, value: 0, percent: 0 }
          stats[mod.key].percent += Number(mod.value) * perk.count
          stats[mod.key].icon = this.damageIcon(mod.key.replace('DMG', ''))
        }
      }
    }
    return sortBy(Object.values(stats), (it) => it.key)
  }
}
