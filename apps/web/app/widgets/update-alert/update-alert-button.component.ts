import { DialogModule } from '@angular/cdk/dialog'
import { Platform } from '@angular/cdk/platform'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnInit, TemplateRef, ViewChild } from '@angular/core'
import { environment } from 'apps/web/environments/environment'
import { takeUntil } from 'rxjs'
import { NwModule } from '~/nw'
import { DestroyService } from '~/utils'
import { Release, UpdateAlertService } from './update-alert.service'

@Component({
  standalone: true,
  selector: 'nwb-update-alert-button',
  templateUrl: './update-alert-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, DialogModule],
  providers: [DestroyService],
  host: {
    class: 'btn text-primary',
    '[class.hidden]': '!release',
  },
})
export class UpdateAlertButtonComponent implements OnInit {
  protected release: Release
  @ViewChild('tplInfo')
  protected tplInfo: TemplateRef<any>

  public constructor(
    private service: UpdateAlertService,
    private destroy: DestroyService,
    private cdRef: ChangeDetectorRef
  ) {
    //
  }

  public ngOnInit(): void {
    if (environment.environment === 'ELECTRON') {
      this.service.info$.pipe(takeUntil(this.destroy.$)).subscribe((value) => {
        this.release = value
        this.cdRef.markForCheck()
      })
    }
  }

  @HostListener('click')
  public show() {
    if (this.release) {
      window.open('http://nw-buddy.ginie.eu/', '_blank')
    }
  }
}
