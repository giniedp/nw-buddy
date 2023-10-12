import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { startWith, switchMap } from 'rxjs'
import { ElectronService } from './electron'
import { CommonModule } from '@angular/common'

@Component({
  standalone: true,
  selector: 'nwb-title-bar',
  templateUrl: './title-bar.component.html',
  styleUrls: ['./title-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class TitleBarComponent {
  public isMaximized: boolean

  public constructor(private electron: ElectronService, private zone: NgZone, private cdRef: ChangeDetectorRef) {
    //
    this.electron.windowChange
      .pipe(startWith(null))
      .pipe(switchMap(() => this.electron.isWindowMaximized()))
      .pipe(takeUntilDestroyed())
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
