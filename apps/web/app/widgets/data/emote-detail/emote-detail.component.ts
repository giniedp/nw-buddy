import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridModule } from '~/ui/property-grid'
import { TooltipModule } from '~/ui/tooltip'
import { EmotesDetailStore } from './emote-detail.store'

@Component({
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
    this.store.load({ emoteId: value })
  }

  public title = this.store.name
  public description = this.store.description
  public icon = this.store.icon
  public group = this.store.group
  public properties = this.store.properties
}
