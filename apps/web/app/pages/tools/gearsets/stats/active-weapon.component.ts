import { CdkMenuModule } from '@angular/cdk/menu'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Damagetable } from '@nw-data/generated'
import { combineLatest, firstValueFrom, map } from 'rxjs'
import { NwModule } from '~/nw'
import { NwDataService } from '~/data'
import { CombatMode, Mannequin } from '~/nw/mannequin'
import { NW_WEAPON_TYPES, damageTypeIcon } from '~/nw/weapon-types'
import { IconsModule } from '~/ui/icons'
import { svgBurst, svgPeopleGroup } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { humanize, mapProp } from '~/utils'

@Component({
  standalone: true,
  selector: 'nwb-active-weapon',
  templateUrl: './active-weapon.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, CdkMenuModule, FormsModule, IconsModule, TooltipModule],
  host: {
    class: 'layout-content',
  },
})
export class ActiveWeaponComponent {
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
    weapon: this.mannequin.activeWeapon$,
    weaponTag: this.mannequin.activeWeapon$.pipe(mapProp('weaponTag')),
    weaponUnsheathed: this.mannequin.activeWeapon$.pipe(mapProp('unsheathed')),
    ammoType: this.mannequin.activeWeapon$.pipe(map((it) => it.ammo?.AmmoType)),
    attackOptions: this.mannequin.activeWeaponAttacks$,
    attackSelection: this.mannequin.activeDamageTableRow$,
    attackName: this.mannequin.activeDamageTableRow$.pipe(map((it) => humanize(it?.DamageID))),
    combatMode: this.mannequin.combatMode$,
    numAroundMe: this.mannequin.numAroundMe$,
    numHits: this.mannequin.numHits$,
    isSplit: this.mannequin.statDamageBase$.pipe(map((it) => !!it.Result.weapon.std && !!it.Result.converted.std)),
    DmgMain: this.mannequin.statDamageBase$.pipe(
      map((it) => {
        if (!it.Result.weapon.std) {
          return null
        }
        return {
          icon: damageTypeIcon(it.DamageType),
          standard: Math.floor(it.Result.weapon.std),
          crit: Math.floor(it.Result.weapon.crit),
        }
      }),
    ),
    DmgElem: this.mannequin.statDamageBase$.pipe(
      map((it) => {
        if (!it.Result.converted.std) {
          return null
        }
        return {
          icon: damageTypeIcon(it.ConvertType),
          standard: Math.floor(it.Result.converted.std),
          crit: Math.floor(it.Result.converted.crit),
        }
      }),
    ),
  })

  protected iconGroup = svgPeopleGroup
  protected iconBurst = svgBurst

  protected async toggleWeapon() {
    const state = await firstValueFrom(this.mannequin.state$)
    this.mannequin.patchState({
      weaponActive: state.weaponActive === 'secondary' ? 'primary' : 'secondary',
    })
  }

  protected async toggleSheathed() {
    const state = this.mannequin.state()
    this.mannequin.patchState({
      weaponUnsheathed: !state.weaponUnsheathed,
    })
  }

  protected async commitAttack(row: Damagetable) {
    this.mannequin.patchState({
      selectedAttack: row?.DamageID,
    })
  }

  protected async commitNumAroundMe(value: number) {
    this.mannequin.patchState({
      numAroundMe: value,
    })
  }

  protected async commitNumHits(value: number) {
    this.mannequin.patchState({
      numHits: value,
    })
  }

  protected async commitCombatMode(value: CombatMode) {
    this.mannequin.patchState({
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
