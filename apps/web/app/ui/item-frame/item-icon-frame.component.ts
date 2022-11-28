import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy, Input } from '@angular/core'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { NwModule } from '~/nw'

@Component({
  standalone: true,
  selector: 'nwb-item-icon,a[nwbItemIcon]',
  template: `
    <picture class="aspect-square" *ngIf="icon">
      <img [nwImage]="icon" class="w-full h-full object-contain"/>
    </picture>
    <ng-content></ng-content>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule],
  host: {
    class: 'block nw-item-icon-frame aspect-square relative',
    '[class.nw-item-rarity-1]': 'rarity === 1',
    '[class.nw-item-rarity-2]': 'rarity === 2',
    '[class.nw-item-rarity-3]': 'rarity === 3',
    '[class.nw-item-rarity-4]': 'rarity === 4',
    '[class.nw-item-icon-bg]': 'solid',
    '[class.nw-item-icon-mask]': '!solid'
  },
})
export class ItemIconFrameComponent {

  @Input()
  public rarity: number

  @Input()
  public solid: boolean

  @Input('nwbItemIcon')
  public icon: string | ItemDefinitionMaster | Housingitems

  public constructor() {
    //
  }
}
