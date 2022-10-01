import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core'
import { startWith, switchMap, takeUntil } from 'rxjs'
import { ElectronService } from './electron'
import { DestroyService } from './utils'

@Component({
  selector: 'nwb-title-bar',
  templateUrl: './title-bar.component.html',
  styleUrls: ['./title-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
})
export class TitleBarComponent implements OnInit {
  public isMaximized: boolean

  public constructor(
    private electron: ElectronService,
    private destroy: DestroyService,
    private zone: NgZone,
    private cdRef: ChangeDetectorRef
  ) {
    //
  }

  public ngOnInit(): void {
    this.electron.windowChange
      .pipe(startWith(null))
      .pipe(switchMap(() => this.electron.isWindowMaximized()))
      .pipe(takeUntil(this.destroy.$))
      .subscribe((value) => {
        this.zone.run(() => {
          this.isMaximized = value
          this.cdRef.markForCheck()
        })
      })
  }

  public onClose() {
    this.electron.sendWindowClose()
  }

  public onMin() {
    this.electron.sendWindowMin()
  }

  public onMax() {
    this.electron.sendWindowMax()
  }

  public onRestore() {
    this.electron.sendWindowRestore()
  }
}
