import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { combineLatest, debounce, debounceTime, map, Subject, switchMap, takeUntil } from 'rxjs'
import { CharacterStore } from '~/data'
import { NwModule } from '~/nw'
import { NwTradeskillService } from '~/nw/nw-tradeskill.service'
import { EquipSlotId, EQUIP_SLOTS } from '~/nw/utils'
import { IconsModule } from '~/ui/icons'
import { CaseInsensitiveSet } from '~/utils'

const ARMOR_SLOT_IDS: EquipSlotId[] = ['head', 'chest', 'hands', 'legs', 'feet']

@Component({
  standalone: true,
  selector: 'nwb-crafting-chance-menu',
  templateUrl: './crafting-chance-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, IconsModule],
  host: {
    class: 'layout-content',
  },
})
export class CraftingChanceMenuComponent implements OnInit, OnDestroy {
  @Output()
  public stateChange = new EventEmitter()

  protected trackBy = (i: number) => i
  protected slots = ARMOR_SLOT_IDS.map((id) => EQUIP_SLOTS.find((it) => it.id === id))
  protected skills$ = this.skills.skillsByCategory('Refining')
  protected flBonus$ = this.char.craftingFlBonus$

  protected rows$ = this.skills$.pipe(
    switchMap((skills) => {
      return combineLatest(
        skills.map((skill) => {
          return combineLatest({
            level: this.char.selectTradeSkillLevel(skill.ID),
            gear: this.char.selectTradeSet(skill.ID),
          }).pipe(
            map(({ level, gear }) => {
              return {
                skill: skill,
                level: level,
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
    this.char.current$
      .pipe(debounceTime(100))
      .pipe(takeUntil(this.destroy$))
      .subscribe(this.stateChange)
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

  protected updateFlBonus(value: boolean) {
    this.char.updateFlBonus({
      value: value,
    })
  }
}
