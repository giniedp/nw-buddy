import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, OnInit, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { of, startWith, switchMap } from 'rxjs'
import { ElectronService } from './electron.service'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'nwb-title-bar',
  templateUrl: './title-bar.component.html',
  styleUrl: './title-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class TitleBarComponent {
  public isMaximized = signal(false)

  public constructor(private electron: ElectronService) {
    //
    this.electron.windowChange
      .pipe(startWith(null))
      .pipe(switchMap(async () => this.electron.isWindowMaximized()))
      .pipe(takeUntilDestroyed())
      .subscribe((value) => {
        this.isMaximized.set(value)
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
