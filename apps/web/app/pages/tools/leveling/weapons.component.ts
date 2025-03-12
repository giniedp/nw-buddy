import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { CharacterStore } from '~/data'
import { NwModule } from '~/nw'
import { NwWeaponType, NwWeaponTypesService } from '~/nw/weapon-types'
import { WeaponLevelInputModule } from '~/ui/weapon-level-input'
import { WeaponChartComponent } from './weapon-chart.component'

@Component({
  selector: 'nwb-weapons-page',
  templateUrl: './weapons.component.html',
  styleUrls: ['./weapons.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule, NwModule, WeaponLevelInputModule, WeaponChartComponent],
  host: {
    class: 'block layout-pad',
  },
})
export class WeaponsComponent {
  private weapons = inject(NwWeaponTypesService)
  private char = inject(CharacterStore)

  protected categories$ = this.weapons.categories$
  protected trackBy = (i: number) => i

  public constructor() {}

  protected getValue(type: NwWeaponType) {
    return this.char.getWeaponLevel(type.ProgressionId)
  }

  protected getWeaponId(type: NwWeaponType) {
    return type.WeaponTag.toLowerCase()
  }

  protected updateWeapon(type: NwWeaponType, level: number) {
    this.char.setWeaponLevel(type.ProgressionId, level)
  }
}
