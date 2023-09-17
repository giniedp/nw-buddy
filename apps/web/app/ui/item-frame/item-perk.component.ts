import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { PerkExplanation } from '@nw-data/common'
import { NwModule } from '~/nw'

@Component({
  standalone: true,
  selector: 'nwb-item-perk',
  template: `
    <span class="w-8 h-8 flex items-center justify-center relative flex-none">
      <img [nwImage]="icon" class="w-8 h-8 object-contain absolute top-0 left-0" />
      <span class="text-2xs relative text-xs">{{ iconText }}</span>
    </span>
    <div class="self-center">
      <div *ngIf="explanation; let part">
        <b *ngIf="part.label; let text"> {{ text | nwText }}{{ part.colon ? ':' : '' }} </b>
        <span *ngIf="part.description; let text" [innerHTML]="text | nwText : part.context"> </span>
        <!-- <span *ngIf="row.suffix; let text">
          {{ text }}
        </span> -->
      </div>

      <ng-content></ng-content>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule],
  host: {
    class: 'flex flex-row gap-1 leading-tight',
  },
})
export class ItemPerkComponent {
  @Input()
  public icon: string

  @Input()
  public iconText: string

  @Input()
  public explanation: PerkExplanation

  protected trackByIndex = (i: number) => i

  public constructor() {
    //
  }
}
