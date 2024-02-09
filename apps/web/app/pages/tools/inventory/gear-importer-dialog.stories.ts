import { Component, importProvidersFrom } from '@angular/core'
import { EquipSlotId } from '@nw-data/common'
import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { ModalService } from '~/ui/layout'
import { GearImporterDialogComponent } from './gear-importer-dialog.component'

@Component({
  standalone: true,
  template: `
    <button class="btn btn-primary" (click)="openDialog('head')">Scan Head</button>
    <button class="btn btn-primary" (click)="openDialog('chest')">Scan Chest</button>
    <button class="btn btn-primary" (click)="openDialog('hands')">Scan Hands</button>
    <button class="btn btn-primary" (click)="openDialog('legs')">Scan Legs</button>
    <button class="btn btn-primary" (click)="openDialog('feet')">Scan Feet</button>
  `,
  imports: [GearImporterDialogComponent],
  host: {
    class: 'flex flex-row flex-wrap gap-1',
  },
})
export class StoryComponent {
  public constructor(private modal: ModalService) {
    //
  }

  public openDialog(slotId: EquipSlotId) {
    GearImporterDialogComponent.open(this.modal, {
      inputs: { slotId },
    }).result$.subscribe((res) => {
      console.log(res)
    })
  }
}

export default {
  title: 'Pages / Tools / item-scanner',
  component: StoryComponent,
  tags: ['autodocs'],
  excludeStories: ['StoryComponent'],
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule)],
    }),
    moduleMetadata({
      imports: [StoryComponent],
    }),
  ],
} satisfies Meta

export const Example: StoryObj = {}
