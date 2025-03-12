import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core'
import { EQUIP_SLOTS, EquipSlot, EquipSlotId } from '@nw-data/common'
import { NwModule } from '~/nw'
import { LayoutModule, ModalOpenOptions, ModalRef, ModalService } from '~/ui/layout'

@Component({
  selector: 'nwb-slots-picker',
  template: `
    <ion-header>
      <ion-toolbar class="ion-color ion-color-black rounded-t-md">
        <ion-title>{{ title }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-p-4">
      <div class="flex-1 flex flex-col">
        <ng-container *ngFor="let group of groups; let isFirst = first">
          <div class="divider" *ngIf="!isFirst">OR</div>
          <div class="grid grid-cols-fill-3xs gap-1">
            <button
              *ngFor="let slot of group"
              class="btn flex flex-row gap-1 justify-start"
              [class.btn-ghost]="!isSelected(slot)"
              [class.btn-primary]="isSelected(slot)"
              (click)="toggle(slot)"
            >
              <img [nwImage]="slot.iconSlot" class="w-6 h-6" />
              <span>{{ slot.name | nwText | nwNoHtml }}</span>
            </button>
          </div>
        </ng-container>
      </div>
    </ion-content>
    <ion-footer class="rounded-b-md">
      <ion-toolbar class="ion-color ion-color-base-300">
        <div slot="end" class="join px-1 w-full">
          <button slot="secondary" class="join-item flex-1 btn btn-ghost" (click)="cancel()">
            {{ negative || 'Cancel' }}
          </button>
          <button slot="primary" class="join-item flex-1 btn btn-ghost text-primary" (click)="close()">
            {{ positive || 'OK' }}
          </button>
        </div>
      </ion-toolbar>
    </ion-footer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, LayoutModule],
  host: {
    class: 'ion-page bg-base-100 border border-base-100 rounded-md',
  },
})
export class SlotsPickerComponent implements OnChanges {
  public static open(modal: ModalService, options: ModalOpenOptions<SlotsPickerComponent>) {
    options.size ??= ['y-auto', 'x-sm']
    options.content = SlotsPickerComponent
    return modal.open<SlotsPickerComponent, EquipSlotId[]>(options)
  }

  @Input()
  public title: string

  @Input()
  public positive: string

  @Input()
  public negative: string

  @Input()
  public neutral: string

  @Input()
  public selection: EquipSlotId[]

  @Input()
  public slots1: EquipSlotId[]

  @Input()
  public slots2: EquipSlotId[]

  @Input()
  public slots3: EquipSlotId[]

  @Input()
  public groups: EquipSlot[][]

  public constructor(private dialog: ModalRef<EquipSlotId[] | null>) {
    //
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.groups = [
      this.slots1.map((it) => EQUIP_SLOTS.find((slot) => slot.id === it)),
      this.slots2?.map((it) => EQUIP_SLOTS.find((slot) => slot.id === it)),
      this.slots3?.map((it) => EQUIP_SLOTS.find((slot) => slot.id === it)),
    ].filter((it) => it?.length)
  }

  public cancel() {
    this.dialog.close()
  }

  public close() {
    this.dialog.close(this.selection)
  }

  protected isSelected(slot: EquipSlot) {
    return this.selection?.includes(slot.id)
  }

  protected toggle(slot: EquipSlot) {
    if (this.isSelected(slot)) {
      this.selection = this.selection.filter((it) => it !== slot.id)
      return
    }

    if (!this.selection?.length) {
      this.selection = [slot.id]
      return
    }

    for (const group of this.groups) {
      if (!group || !group.includes(slot)) {
        continue
      }
      if (group.some((it) => this.isSelected(it))) {
        this.selection = [...this.selection, slot.id]
      } else {
        this.selection = [slot.id]
      }
    }
  }
}
