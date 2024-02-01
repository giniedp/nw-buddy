import { Dialog, DialogRef } from '@angular/cdk/dialog'
import { Component, TemplateRef, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { RouterModule } from '@angular/router'
import { IconsModule } from '~/ui/icons'
import { svgSquareArrowUpRight } from '~/ui/icons/svg'
import { LootGraphComponent } from '~/widgets/loot/loot-graph.component'
import { ItemDetailStore } from './item-detail.store'

@Component({
  standalone: true,
  selector: `nwb-item-detail-loot-button`,
  template: `
    @if (salvage(); as info) {
      <button class="btn btn-xs flex-1 btn-outline btn-ghost rounded-md opacity-50" (click)="openDialog(tplDialog)">
        Show Loot Table
      </button>
      <a
        class="btn btn-xs flex-none btn-outline btn-ghost rounded-md opacity-50"
        [routerLink]="['/loot/table', salvage()?.tableId]"
      >
        <nwb-icon [icon]="iconLink" class="w-4 h-4"/>
      </a>

      <ng-template #tplDialog>
        <div class="bg-base-200 flex flex-col rounded-md h-full">
          <h3 class="bg-base-300 font-bold px-4 py-2">Loot Table</h3>
          <nwb-loot-graph
            class="flex-1 layout-content"
            [tableId]="info.tableId"
            [tags]="info.tags"
            [tagValues]="info.tagValues"
            [showLocked]="false"
          />
          <div class="flex flex-row justify-end p-2">
            <button class="btn btn-sm btn-primary" (click)="closeDialog()">Close</button>
          </div>
        </div>
      </ng-template>
    }
  `,
  imports: [RouterModule, IconsModule, LootGraphComponent],
  host: {
    '[class.hidden]': '!salvage()',
  },
})
export class ItemDetailLootButtonComponent {
  private store = inject(ItemDetailStore)
  private dialog = inject(Dialog)
  private dialogRef: DialogRef<any> = null

  protected salvage = toSignal(this.store.salvageInfo$)
  protected iconLink = svgSquareArrowUpRight

  protected openDialog(tpl: TemplateRef<any>) {
    this.closeDialog()
    this.dialogRef = this.dialog.open(tpl, {
      panelClass: ['w-full', 'h-full', 'max-w-4xl', 'layout-pad', 'shadow'],
    })
  }

  protected closeDialog() {
    this.dialogRef?.close()
  }
}
