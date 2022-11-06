import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'

@Component({
  standalone: true,
  selector: 'nwb-item-detail-header-backdrop',
  template: '<div *ngIf="animated"></div>',
  styleUrls: ['./item-detail-header-backdrop.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  host: {
    class: 'block',
    '[class.rarity-0]': 'rarity == 0',
    '[class.rarity-1]': 'rarity == 1',
    '[class.rarity-2]': 'rarity == 2',
    '[class.rarity-3]': 'rarity == 3',
    '[class.rarity-4]': 'rarity == 4',
  },
})
export class ItemDetailHeaderBackdropComponent {
  @Input()
  public rarity: number

  @Input()
  public animated: boolean
}
