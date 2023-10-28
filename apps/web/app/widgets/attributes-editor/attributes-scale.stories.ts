import { importProvidersFrom } from '@angular/core'
import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { AttributesEditorComponent } from './attributes-editor.component'
import { AttributesEditorModule } from './attributes-editor.module'
import { storyControls } from '~/test/story-utils'
import { NW_MAX_CHARACTER_LEVEL, NW_MAX_GEAR_SCORE } from '@nw-data/common'
import { AttributesScaleComponent } from './attributes-scale.component'

export default {
  title: 'Widgets / nwb-attributes-scale',
  component: AttributesScaleComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule)],
    }),
    moduleMetadata({
      imports: [AttributesEditorModule],
    }),
  ],
  ...storyControls<AttributesScaleComponent>((arg) => {
    arg.select('weaponRef', {
      defaultValue: '',
      options: [
        'SwordT5',
        'FlailT5',
        'RapierT5',
        'HatchetT5',
        '2HAxeT5',
        '2hGreatSwordT5',
        '2HhammerT5',
        'SpearT5',
        'BowT5',
        'MusketT5',
        'BlunderbussT5',
        'FireStaffT5',
        'LifeStaffT5',
        '1hElementalGauntlet_IceT5',
        'VoidGauntletT5',
      ],
    })
    arg.number('gearScore', {
      min: 100,
      max: NW_MAX_GEAR_SCORE,
      defaultValue: NW_MAX_GEAR_SCORE,
    })
    arg.number('attrStr', {
      min: 0,
      max: 500,
      defaultValue: 0,
    })
    arg.number('attrDex', {
      min: 0,
      max: 500,
      defaultValue: 0,
    })
    arg.number('attrInt', {
      min: 0,
      max: 500,
      defaultValue: 0,
    })
    arg.number('attrFoc', {
      min: 0,
      max: 500,
      defaultValue: 0,
    })
  }),
} satisfies Meta<AttributesScaleComponent>

export const Example: StoryObj<AttributesScaleComponent> = {}
