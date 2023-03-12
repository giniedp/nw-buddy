import { DialogModule } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, Renderer2 } from '@angular/core'
import { combineLatest, tap } from 'rxjs'
import { NwModule } from '~/nw'
import { PlatformService } from '~/utils/platform.service'
import { VersionService } from './version.service'

@Component({
  standalone: true,
  selector: 'nwb-update-alert-button',
  templateUrl: './update-alert-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, DialogModule],
  host: {
    class: 'btn text-primary hidden',
  },
})
export class UpdateAlertButtonComponent {
  protected vm$ = combineLatest({
    current: this.service.currentVersion$,
    latest: this.service.latestVersion$,
    changed: this.service.versionChanged$,
  }).pipe(
    tap((it) => {
      if (it.changed) {
        this.renderer.removeClass(this.elRef.nativeElement, 'hidden')
      } else {
        this.renderer.addClass(this.elRef.nativeElement, 'hidden')
      }
    })
  )

  protected get isWeb() {
    return !this.platform.env.standalone
  }

  public constructor(
    private service: VersionService,
    private elRef: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private platform: PlatformService
  ) {
    //
  }

  @HostListener('click')
  public show() {
    if (this.platform.env.standalone) {
      window.open('https://github.com/giniedp/nw-buddy/releases/latest', '_blank')
    } else {
      location.reload()
    }
  }
}
