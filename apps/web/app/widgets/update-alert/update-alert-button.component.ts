import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { NwModule } from '~/nw'
import { PlatformService } from '~/utils/services/platform.service'
import { VersionService } from './version.service'
import { injectWindow } from '~/utils/injection/window'

@Component({
  selector: 'nwb-update-alert-button',
  templateUrl: './update-alert-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule],
  host: {
    class: 'btn text-primary',
    '[class.hidden]': '!hasNewVersion()',
  },
})
export class UpdateAlertButtonComponent {
  protected service = inject(VersionService)
  protected hasNewVersion = toSignal(this.service.versionChanged$, { initialValue: false })

  protected isStandalone = inject(PlatformService).env.standalone
  private win = injectWindow()

  @HostListener('click')
  public show() {
    if (this.isStandalone) {
      this.win.open('https://github.com/giniedp/nw-buddy/releases/latest', '_blank')
    } else {
      location.reload()
    }
  }
}
