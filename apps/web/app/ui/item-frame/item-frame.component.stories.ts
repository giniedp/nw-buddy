import { CommonModule } from '@angular/common'
import { Component, importProvidersFrom } from '@angular/core'
import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { ItemFrameModule } from './item-frame.module'

@Component({
  standalone: true,
  imports: [CommonModule, ItemFrameModule],
  template: `
    <nwb-item-frame class="font-nimbus">
      <nwb-item-header [rarity]="'epic'" class="p-1 flex flex-row gap-3">
        <nwb-item-icon [solid]="false" class="w-20"> </nwb-item-icon>
        <div class="flex flex-col justify-between">
          <div class="font-bold">Firevine Battlestaff</div>
          <div class="flex flex-col">
            <div>Legendary</div>
            <div>Fire Staff</div>
          </div>
        </div>
      </nwb-item-header>
      <div class="p-3 text-lg leading-snug">
        <!-- <div class="flex flex-row text-6xl leading-none">
          <nwb-item-gs [value]="605" [actual]="602"></nwb-item-gs>
        </div>
        <div>
          <nwb-item-stat label="1,050">Damage</nwb-item-stat>
          <nwb-item-stat label="4.0%">Critical Hit Chance</nwb-item-stat>
          <nwb-item-stat label="1.4">Critical Damage Multiplier</nwb-item-stat>
          <nwb-item-stat label="42.0">Block Stamina Damage</nwb-item-stat>
          <nwb-item-stat label="19%">Blocking Stability</nwb-item-stat>
        </div>
        <nwb-item-divider class="my-2"/>
        <div>
          <nwb-item-stat label="187">Slash Damage</nwb-item-stat>
        </div> -->
        <div class="nw-item-section">Foo</div>
        <div class="nw-item-section hidden">Bar</div>
        <div class="nw-item-section">Baz</div>

        <!-- <nwb-item-divider class="my-2"/> -->
      </div>
    </nwb-item-frame>
  `,
})
export class StoryComponent {}

export default {
  title: 'UI / nwb-item-frame',
  component: StoryComponent,
  excludeStories: ['StoryComponent'],
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule)],
    }),
    moduleMetadata({
      imports: [ItemFrameModule],
    }),
  ],
} satisfies Meta

export const Example: StoryObj = {}
