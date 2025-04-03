import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { RouterModule } from '@angular/router'
import { ItemRarity } from '@nw-data/common'

@Component({
  selector: 'nwb-item-header-content',
  templateUrl: './item-header-content.component.html',
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex-1 flex flex-col justify-between overflow-hidden',
  },
})
export class ItemHeaderContentComponent {
  public showSkeleton = input<boolean>()
  public isNamed = input<boolean>()
  public rarity = input<string>()
  public title = input<string>()
  public titleLink = input<string | any[]>()
  public text1 = input<string>()
  public text2 = input<string>()
  public text3 = input<string>()
}
