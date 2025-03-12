import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, effect, inject, input, untracked } from '@angular/core'
import { SpellData } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridModule, gridDescriptor } from '~/ui/property-grid'
import { linkCell, textCell, valueCell } from '~/ui/property-grid/cells'
import { diffButtonCell } from '~/widgets/diff-tool'
import { SpellDetailStore } from './spell-detail.store'

@Component({
  selector: 'nwb-spell-detail',
  templateUrl: './spell-detail.component.html',
  exportAs: 'detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, PropertyGridModule],
  providers: [DecimalPipe, SpellDetailStore],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class SpellDetailComponent {
  public store = inject(SpellDetailStore)
  public spellId = input<string>(null)
  #fxLoad = effect(() => {
    const spellId = this.spellId()
    untracked(() => this.store.load(spellId))
  })

  public descriptor = gridDescriptor<SpellData>(
    {
      SpellID: (value) => {
        return [
          textCell({
            value,
          }),
          diffButtonCell({ record: this.store.spell(), idKey: 'SpellID' }),
        ]
      },
      StatusEffects: (value) => {
        return value?.map((it) => {
          return linkCell({
            value: it,
            routerLink: ['status-effect', it],
          })
        })
      },
      StatusEffectsOnTargetBlockingThisSpell: (value) => {
        return value?.map((it) => {
          return linkCell({
            value: it,
            routerLink: ['status-effect', it],
          })
        })
      },
      AbilityId: (value) => {
        return linkCell({
          value,
          routerLink: ['ability', value],
        })
      },
    },
    (value) => valueCell({ value }),
  )
}
