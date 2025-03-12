import { Component, importProvidersFrom } from '@angular/core'
import { Meta, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { storyControls } from '~/test/story-utils'
import { NavbarComponent } from './navbar.component'
import { NavbarModule } from './navbar.module'
import { CommonModule } from '@angular/common'

@Component({
  standalone: true,
  template: `
    <nwb-navbar>
      <ng-container *nwbNavbarMenu="let ctx">
        <li>
          <a> Link 1 {{ ctx.isHorizontal ? 'Text' : '' }}</a>
        </li>
        <li>
          <a> Link 2 {{ ctx.isHorizontal ? 'Text' : '' }}</a>
        </li>
        <li>
          <a> Link 3 {{ ctx.isHorizontal ? 'Text' : '' }}</a>
        </li>
      </ng-container>
      <ng-container *nwbNavbarButtons="let ctx">
        <li>
          <span>Button</span>
        </li>
      </ng-container>
    </nwb-navbar>
  `,
  imports: [CommonModule, NavbarModule],
})
export class StoryComponent {}
export default {
  title: 'UI / nwb-navbar',
  component: StoryComponent,
  excludeStories: ['StoryComponent'],
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule)],
    }),
    moduleMetadata({
      imports: [StoryComponent],
    }),
  ],
} satisfies Meta

export const Example = {}
