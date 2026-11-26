import { ChangeDetectionStrategy, Component } from '@angular/core'
import { IconsModule } from '~/ui/icons'
import { svgDownload } from '~/ui/icons/svg'

const NWBT_RELEASES_URL = 'https://github.com/giniedp/nw-buddy/releases'

@Component({
  selector: 'nwb-nwbt-setup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconsModule],
  host: {
    class: 'flex flex-col gap-6',
  },
  template: `
    <ol class="flex flex-col gap-3">
      <li class="flex gap-4 rounded-box border border-base-300 bg-base-100 p-4">
        <span class="size-8 shrink-0 rounded-full bg-primary text-primary-content grid place-items-center font-bold">
          1
        </span>
        <div class="flex flex-col gap-2 min-w-0">
          <b>Download</b>
          <span class="opacity-70">The latest New World Buddy release for Windows.</span>
          <a class="btn btn-sm btn-primary self-start" [href]="releasesUrl" target="_blank" rel="noopener">
            <nwb-icon [icon]="iconDownload" class="size-4" />
            GitHub releases
          </a>
        </div>
      </li>
      <li class="flex gap-4 rounded-box border border-base-300 bg-base-100 p-4">
        <span class="size-8 shrink-0 rounded-full bg-primary text-primary-content grid place-items-center font-bold">
          2
        </span>
        <div class="flex flex-col gap-2 min-w-0">
          <b>Start</b>
          <span class="opacity-70"> Unpack the downloaded zip and follow the instructions in the README.md </span>
        </div>
      </li>
    </ol>
  `,
})
export class NwbtSetupComponent {
  protected readonly releasesUrl = NWBT_RELEASES_URL
  protected readonly iconDownload = svgDownload
}
