import { DIALOG_DATA, Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core'
import { EQUIP_SLOTS, EquipSlot, EquipSlotId } from '@nw-data/common'
import { NwModule } from '~/nw'

export interface SlotsPickerOptions {
  title?: string
  positive?: string
  negative?: string
  neutral?: string

  slots1: EquipSlotId[]
  slots2?: EquipSlotId[]
  slots3?: EquipSlotId[]
  selection: EquipSlotId[]
}

@Component({
  standalone: true,
  selector: 'nwb-slots-picker',
  template: `
    <h3 class="flex-none font-bold text-lg bg-black p-3">{{ title }}</h3>
    <div class="flex-1 flex flex-col p-4 overflow-auto">
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
    <div class="flex-none modal-action flex-row-reverse justify-start layout-pad gap-1">
      <button class="btn btn-primary" (click)="close()">{{ positive || 'OK' }}</button>
      <button class="btn btn-ghost" (click)="cancel()">{{ negative || 'Cancel' }}</button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule],
  host: {
    class: 'flex flex-col bg-base-100 border border-base-100 rounded-md overflow-hidden',
  },
})
export class SlotsPickerComponent {
  public static open(
    dialog: Dialog,
    config: DialogConfig<SlotsPickerOptions, DialogRef<EquipSlotId[], SlotsPickerComponent>>
  ) {
    return dialog.open(SlotsPickerComponent, {
      maxWidth: 400,
      panelClass: ['w-full', 'layout-pad', 'self-end', 'sm:self-center', 'shadow'],
      ...config,
    })
  }

  protected get title() {
    return this.data.title
  }

  protected get positive() {
    return this.data.positive
  }

  protected get negative() {
    return this.data.negative
  }

  protected get neutral() {
    return this.data.neutral
  }

  protected selection: EquipSlotId[]
  protected groups: EquipSlot[][]

  public constructor(
    @Inject(DIALOG_DATA)
    private data: SlotsPickerOptions,
    private dialog: DialogRef<EquipSlotId[] | null>
  ) {
    this.selection = data.selection
    this.groups = [
      data.slots1.map((it) => EQUIP_SLOTS.find((slot) => slot.id === it)),
      data.slots2?.map((it) => EQUIP_SLOTS.find((slot) => slot.id === it)),
      data.slots3?.map((it) => EQUIP_SLOTS.find((slot) => slot.id === it)),
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
