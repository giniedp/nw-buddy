import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { RouterModule } from '@angular/router'
import { PerkExplanation } from '@nw-data/common'
import { NwModule } from '~/nw'

@Component({
  selector: 'nwb-item-perk',
  template: `
    <a class="w-6 h-6 flex items-center justify-center relative flex-none group" [nwLinkTooltip]="['perk', linkPerkId()]">
      <div class="grid">
        @if (socket()) {
          <img
            [nwImage]="'assets/icons/item/frame_gemsocket.png'"
            class="w-6 h-6 object-contain absolute top-0 left-0 transition-transform scale-125 group-hover:scale-150 col-start-1 row-start-1"
          />
        }
        @if (!empty()) {
          <img
            [nwImage]="icon()"
            class="w-6 h-6 object-contain absolute top-0 left-0 transition-transform scale-100 group-hover:scale-125 col-start-1 row-start-1"
          />
        }
      </div>
      <span class="text-2xs relative text-xs">{{ iconText() }}</span>
    </a>
    <a
      class="self-center text-sky-600"
      [routerLink]="['perk', linkPerkId()] | nwLink"
      [class.link-hover]="!!linkPerkId()"
    >
      @if (explanation(); as part) {
        <div>
          @if (part.label) {
            <b> {{ part.label | nwText }}{{ part.colon ? ':' : '' }} </b>
          }
          @if (part.description) {
            <span [innerHTML]="part.description | nwText: part.context | nwTextBreak"> </span>
          }
        </div>
      }
      <ng-content />
    </a>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, RouterModule],
  host: {
    class: 'flex flex-row flex-nowrap gap-2 leading-tight',
  },
})
export class ItemPerkComponent {
  public icon = input<string>()
  public iconText = input<string>()
  public linkPerkId = input<string>()
  public explanation = input<PerkExplanation>()
  public socket = input<boolean>()
  public empty = input<boolean>()
}
