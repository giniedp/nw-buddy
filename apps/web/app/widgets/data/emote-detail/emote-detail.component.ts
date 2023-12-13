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
import { EmotesDetailStore } from './emote-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-emote-detail',
  templateUrl: './emote-detail.component.html',
  exportAs: 'detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, PropertyGridModule, TooltipModule, IconsModule],
  providers: [DecimalPipe, EmotesDetailStore],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class EmoteDetailComponent {
  public readonly store = inject(EmotesDetailStore)

  @Input()
  public set emoteId(value: string) {
    this.store.patchState({ emoteId: value })
  }

  public title = toSignal(this.store.name$)
  public description = toSignal(this.store.description$)
  public icon = toSignal(this.store.icon$)
  public group = toSignal(this.store.group$)
  public properties = toSignal(this.store.properties$)
}
