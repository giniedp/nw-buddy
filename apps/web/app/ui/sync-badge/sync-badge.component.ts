import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'
import { IconsModule } from '../icons'
import { svgCircleSolid, svgGlobe } from '../icons/svg'

@Component({
  selector: 'nwb-sync-badge',
  template: `
    <nwb-icon
      [icon]="icon()"
      class="w-4 h-4 transition-all scale-100"
      [class.text-success]="!pending() && !conflict()"
      [class.text-warning]="pending()"
      [class.text-error]="conflict()"
      [class.animate-ping]="loading()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconsModule],
  host: {
    class: 'inline-block w-4 h-4',
  },
})
export class SyncBadgeComponent {
  public published = input(false)
  public loading = input(false)
  public pending = input(false)
  public conflict = input(false)

  protected iconGlobe = svgGlobe
  protected iconCircle = svgCircleSolid
  protected icon = computed(() => {
    return this.published() ? this.iconGlobe : this.iconCircle
  })
}
