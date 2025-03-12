import { Component, input } from '@angular/core'
import { LayoutModule, ModalService } from '~/ui/layout'
import { CraftingChanceMenuComponent } from './crafting-bonuses.component'

@Component({
  selector: 'crafting-bonuses-modal',
  template: `
    <ion-header class="bg-base-300">
      <ion-toolbar>
        <ion-title>Crafting bonuses</ion-title>
        <button slot="end" class="btn btn-sm btn-circle btn-neutral mr-2" [nwbModalClose]>&times;</button>
      </ion-toolbar>
    </ion-header>
    <ion-content class="bg-base-200">
      <nwb-crafting-bonuses [group]="group()" />
    </ion-content>
  `,
  imports: [LayoutModule, CraftingChanceMenuComponent],
  host: {
    class: 'ion-page',
  },
})
export class CraftingBonusesModalComponent {
  public static open(modal: ModalService, group: string) {
    modal.open({
      content: CraftingBonusesModalComponent,
      inputs: {
        group: group as any,
      },
    })
  }
  public group = input<any>()
}
