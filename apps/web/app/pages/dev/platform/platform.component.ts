import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy } from '@angular/core'
import { NwModule } from '~/nw'
import { PlatformService } from '~/utils/services/platform.service'
import { ControlsGroup } from './types'

@Component({
  standalone: true,
  selector: 'nwb-platform',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule],
  host: {
    class: 'layout-content w-80 bg-base-300 rounded-md p-4',
  },
  template: `
    <div *ngFor="let group of groups">
      <h3>{{ group.label }}</h3>
      <div *ngFor="let control of group.controls">
        <div class="flex flex-row justify-between p-3">
          <div class="flex flex-col">
            <span>{{ control.label }}</span>
            <span *ngIf="control.description; let text">{{ text }}</span>
          </div>
          <span *ngIf="control.check === true" class="badge badge-success">{{ control.value ?? control.check }}</span>
          <span *ngIf="control.check === false" class="badge badge-error">{{ control.value ?? control.check }}</span>
          <span *ngIf="control.check == null">{{ control.value }}</span>
        </div>
      </div>
    </div>
  `,
})
export class PlatformComponent {
  protected groups: ControlsGroup[] = []

  public constructor(private platform: PlatformService) {
    this.groups.push({
      label: 'Platform',
      controls: [
        {
          label: 'Browser',
          check: this.platform.isBrowser,
        },
        {
          label: 'Electron',
          check: this.platform.isElectron,
        },
        {
          label: 'Overwolf',
          check: this.platform.isOverwolf,
        },
        {
          label: 'Iframe',
          check: this.platform.isIframe,
        },
        {
          label: 'Android',
          check: this.platform.isAndroid,
        },
        {
          label: 'iOS',
          check: this.platform.isIos,
        },
        {
          label: 'Webkit',
          check: this.platform.isWebkit,
        },
      ],
    })
    this.groups.push({
      label: 'Env',
      controls: [
        {
          label: 'Stage',
          value: this.platform.env.environment,
        },
        {
          label: 'Deploy URL',
          description: this.platform.env.deployUrl,
        },
        {
          label: 'NW Data URL',
          description: this.platform.env.nwDataUrl,
        },
        {
          label: 'NW Models URL',
          description: this.platform.env.modelsUrlMid,
        },
        {
          label: 'Standalone',
          check: this.platform.env.standalone,
        },
      ],
    })
    this.groups.push({
      label: 'Features',
      controls: [
        {
          label: 'Can Save File',
          check: !!window['showSaveFilePicker'],
        },
      ],
    })
  }
}
