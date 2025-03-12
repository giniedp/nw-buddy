import { importProvidersFrom } from '@angular/core'
import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { CraftingCalculatorComponent } from './crafting-calculator.component'
import { storyControls } from '~/test/story-utils'
import { NW_MAX_CHARACTER_LEVEL } from '@nw-data/common'

export default {
  title: 'Widgets / nwb-crafting-calculator',
  component: CraftingCalculatorComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule)],
    }),
    moduleMetadata({
      imports: [CraftingCalculatorComponent],
    }),
  ],
  ...storyControls<CraftingCalculatorComponent>((arg) => {
    arg.select('recipeId', {
      defaultValue: 'IngotT51',
      options: ['IngotT51', 'Artifact_Set1_HeavyHead'],
    })
  }),
} satisfies Meta<CraftingCalculatorComponent>

export const Example: StoryObj<CraftingCalculatorComponent> = {}
