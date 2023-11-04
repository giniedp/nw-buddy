import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { EQUIP_SLOTS, EquipSlotId } from '@nw-data/common'
import { Subject, combineLatest, debounceTime, map, switchMap, takeUntil } from 'rxjs'
import { CharacterStore } from '~/data'
import { NwModule } from '~/nw'
import { NwTradeskillService } from '~/nw/tradeskill'
import { IconsModule } from '~/ui/icons'
import { svgInfo, svgInfoCircle } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { CaseInsensitiveSet, mapFilter } from '~/utils'

const ARMOR_SLOT_IDS: EquipSlotId[] = ['head', 'chest', 'hands', 'legs', 'feet']
const SKILLS_WITH_BONUS = ['Arcana', 'Cooking', 'Smelting', 'Woodworking', 'Leatherworking', 'Weaving', 'Stonecutting']
@Component({
  standalone: true,
  selector: 'nwb-crafting-chance-menu',
  templateUrl: './crafting-chance-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, IconsModule, TooltipModule],
  host: {
    class: 'layout-content',
  },
})
export class CraftingChanceMenuComponent implements OnInit, OnDestroy {
  @Output()
  public stateChange = new EventEmitter()

  protected trackBy = (i: number) => i
  protected slots = ARMOR_SLOT_IDS.map((id) => EQUIP_SLOTS.find((it) => it.id === id))
  protected skills$ = this.skills.skills.pipe(mapFilter((it) => SKILLS_WITH_BONUS.includes(it.ID)))
  protected flBonus$ = this.char.craftingFlBonus$
  protected iconInfo = svgInfoCircle

  protected rows$ = this.skills$.pipe(
    switchMap((skills) => {
      return combineLatest(
        skills.map((skill) => {
          return combineLatest({
            level: this.char.selectTradeSkillLevel(skill.ID),
            gear: this.char.selectTradeSet(skill.ID),
            bonus: this.char.selectCustomYieldBonus(skill.ID),
          }).pipe(
            map(({ level, gear, bonus }) => {
              return {
                skill: skill,
                level: level,
                bonus: bonus,
                gear: new CaseInsensitiveSet(gear),
              }
            })
          )
        })
      )
    })
  )

  private destroy$ = new Subject<void>()

  public constructor(private char: CharacterStore, private skills: NwTradeskillService) {
    //
  }

  public ngOnInit(): void {
    this.char.current$.pipe(debounceTime(100)).pipe(takeUntil(this.destroy$)).subscribe(this.stateChange)
  }

  public ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  protected toggleSkillSlot(skill: string, slot: string) {
    this.char.toggleSkillSlot({
      skill: skill,
      slot: slot,
    })
  }

  protected updateSkillLevel(skill: string, level: number) {
    this.char.updateSkillLevel({
      skill: skill,
      level: level,
    })
  }

  protected updateSkillBonus(skill: string, value: number) {
    this.char.updateSkillBonus({
      skill: skill,
      value: value,
    })
  }


  protected updateFlBonus(value: boolean) {
    this.char.updateFlBonus({
      value: value,
    })
  }
}
