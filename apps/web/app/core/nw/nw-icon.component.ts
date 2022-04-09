import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core'
import { NwService } from './nw.service'

@Component({
  selector: 'picture[nwIcon]',
  template: `<img loading="lazy" [src]="src" (error)="onError($event)" (load)="onLoad($event)" class="fade" [class.show]="isLoaded" >`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.nw-icon]': 'true',
  }
})
export class NwIconComponent {
  @Input()
  public set nwIcon(value: string) {
    this.src = this.nw.iconPath(value)
    this.isLoaded = false
    this.cdRef.markForCheck()
  }

  public src: string
  public isLoaded = false

  public constructor(private cdRef: ChangeDetectorRef, private nw: NwService) {}

  public onError(e: Event) {
    this.isLoaded = false
    this.cdRef.markForCheck()
  }

  public onLoad(e: Event) {
    this.isLoaded = true
    this.cdRef.markForCheck()
  }
}
