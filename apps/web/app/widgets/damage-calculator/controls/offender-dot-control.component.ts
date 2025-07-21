import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { patchState } from '@ngrx/signals'
import { DamageType } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { damageTypeIcon } from '~/nw/weapon-types'
import { IconsModule } from '~/ui/icons'
import { svgEllipsisVertical, svgInfo } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { DamageCalculatorStore, offenderAccessor } from '../damage-calculator.store'
import { PrecisionInputComponent } from './precision-input.component'

@Component({
  selector: 'nwb-offender-dot-control',
  templateUrl: './offender-dot-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, IconsModule, LayoutModule, TooltipModule, PrecisionInputComponent],
  host: {
    class: 'fieldset',
  },
})
export class OffenderDotControlComponent {
  protected store = inject(DamageCalculatorStore)
  protected iconMore = svgEllipsisVertical
  protected iconInfo = svgInfo
  protected dotType = offenderAccessor(this.store, 'dotDamageType')
  protected dotPercent = offenderAccessor(this.store, 'dotDamagePercent')
  protected dotPotency = offenderAccessor(this.store, 'dotDamagePotency')
  protected dotDuration = offenderAccessor(this.store, 'dotDamageDuration')
  protected dotRate = offenderAccessor(this.store, 'dotDamageRate')
  protected dotCoef = computed(() => this.store.offenderDotCoef())

  protected get dotDimmed() {
    return !this.dotType.value
  }

  protected dotTypeOptions = computed(() => {
    const options: Array<{ icon: string; label: string; value: DamageType }> = [
      { icon: null, label: 'None', value: null },
    ]
    const types: DamageType[] = [
      'Acid',
      'Arcane',
      'Corruption',
      'Fire',
      'Ice',
      'Lightning',
      'Nature',
      'Siege',
      'Slash',
      'Standard',
      'Strike',
      'Thrust',
      // 'Void',
    ]
    for (const type of types) {
      options.push({
        icon: damageTypeIcon(type),
        label: type,
        value: type,
      })
    }
    return options
  })

  protected submitDotType(value: string) {
    patchState(this.store, (state) => {
      return {
        ...state,
        offender: {
          ...state.offender,
          dotDamageType: value,
        },
      }
    })
  }
}
