import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { IconsModule } from '~/ui/icons'
import { svgCheck, svgExclamation } from '~/ui/icons/svg'

/**
 * - `todo`: an instruction for the user
 * - `current`: waits for the user
 * - `busy`: waits for nwbt
 * - `blocked`: waits for an earlier step
 */
export type OnboardingStepState = 'todo' | 'current' | 'busy' | 'blocked' | 'done' | 'failed'

/**
 * One step in an `.onboarding` list (styles/components/onboarding.css): marker, title and the projected content
 */
@Component({
  selector: 'nwb-onboarding-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconsModule],
  host: {
    role: 'listitem',
    '[class]': `'onboarding-step onboarding-step-' + state()`,
  },
  template: `
    <div class="onboarding-step-rail">
      <span class="onboarding-step-marker">
        @switch (state()) {
          @case ('done') {
            <nwb-icon [icon]="iconDone" class="size-3" />
          }
          @case ('failed') {
            <nwb-icon [icon]="iconFailed" class="size-3" />
          }
          @case ('busy') {
            <span class="loading loading-spinner loading-xs"></span>
          }
          @default {
            <span class="onboarding-step-number"></span>
          }
        }
      </span>
    </div>
    <div class="onboarding-step-body">
      <span class="onboarding-step-title">{{ label() }}</span>
      <ng-content />
    </div>
  `,
})
export class OnboardingStepComponent {
  public readonly label = input.required<string>()
  public readonly state = input<OnboardingStepState>('todo')

  protected readonly iconDone = svgCheck
  protected readonly iconFailed = svgExclamation
}
