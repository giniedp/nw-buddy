import { CdkMenuModule } from '@angular/cdk/menu'
import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  inject,
  input,
  Output,
  signal,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { getPerkMultiplier, getPerkOnlyMultiplier } from '@nw-data/common'
import { sumBy } from 'lodash'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgEllipsis, svgInfoCircle, svgPlus } from '~/ui/icons/svg'
import { TabsModule } from '~/ui/tabs'
import { TooltipModule } from '~/ui/tooltip'
import { apiResource } from '~/utils'
import { CraftingBuffStore } from './crafting-buff.store'
import { CraftingBuffGroup } from './types'

@Component({
  selector: 'nwb-crafting-bonuses',
  templateUrl: './crafting-bonuses.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, IconsModule, TooltipModule, TabsModule, CdkMenuModule],
  host: {
    class: 'block bg-base-300 h-full',
  },
  animations: [],
})
export class CraftingChanceMenuComponent {
  protected store = inject(CraftingBuffStore)
  private db = injectNwData()

  public group = input<CraftingBuffGroup['group']>(null)

  protected isLoading = this.store.isLoading
  protected isLoaded = this.store.isLoaded
  protected iconInfo = svgInfoCircle
  protected iconAdd = svgPlus
  protected iconMore = svgEllipsis

  protected tradeskillsResource = apiResource({
    loader: () => this.db.tradeskillByIdMap(),
  })
  protected tradeskills = this.tradeskillsResource.value

  protected tabValue = signal<string>(null)
  protected tabsItems = computed(() => {
    return this.store
      .buffs()
      .filter((it) => it.group !== 'FactionControl')
      .map((it, i) => {
        const id = `${it.group}-${it.buffType}`
        let isActive = id === this.tabValue()
        if (!this.tabValue()) {
          if (this.group()) {
            isActive = it.group === this.group()
          } else {
            isActive = !i
          }
        }
        const isSkill = it.group !== 'FactionControl' && it.group !== 'TerritoryStanding'
        return {
          id,
          group: it.group,
          buffType: it.buffType,
          isPercent: it.buffType === 'exp' || it.buffType === 'yld',
          isSkill,
          isActive,
          bonus: this.store.sumBonus(it.group, it.buffType, true),
          bonusRaw: it.buffType === 'yld' ? this.store.sumBonus(it.group, it.buffType, false) : null,
          icon: this.getGroupIcon(it.group),
        }
      })
  })
  protected tab = computed(() => this.tabsItems().find((it) => it.isActive))

  protected sections = computed(() => {
    const tab = this.tabsItems().find((it) => it.isActive)
    if (!tab || !this.store.buffs()) {
      return null
    }
    return [
      // list all from current tradeskill
      this.store.buffs().find((it) => it.group === tab.group && it.buffType === tab.buffType),
      // add faction control buff, but only for the same buff type
      this.store.buffs().find((it) => it.group === 'FactionControl' && it.buffType === tab.buffType),
    ]
      .filter((it) => !!it)
      .map((group) => {
        const groupId = group.group
        const buffType = group.buffType
        return {
          skill: groupId,
          value: this.store.sumBonus(groupId, buffType, false),
          buffType: buffType,
          isPercent: buffType !== 'gs',
          isYield: buffType === 'yld',
          isExp: buffType === 'exp',
          items: group.items.map((category) => {
            return {
              name: category.name,
              stackMax: category.maxStack,
              stackSum: sumBy(category.items, (it) => this.store.getSetting(it.setting) || 0),
              valueSum: this.store.sumBonusCategories({
                group: groupId,
                type: buffType,
                items: [category],
                includeFaction: false,
              }),
              buffs: category.items.map((it) => {
                return {
                  ...it,
                  perkMultiplier: getPerkOnlyMultiplier(
                    { ScalingPerGearScore: it.scalingPerGS },
                    this.store.getSettingGS(it.setting),
                  ),
                }
              }),
              stacks: category.items
                .map((it) => {
                  return Array.from({ length: this.store.getSetting(it.setting) || 0 }).map(() => it)
                })
                .flat()
                .map((it) => {
                  return {
                    ...it,
                    perkMultiplier: getPerkOnlyMultiplier(
                      { ScalingPerGearScore: it.scalingPerGS },
                      this.store.getSettingGS(it.setting),
                    ),
                  }
                }),
            }
          }),
        }
      })
  })

  @Output()
  public stateChange = new EventEmitter()

  protected removeStack(setting: string) {
    const value = this.store.getSetting(setting)
    this.store.setSetting(setting, Math.max(0, value - 1))
  }

  protected addStack(setting: string) {
    const value = this.store.getSetting(setting)
    this.store.setSetting(setting, value + 1)
  }

  private getGroupIcon(group: CraftingBuffGroup['group']) {
    if (group === 'TerritoryStanding') {
      return 'assets/icons/territories/icon_territorystanding.png'
    }
    if (group === 'FactionControl') {
      return 'assets/icons/worldmap/icon_map_fort.png'
    }
    return this.tradeskills()?.get(group).Icon
  }
}
