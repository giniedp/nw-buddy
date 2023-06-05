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
  public title: string

  @Input()
  public titleLink: string | any[]

  @Input()
  public subTitle: string

  @Input()
  public category: string

  @Input()
  public subCategory: string

  @Input()
  public skeleton: boolean
}
