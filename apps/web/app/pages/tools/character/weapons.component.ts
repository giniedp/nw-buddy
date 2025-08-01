import { ChangeDetectionStrategy, Component, computed, inject, resource } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { ChartConfiguration } from 'chart.js'
import { CharacterStore, injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { NwWeaponType, NwWeaponTypesService } from '~/nw/weapon-types'
import { LayoutModule } from '~/ui/layout'
import { WeaponLevelInputModule } from '~/ui/weapon-level-input'
import { ChartModule } from '../../../ui/chart'
import { SvgIconComponent } from '../../../ui/icons'
import { svgInfoCircle } from '../../../ui/icons/svg'

@Component({
  selector: 'nwb-weapons-page',
  templateUrl: './weapons.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, FormsModule, NwModule, WeaponLevelInputModule, LayoutModule, SvgIconComponent, ChartModule],
  host: {
    class: 'ion-page',
  },
})
export class WeaponsComponent {
  private weapons = inject(NwWeaponTypesService)
  private char = inject(CharacterStore)
  private db = injectNwData()

  protected infoIcon = svgInfoCircle
  protected categories = toSignal(this.weapons.categories$)
  protected resource = resource({
    loader: async (): Promise<ChartConfiguration> => {
      const data = await this.db.weaponMasteryAll()
      return {
        type: 'line',
        options: {
          animation: false,
          backgroundColor: '#FFF',
        },
        data: {
          labels: data.map((it) => it.Rank + 1),
          datasets: [
            {
              label: 'XP needed from previous level',
              data: data.map((it) => it.MaximumInfluence),
              backgroundColor: '#ffa600',
            },
          ],
        },
      }
    },
  })
  protected chartConfig = computed(() => (this.resource.hasValue() ? this.resource.value() : null))

  protected config = this.resource.value
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
