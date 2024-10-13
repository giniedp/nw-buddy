import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core'
import { NwModule } from '~/nw'
import { ItemDetailStore } from './item-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-item-detail-description',
  templateUrl: './item-detail-description.component.html',
  styleUrls: ['./item-detail-description.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule],
  host: {
    class: 'block',
  },
})
export class ItemDetailDescriptionComponent {
  protected store = inject(ItemDetailStore)

  @Input()
  public innerClass: string

  protected vm$ = this.store.description$
}
