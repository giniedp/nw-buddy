import { CdkMenuModule } from '@angular/cdk/menu'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { patchState } from '@ngrx/signals'
import { Damagetable } from '@nw-data/generated'
import { combineLatest, map } from 'rxjs'
import { NwModule } from '~/nw'
import { CombatMode, Mannequin } from '~/nw/mannequin'
import { NW_WEAPON_TYPES, damageTypeIcon } from '~/nw/weapon-types'
import { IconsModule } from '~/ui/icons'
import { svgBurst, svgPeopleGroup } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { humanize, mapProp } from '~/utils'

@Component({
  standalone: true,
  selector: 'nwb-gear-cell-weapon',
  templateUrl: './gear-cell-weapon.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, CdkMenuModule, FormsModule, IconsModule, TooltipModule],
  host: {
    class: 'layout-content',
  },
})
export class GearCellWeaponComponent {
  private mannequin = inject(Mannequin)
  protected combatModeOptions: Array<{ label: string; value: CombatMode }> = [
    {
      label: 'PvE',
      value: 'pve',
    },
    {
      label: 'PvP Arena',
      value: 'pvpArena',
    },
    {
      label: 'PvP Openworld',
      value: 'pvpOpenworld',
    },
    {
      label: 'PvP War',
      value: 'pvpWar',
    },
    {
      label: 'PvP Outpostrush',
      value: 'pvpOutpostrush',
    },
  ]

  protected vm$ = combineLatest({
    weapon: toObservable(this.mannequin.activeWeapon),
    weaponTag: toObservable(this.mannequin.activeWeapon).pipe(mapProp('weaponTag')),
    weaponUnsheathed: toObservable(this.mannequin.activeWeapon).pipe(mapProp('unsheathed')),
    ammoType: toObservable(this.mannequin.activeWeapon).pipe(map((it) => it.ammo?.AmmoType)),
    attackOptions: toObservable(this.mannequin.activeWeaponAttacks),
    attackSelection: toObservable(this.mannequin.activeDamageTableRow),
    attackName: toObservable(this.mannequin.activeDamageTableRow).pipe(map((it) => humanize(it?.DamageID))),
    combatMode: toObservable(this.mannequin.combatMode),
    numAroundMe: toObservable(this.mannequin.numAroundMe),
    numHits: toObservable(this.mannequin.numHits),
    // isSplit: toObservable(this.mannequin.statDamageBase).pipe(
    //   map((it) => !!it.Result.weapon.std && !!it.Result.converted.std),
    // ),
    // DmgMain: toObservable(this.mannequin.statDamageBase).pipe(
    //   map((it) => {
    //     if (!it.Result.weapon.std) {
    //       return null
    //     }
    //     return {
    //       icon: damageTypeIcon(it.DamageType),
    //       standard: Math.floor(it.Result.weapon.std),
    //       crit: Math.floor(it.Result.weapon.crit),
    //     }
    //   }),
    // ),
    // DmgElem: toObservable(this.mannequin.statDamageBase).pipe(
    //   map((it) => {
    //     if (!it.Result.converted.std) {
    //       return null
    //     }
    //     return {
    //       icon: damageTypeIcon(it.ConvertType),
    //       standard: Math.floor(it.Result.converted.std),
    //       crit: Math.floor(it.Result.converted.crit),
    //     }
    //   }),
    // ),
  })

  protected iconGroup = svgPeopleGroup
  protected iconBurst = svgBurst

  protected async toggleWeapon() {
    const state = this.mannequin.state()
    patchState(this.mannequin.state, {
      weaponActive: state.weaponActive === 'secondary' ? 'primary' : 'secondary',
    })
  }

  protected async toggleSheathed() {
    const state = this.mannequin.state()
    patchState(this.mannequin.state, {
      weaponUnsheathed: !state.weaponUnsheathed,
    })
  }

  protected async commitAttack(row: Damagetable) {
    patchState(this.mannequin.state, {
      selectedAttack: row?.DamageID,
    })
  }

  protected async commitNumAroundMe(value: number) {
    patchState(this.mannequin.state, {
      numAroundMe: value,
    })
  }

  protected async commitNumHits(value: number) {
    patchState(this.mannequin.state, {
      numHits: value,
    })
  }

  protected async commitCombatMode(value: CombatMode) {
    patchState(this.mannequin.state, {
      combatMode: value,
    })
  }

  protected labelForAttack(attack: Damagetable, weaponTag: string) {
    const prefix = NW_WEAPON_TYPES.find((it) => it.WeaponTag === weaponTag)?.DamageTablePrefix
    return attack.DamageID.replace(prefix || '', '')
  }

  protected damageIcon(type: string) {
    return damageTypeIcon(type)
  }
}
