import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { map } from 'rxjs'
import { CharacterStore } from '~/data/character.store'
import { NwModule } from '~/nw'
import { NwWeaponType, NwWeaponTypesService } from '~/nw/weapon-types'
import { WeaponLevelInputModule } from '~/ui/weapon-level-input'
import { WeaponChartComponent } from './weapon-chart.component'

@Component({
  standalone: true,
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

  protected categories$ = this.weapons.categories$
  protected trackBy = (i: number) => i

  public constructor(private weapons: NwWeaponTypesService, private char: CharacterStore) {

  }

  protected getValue(type: NwWeaponType) {
    return this.char.selectWeaponLevel(type.WeaponTag)
  }

  protected getWeaponId(type: NwWeaponType) {
    return type.WeaponTag.toLowerCase()
  }

  protected updateWeapon(type: NwWeaponType, level: number) {
    const id = this.getWeaponId(type)
    this.char.updateWeaponLevel({ weapon: id, level: level })
  }
}
