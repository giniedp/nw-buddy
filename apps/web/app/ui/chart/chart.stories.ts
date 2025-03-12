import { importProvidersFrom } from '@angular/core'
import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { FormsModule } from '@angular/forms'
import { ChartComponent } from './chart.component'
import { ChartModule } from './chart.module'
import { storyControls } from '~/test/story-utils'

export default {
  title: 'UI / nwb-chart',
  component: ChartComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule)],
    }),
    moduleMetadata({
      imports: [ChartModule, FormsModule],
    }),
  ],
} satisfies Meta

export const Example: StoryObj<ChartComponent> = {
  args: {
    config: {
      type: 'line',
      options: {
        responsive: true,
      },
      data: {
        labels: Array.from({ length: 7 }, (_, i) => `Day ${i + 1}`),
        datasets: [
          {
            label: 'Dataset',
            data: Array.from({ length: 7 }, () => Math.random() * 50),
            pointStyle: 'circle',
            pointRadius: 10,
            pointHoverRadius: 15,
          },
        ],
      },
    },
  },
}
