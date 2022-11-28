import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'

@Component({
  standalone: true,
  selector: 'nwb-item-header-content',
  templateUrl: './item-header-content.component.html',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex-1 flex flex-col justify-between overflow-hidden',
  },
})
export class ItemHeaderContentComponent {
  @Input()
  public rarity: number

  @Input()
  public rarityName: string

  @Input()
  public typeName: string

  @Input()
  public sourceName: string

  @Input()
  public name: string

  @Input()
  public skeleton: boolean
}
