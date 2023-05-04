import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
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
    class: 'block'
  },
})
export class ItemDetailDescriptionComponent {

  @Input()
  public innerClass: string

  protected vm$ = this.detail.description$

  public constructor(protected detail: ItemDetailStore) {

  }
}
