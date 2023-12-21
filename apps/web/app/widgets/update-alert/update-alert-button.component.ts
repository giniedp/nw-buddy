import { DialogModule } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, Renderer2, inject } from '@angular/core'
import { combineLatest, tap } from 'rxjs'
import { NwModule } from '~/nw'
import { PlatformService } from '~/utils/services/platform.service'
import { VersionService } from './version.service'
import { toSignal } from '@angular/core/rxjs-interop'

@Component({
  standalone: true,
  selector: 'nwb-update-alert-button',
  templateUrl: './update-alert-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, DialogModule],
  host: {
    class: 'btn text-primary',
    '[class.hidden]': '!hasNewVersion()'
  },
})
export class UpdateAlertButtonComponent {
  protected service = inject(VersionService)
  protected hasNewVersion = toSignal(this.service.versionChanged$, { initialValue: false })

  protected isStandalone = inject(PlatformService).env.standalone

  @HostListener('click')
  public show() {
    if (this.isStandalone) {
      window.open('https://github.com/giniedp/nw-buddy/releases/latest', '_blank')
    } else {
      location.reload()
    }
  }
}
