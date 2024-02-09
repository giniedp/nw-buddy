import { Component, importProvidersFrom } from '@angular/core'
import { NW_MAX_CHARACTER_LEVEL } from '@nw-data/common'
import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { ModalService } from '~/ui/layout'
import { AttributeEditorDialogComponent } from './attributes-editor-dialog.component'
import { AttributesEditorModule } from './attributes-editor.module'

@Component({
  standalone: true,
  template: ` <button class="btn btn-primary" (click)="openDialog()">Open Dialog</button> `,
  imports: [AttributesEditorModule],
})
export class StoryComponent {
  public constructor(private modal: ModalService) {
    //
  }

  public openDialog() {
    AttributeEditorDialogComponent.open(this.modal, {
      inputs: {
        level: NW_MAX_CHARACTER_LEVEL,
        magnify: [],
        assigned: {
          con: 0,
          dex: 0,
          foc: 0,
          int: 0,
          str: 0,
        },
        base: {
          con: 0,
          dex: 0,
          foc: 0,
          int: 0,
          str: 0,
        },
        buffs: {
          con: 0,
          dex: 0,
          foc: 0,
          int: 0,
          str: 0,
        },
      },
    }).result$.subscribe((res) => {
      console.log(res)
    })
  }
}

export default {
  title: 'Widgets / nwb-attributes-editor-dialog',
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
