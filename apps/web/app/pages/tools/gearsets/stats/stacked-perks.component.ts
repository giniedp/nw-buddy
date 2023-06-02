import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ElementRef, Renderer2 } from '@angular/core'
import { groupBy, sum } from 'lodash'
import { combineLatest, map, tap } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { Mannequin } from '~/nw/mannequin'
import { getItemGsBonus, getPerkMultiplier } from '@nw-data/common'
import { TooltipModule } from '~/ui/tooltip'

@Component({
  standalone: true,
  selector: 'nwb-stacked-perks',
  templateUrl: './stacked-perks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule],
  host: {
    class: 'block hidden',
  },
})
export class StackedPerksComponent {
  protected trackBy = (i: number) => i
  protected vm$ = combineLatest({
    perks: this.mannequin.activePerks$,
    effects: this.db.statusEffectsMap,
    abilities: this.db.abilitiesMap,
  }).pipe(
    map(({ perks, effects, abilities }) => {
      return perks.filter(({ perk, affix }) => {
        if (!perk.ScalingPerGearScore) {
          return false
        }
        if (perk.EquipAbility?.some((it) => abilities.get(it)?.IsStackableAbility)) {
          return true
        }
        const effect = effects.get(affix?.StatusEffect)
        if (effect && effect.StackMax !== 1) {
          return true
        }
        return false
      })
    }),
    map((data) => {
      return Array.from(Object.values(groupBy(data, (it) => it.perk.PerkID)))
        .map((group) => {
          const perk = group[0].perk
          const multiplier = group.map(({ gearScore, perk, item }) => {
            return getPerkMultiplier(perk, gearScore + getItemGsBonus(perk, item))
          })
          return {
            id: perk.PerkID,
            icon: perk.IconPath,
            count: group.length,
            multiplier: sum(multiplier),
            description: perk.Description,
            name: perk.DisplayName,
          }
        })
        //.filter((it) => it.count > 1)
    }),
    tap((it) => {
      if (it?.length) {
        this.renderer.removeClass(this.elRef.nativeElement, 'hidden')
      } else {
        this.renderer.addClass(this.elRef.nativeElement, 'hidden')
      }
    })
  )

  public constructor(
    private mannequin: Mannequin,
    private db: NwDbService,
    private elRef: ElementRef<HTMLElement>,
    private renderer: Renderer2
  ) {
    //
  }
}
