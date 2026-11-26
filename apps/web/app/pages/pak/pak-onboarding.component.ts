import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core'
import { IconsModule } from '~/ui/icons'
import { svgCubes, svgFolderOpen, svgRotate } from '~/ui/icons/svg'
import { NwbtSetupComponent } from '~/widgets/nwbt-setup'

/**
 * Shown by the pak page while nwbt does not answer: how to get and start nwbt. The page keeps asking, the tools open
 * as soon as nwbt answers. In the desktop app, which starts nwbt itself, only the status and the game folder.
 */
@Component({
  selector: 'nwb-pak-onboarding',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconsModule, NwbtSetupComponent],
  host: {
    class: 'block overflow-y-auto',
  },
  template: `
    <div class="min-h-full flex items-center justify-center p-4 md:p-8">
      <div class="w-full max-w-xl flex flex-col gap-6">
        <header class="flex flex-col items-center text-center gap-3">
          <h1 class="text-3xl font-bold">NW Buddy Tools</h1>
          <p class="opacity-70">Levels, game files and datasheets of your New World installation.</p>
        </header>

        <div class="flex items-center gap-3 rounded-box border border-base-300 bg-base-100 px-4 py-3" role="status">
          @switch (status()) {
            @case ('error') {
              <span class="status status-error"></span>
              <span class="flex-1 min-w-0">Loading failed: {{ error() }}</span>
            }
            @case ('connecting') {
              <span class="loading loading-spinner loading-sm text-primary"></span>
              <span class="flex-1 min-w-0"
                >Connecting to <code class="px-1 rounded bg-base-300 text-sm">{{ nwbtUrl() }}</code></span
              >
            }
            @case ('starting') {
              <span class="loading loading-spinner loading-sm text-primary"></span>
              <span class="flex-1 min-w-0">Starting nwbt</span>
            }
            @case ('folder') {
              <span class="status status-warning"></span>
              <span class="flex-1 min-w-0">{{ desktopError() }}</span>
            }
            @default {
              <span class="status status-warning animate-pulse"></span>
              <span class="flex-1 min-w-0">nwbt is not running</span>
            }
          }
          @if (desktop()) {
            <button class="btn btn-sm btn-primary" (click)="pickGameDir.emit()">
              <nwb-icon [icon]="iconFolder" class="size-4" />
              New World folder
            </button>
          } @else {
            <button class="btn btn-sm btn-ghost" [disabled]="checking()" (click)="retry.emit()">
              @if (checking()) {
                <span class="loading loading-spinner loading-xs"></span>
              } @else {
                <nwb-icon [icon]="iconRetry" class="size-4" />
              }
              Retry
            </button>
          }
        </div>

        @if (!desktop()) {
          <nwb-nwbt-setup />
        }
      </div>
    </div>
  `,
})
export class PakOnboardingComponent {
  /**
   * The address this page expects nwbt at
   */
  public readonly nwbtUrl = input.required<string>()
  /**
   * A health check is running
   */
  public readonly checking = input(false)
  /**
   * nwbt answered but the tools failed to load
   */
  public readonly error = input<string | null>(null)
  /**
   * Asks nwbt again now
   */
  public readonly retry = output<void>()
  /**
   * The page runs in the desktop app (apps/desktop), which starts nwbt itself
   */
  public readonly desktop = input(false)
  /**
   * Why the desktop app's nwbt does not run
   */
  public readonly desktopError = input<string | null>(null)
  /**
   * Desktop app: choose the New World folder
   */
  public readonly pickGameDir = output<void>()

  protected readonly iconTools = svgCubes
  protected readonly iconFolder = svgFolderOpen
  protected readonly iconRetry = svgRotate

  /**
   * nwbt did not answer at least once: the repeated checks keep showing that instead of flickering to "connecting"
   */
  private readonly offlineSeen = signal(false)

  protected readonly status = computed(() => {
    if (this.error()) {
      return 'error'
    }
    if (this.desktop()) {
      return this.desktopError() ? 'folder' : 'starting'
    }
    if (this.checking() && !this.offlineSeen()) {
      return 'connecting'
    }
    return 'offline'
  })

  public constructor() {
    effect(() => {
      if (!this.checking() && !this.error()) {
        this.offlineSeen.set(true)
      }
    })
  }
}
