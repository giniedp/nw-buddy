import { NgTemplateOutlet } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core'
import type { DesktopNwbtState } from '~/desktop'
import { IconsModule } from '~/ui/icons'
import { svgFolderOpen, svgMagnifyingGlass } from '~/ui/icons/svg'
import { OnboardingRetryComponent } from './onboarding-retry.component'
import { OnboardingStepComponent } from './onboarding-step.component'

/**
 * The steps in the desktop app, which starts nwbt itself: the New World folder of its `.env` (choose it, or search
 * the Steam libraries and confirm what was found), then nwbt
 */
@Component({
  selector: 'nwb-pak-onboarding-desktop',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconsModule, NgTemplateOutlet, OnboardingStepComponent, OnboardingRetryComponent],
  template: `
    <div class="onboarding" role="list">
      @switch (folder()?.problem) {
        @case (undefined) {
          <nwb-onboarding-step label="New World folder" state="busy"></nwb-onboarding-step>
        }
        @case ('') {
          <nwb-onboarding-step label="New World folder" state="done">
            <code class="self-start">{{ folder()?.dir }}</code>
          </nwb-onboarding-step>
        }
        @case ('unreachable') {
          <nwb-onboarding-step label="The New World folder is not reachable" state="failed">
            <p class="opacity-70">
              <code>{{ folder()?.dir }}</code> does not exist or has no game files. Connect its drive and retry, or
              choose another folder.
            </p>
            <ng-container [ngTemplateOutlet]="chooseFolder" />
          </nwb-onboarding-step>
        }
        @case ('env') {
          <nwb-onboarding-step label="The settings file could not be read" state="failed">
            <p class="opacity-70 break-words">{{ folder()?.error }}</p>
            <ng-container [ngTemplateOutlet]="chooseFolder" />
          </nwb-onboarding-step>
        }
        @default {
          <nwb-onboarding-step label="Choose the New World folder" state="current">
            <p class="opacity-70">nwbt reads the game files from your New World installation.</p>
            <ng-container [ngTemplateOutlet]="chooseFolder" />
          </nwb-onboarding-step>
        }
      }

      @if (folder()?.problem !== '') {
        <nwb-onboarding-step label="Start nwbt" state="blocked"></nwb-onboarding-step>
      } @else if (state()?.error) {
        <nwb-onboarding-step label="nwbt did not start" state="failed">
          <p class="opacity-70 break-words">{{ state()?.error }}</p>
          <nwb-onboarding-retry [checking]="checking()" (retry)="retry.emit()" />
        </nwb-onboarding-step>
      } @else {
        <nwb-onboarding-step label="Starting nwbt" state="busy"></nwb-onboarding-step>
      }
    </div>

    <ng-template #chooseFolder>
      <div class="flex flex-wrap gap-2">
        <button class="btn btn-sm btn-primary" (click)="pickGameDir.emit()">
          <nwb-icon [icon]="iconFolder" class="size-4" />
          Choose folder
        </button>
        <button class="btn btn-sm" [disabled]="searching()" (click)="findGameDir.emit()">
          @if (searching()) {
            <span class="loading loading-spinner loading-xs"></span>
          } @else {
            <nwb-icon [icon]="iconSearch" class="size-4" />
          }
          Search Steam
        </button>
        <nwb-onboarding-retry [checking]="checking()" (retry)="retry.emit()" />
      </div>
      @if (foundGameDir() === '') {
        <p class="text-warning">No New World installation found in the Steam libraries.</p>
      } @else if (foundGameDir(); as dir) {
        <div class="flex flex-wrap items-center gap-2 rounded-box bg-base-200 p-3">
          <span class="flex-1 min-w-0">
            Found <code>{{ dir }}</code>
          </span>
          <button class="btn btn-sm btn-primary" (click)="useGameDir.emit(dir)">Use this folder</button>
        </div>
      }
      <p class="opacity-70">
        The folder is stored in
        <code>{{ folder()?.envFile }}</code
        >, you can also edit it there.
      </p>
    </ng-template>
  `,
})
export class PakOnboardingDesktopComponent {
  /**
   * The desktop app's nwbt and New World folder
   */
  public readonly state = input<DesktopNwbtState | null>(null)
  /**
   * A health check is running
   */
  public readonly checking = input(false)
  /**
   * The folder the Steam search found, not stored yet. Null before a search, empty when it found none.
   */
  public readonly foundGameDir = input<string | null>(null)
  /**
   * The Steam search runs
   */
  public readonly searching = input(false)
  /**
   * Starts nwbt again with the folder of the `.env` and asks it
   */
  public readonly retry = output<void>()
  /**
   * Choose the New World folder in a dialog
   */
  public readonly pickGameDir = output<void>()
  /**
   * Look for New World in the Steam libraries, on the user's request
   */
  public readonly findGameDir = output<void>()
  /**
   * The user confirmed the found folder
   */
  public readonly useGameDir = output<string>()

  protected readonly iconFolder = svgFolderOpen
  protected readonly iconSearch = svgMagnifyingGlass

  protected readonly folder = computed(() => this.state()?.folder ?? null)
}
