import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { DesktopService } from '~/desktop'
import { NwModule } from '~/nw'
import { injectWindow } from '~/utils/injection/window'
import { PlatformService } from '~/utils/services/platform.service'
import { VersionService } from './version.service'

const RELEASES_PAGE = 'https://github.com/giniedp/nw-buddy/releases'

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
  private latest = toSignal(this.service.latest$, { initialValue: null })

  protected isStandalone = inject(PlatformService).env.standalone
  private desktop = inject(DesktopService)
  private win = injectWindow()

  @HostListener('click')
  public show() {
    if (!this.isStandalone) {
      location.reload()
      return
    }
    const url = this.latest()?.url || RELEASES_PAGE
    if (this.desktop.isDesktop) {
      void this.desktop.openUrl(url)
      return
    }
    this.win.open(url, '_blank')
  }
}
