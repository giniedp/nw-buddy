import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { RouterModule } from '@angular/router'
import { PerkExplanation } from '@nw-data/common'
import { NwModule } from '~/nw'

@Component({
  selector: 'nwb-item-perk',
  template: `
    <a class="w-6 h-6 flex items-center justify-center relative flex-none" [nwLinkTooltip]="['perk', linkPerkId]">
      <img
        [nwImage]="icon"
        class="w-6 h-6 object-contain absolute top-0 left-0 transition-transform scale-100 hover:scale-125"
      />
      <span class="text-2xs relative text-xs">{{ iconText }}</span>
    </a>
    <a class="self-center text-sky-600" [routerLink]="['perk', linkPerkId] | nwLink" [class.link-hover]="!!linkPerkId">
      @if (explanation; as part) {
        <div>
          @if (part.label) {
            <b> {{ part.label | nwText }}{{ part.colon ? ':' : '' }} </b>
          }
          @if (part.description) {
            <span [innerHTML]="part.description | nwText: part.context | nwTextBreak"> </span>
          }
          <!-- <span *ngIf="row.suffix; let text">
            {{ text }}
          </span> -->
        </div>
      }
      <ng-content />
    </a>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, RouterModule],
  host: {
    class: 'flex flex-row gap-2 leading-tight',
  },
})
export class ItemPerkComponent {
  @Input()
  public icon: string

  @Input()
  public iconText: string

  @Input()
  public linkPerkId: string

  @Input()
  public explanation: PerkExplanation
}
