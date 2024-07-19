import { CommonModule } from '@angular/common'
import { Component, computed, input } from '@angular/core'
import { RequiredAchievementTokenComponent } from './required-achievement-token.component'
import { parseAchievementExpression } from './utils/achievement-expression'

@Component({
  standalone: true,
  selector: 'nwb-required-achievement',
  templateUrl: './required-achievement.component.html',
  imports: [CommonModule, RequiredAchievementTokenComponent],
})
export class RequiredAchievementComponent {
  public achievementId = input.required<string>()
  protected expression = computed(() => parseAchievementExpression(this.achievementId()))
}
