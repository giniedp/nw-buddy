import { CommonModule } from '@angular/common'
import { Component, computed, input } from '@angular/core'
import { RequiredAchievementTokenComponent } from './required-achievement-token.component'
import { parseAchievementExpression } from './utils/achievement-expression'

@Component({
  selector: 'nwb-required-achievement',
  template: `
    @if (expression()) {
      <nwb-required-achievement-token [token]="expression()" />
    }
  `,
  imports: [CommonModule, RequiredAchievementTokenComponent],
})
export class RequiredAchievementComponent {
  public achievementId = input.required<string>()
  protected expression = computed(() => parseAchievementExpression(this.achievementId()))
}
