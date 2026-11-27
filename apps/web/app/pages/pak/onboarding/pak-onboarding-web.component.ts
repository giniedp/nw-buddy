import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core'
import { IconsModule } from '~/ui/icons'
import { svgDownload } from '~/ui/icons/svg'
import { OnboardingRetryComponent } from './onboarding-retry.component'
import { OnboardingStepComponent, type OnboardingStepState } from './onboarding-step.component'

const RELEASES_URL = 'https://github.com/giniedp/nw-buddy/releases'

/**
 * The steps in the browser: get and start nwbt, allow the connection, the page connects
 */
@Component({
  selector: 'nwb-pak-onboarding-web',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconsModule, OnboardingStepComponent, OnboardingRetryComponent],
  template: `
    <div class="onboarding" role="list">
      <nwb-onboarding-step label="Download">
        <p class="opacity-70">The latest New World Buddy release for Windows.</p>
        <a class="btn btn-sm btn-primary self-start" [href]="releasesUrl" target="_blank" rel="noopener">
          <nwb-icon [icon]="iconDownload" class="size-4" />
          GitHub releases
        </a>
      </nwb-onboarding-step>

      <nwb-onboarding-step label="Set the New World folder">
        <p class="opacity-70">
          Unpack the zip. Edit the <code>.env</code> file and set <code>NW_GAME</code> to your New World.
        </p>
      </nwb-onboarding-step>

      <nwb-onboarding-step label="Start the tools">
        <p class="opacity-70">
          Run <code>nw-buddy-tools.bat</code> and keep its window open. Or run <code>nw-buddy.exe</code>, the desktop
          app, which starts the tools by itself.
        </p>
      </nwb-onboarding-step>

      @switch (permission()) {
        @case ('prompt') {
          <nwb-onboarding-step label="Allow the connection" state="current">
            <p class="opacity-70">
              The browser asks whether this page may access apps and services on this device. Choose <b>Allow</b>.
            </p>
            <img
              class="rounded-box border border-base-300"
              src="assets/nwbt-allow-connection.png"
              alt="The browser prompt with the Allow button"
            />
          </nwb-onboarding-step>
        }
        @case ('denied') {
          <nwb-onboarding-step label="The connection is blocked" state="failed">
            <p class="opacity-70">
              Open the site settings with the icon left of the address, turn on <b>Apps on device</b>, then retry.
            </p>
            <img
              class="rounded-box border border-base-300"
              src="assets/nwbt-enable-connection.png"
              alt="The site settings with the Apps on device switch"
            />
          </nwb-onboarding-step>
        }
        @case ('granted') {
          <nwb-onboarding-step label="Connection allowed" state="done"></nwb-onboarding-step>
        }
      }

      <nwb-onboarding-step [label]="connecting() ? 'Connecting' : 'Waiting for nwbt'" [state]="connectState()">
        @if (connecting()) {
          <p class="opacity-70">
            Asking nwbt at <code>{{ nwbtUrl() }}</code>
          </p>
        } @else {
          <p class="opacity-70">
            No answer from <code>{{ nwbtUrl() }}</code> yet. The tools open as soon as nwbt answers.
          </p>
          <nwb-onboarding-retry [checking]="checking()" (retry)="retry.emit()" />
        }
      </nwb-onboarding-step>
    </div>
  `,
})
export class PakOnboardingWebComponent {
  /**
   * The address this page expects nwbt at
   */
  public readonly nwbtUrl = input.required<string>()
  /**
   * A health check is running
   */
  public readonly checking = input(false)
  /**
   * The browser's permission to reach nwbt on this device (local network access), null when the browser has none
   */
  public readonly permission = input<PermissionState | null>(null)
  /**
   * Asks nwbt again now
   */
  public readonly retry = output<void>()

  protected readonly releasesUrl = RELEASES_URL
  protected readonly iconDownload = svgDownload

  /**
   * nwbt did not answer at least once: the repeated checks keep showing that instead of flickering to "connecting"
   */
  private readonly offlineSeen = signal(false)
  protected readonly connecting = computed(() => this.checking() && !this.offlineSeen())
  protected readonly connectState = computed<OnboardingStepState>(() => (this.connecting() ? 'busy' : 'current'))

  public constructor() {
    effect(() => {
      if (!this.checking()) {
        this.offlineSeen.set(true)
      }
    })
  }
}
