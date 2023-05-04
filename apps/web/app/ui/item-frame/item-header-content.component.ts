import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { RouterModule } from '@angular/router'

@Component({
  standalone: true,
  selector: 'nwb-item-header-content,a[nwbItemHeaderContent]',
  templateUrl: './item-header-content.component.html',
  imports: [CommonModule, RouterModule],
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
  public nameLink: string | any[]

  @Input()
  public skeleton: boolean
}
