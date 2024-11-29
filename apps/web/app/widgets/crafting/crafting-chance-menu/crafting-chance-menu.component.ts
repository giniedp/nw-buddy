import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, EventEmitter, inject, Output, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { CraftingTradeskill } from '@nw-data/generated'
import { sumBy, union } from 'lodash'
import { CharacterStore } from '~/data'
import { NwModule } from '~/nw'
import { NwTradeskillService } from '~/nw/tradeskill'
import { IconsModule } from '~/ui/icons'
import { svgEllipsis, svgInfoCircle, svgPlus } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { CraftingBuffStore, CraftingBuffTarget } from './crafting-buff.store'
import { TabsModule } from '~/ui/tabs'
import { CdkMenuModule } from '@angular/cdk/menu'

const SKILLS_FOR_GS_BUFF: CraftingBuffTarget[] = [
  'Arcana',
  'Armoring',
  'Engineering',
  'Jewelcrafting',
  'Weaponsmithing',
]

const SKILLS_FOR_YIELD_BUFF: CraftingBuffTarget[] = [
  'Cooking',
  'Smelting',
  'Stonecutting',
  'Leatherworking',
  'Weaving',
  'Woodworking',
]

const SKILLS_FOR_STANDING_BUFF: CraftingBuffTarget[] = ['Standing']

function skillInfos(skill: CraftingBuffTarget) {
  const isGs = SKILLS_FOR_GS_BUFF.includes(skill)
  const isYield = SKILLS_FOR_YIELD_BUFF.includes(skill)
  const isStanding = SKILLS_FOR_STANDING_BUFF.includes(skill)
  const scale = isYield ? 1 / 100 : isStanding ? 100 : 1
  const unit = isGs ? ' GS' : '%'
  return { scale, unit }
}
@Component({
  standalone: true,
  selector: 'nwb-crafting-chance-menu',
  templateUrl: './crafting-chance-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, IconsModule, TooltipModule, TabsModule, CdkMenuModule],
  host: {
    class: 'block bg-base-300 h-full',
  },
})
export class CraftingChanceMenuComponent {
  private store = inject(CraftingBuffStore)
  private char = inject(CharacterStore)
  private skills = inject(NwTradeskillService)

  protected isLoading = this.store.isLoading
  protected isLoaded = this.store.isLoaded
  protected iconInfo = svgInfoCircle
  protected iconAdd = svgPlus
  protected iconMore = svgEllipsis

  protected tabValue = signal<CraftingBuffTarget>(null)
  protected tabsItems = computed(() => {
    return [...SKILLS_FOR_GS_BUFF, ...SKILLS_FOR_YIELD_BUFF, ...SKILLS_FOR_STANDING_BUFF].map((skill, i) => {
      const { scale, unit } = skillInfos(skill)
      return {
        value: skill,
        active: !this.tabValue() ? !i : this.tabValue() === skill,
        bonus: this.store.getBuffValue(skill),
        scale,
        unit,
      }
    })
  })

  protected section = computed(() => {
    const skill = this.tabsItems().find((it) => it.active)?.value
    if (!skill || !this.store.buffs()) {
      return null
    }
    const value = this.store.getBuffValue(skill)
    const groups = this.store.buffs()[skill] || []
    const stacks = this.store.stacks()[skill] || {}
    const { scale, unit } = skillInfos(skill)
    return {
      skill,
      value,
      unit,
      scale,
      groups: groups.map((group) => {
        return {
          name: group.name,
          stackMax: group.stack,
          stackSum: sumBy(group.buffs, (it) => stacks[it.effect] || 0),
          valueSum: sumBy(group.buffs, (it) => (stacks[it.effect] || 0) * it.value),
          buffs: group.buffs,
          stacks: group.buffs
            .map((it) => {
              return Array.from({ length: stacks[it.effect] || 0 }).map(() => it)
            })
            .flat(),
        }
      }),
    }
  })

  @Output()
  public stateChange = new EventEmitter()

  protected removeStack(skill: CraftingBuffTarget, effect: string) {
    const value = this.store.getBuffStacks(skill, effect)
    this.store.setBuffStacks(skill, effect, Math.max(0, value - 1))
  }

  protected addStack(skill: CraftingBuffTarget, effect: string) {
    const value = this.store.getBuffStacks(skill, effect)
    this.store.setBuffStacks(skill, effect, value + 1)
  }

  //protected slots = ARMOR_SLOT_IDS.map((id) => EQUIP_SLOTS.find((it) => it.id === id))
  // protected skills$ = this.skills.skills.pipe(mapFilter((it) => SKILLS_WITH_BONUS.includes(it.ID)))
  // protected flBonus$ = this.char.craftingFlBonus$
}
