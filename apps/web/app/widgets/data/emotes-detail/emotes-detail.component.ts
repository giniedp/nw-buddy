import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridModule } from '~/ui/property-grid'
import { TooltipModule } from '~/ui/tooltip'
import { StatusEffectCategoryDetailModule } from '../status-effect-category-detail'
import { StatusEffectDetailModule } from '../status-effect-detail'
import { EmotesDetailStore } from './emotes-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-emotes-detail',
  templateUrl: './emotes-detail.component.html',
  exportAs: 'detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    ItemFrameModule,
    PropertyGridModule,
    DecimalPipe,
    StatusEffectCategoryDetailModule,
    StatusEffectDetailModule,
    TooltipModule,
    IconsModule,
  ],
  providers: [DecimalPipe, EmotesDetailStore],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class EmotesDetailComponent {
  public readonly store = inject(EmotesDetailStore)

  @Input()
  public set emoteId(value: string) {
    this.store.patchState({ emoteId: value })
  }

  public name = toSignal(this.store.name$)
  public description = toSignal(this.store.description$)
  public icon = toSignal(this.store.icon$)
}
