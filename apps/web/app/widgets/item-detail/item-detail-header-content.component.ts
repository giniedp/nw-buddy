import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, Input } from "@angular/core";

@Component({
  standalone: true,
  selector: 'nwb-item-detail-header-content',
  templateUrl: './item-detail-header-content.component.html',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex-1 flex flex-col justify-between overflow-hidden'
  }
})
export class ItemDetailHeaderContentComponent {

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
}
