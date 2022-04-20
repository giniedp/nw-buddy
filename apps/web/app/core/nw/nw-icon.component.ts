import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, Input } from '@angular/core'
import { ItemDefinitionMaster } from '@nw-data/types'
import { NwService } from './nw.service'

@Component({
  selector: 'picture[nwIcon],picture[nwItemIcon]',
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

  @Input()
  public set nwItemIcon(value: ItemDefinitionMaster) {
    this.src = this.nw.iconPath(value?.IconPath)
    this.itemRarity = this.nw.itemRarity(value)
    this.isLoaded = false
    this.cdRef.markForCheck()
  }

  public src: string
  public isLoaded = false
  public itemRarity: number

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

@Component({
  selector: 'img[nwImage]',
  template: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.fade]': 'true',
    '[class.show]': 'isLoaded',
    '[attr.loading]': '"lazy"',
    '[attr.src]': 'src'
  }
})
export class NwImageComponent {
  @Input()
  public set nwImage(value: string) {
    this.src = this.nw.iconPath(value)
    this.isLoaded = false
    this.cdRef.markForCheck()
  }

  public src: string
  public isLoaded = false

  public constructor(private cdRef: ChangeDetectorRef, private nw: NwService) {}

  @HostListener('error')
  public onError(e: Event) {
    this.isLoaded = false
    this.cdRef.markForCheck()
  }

  @HostListener('load')
  public onLoad(e: Event) {
    this.isLoaded = true
    this.cdRef.markForCheck()
  }
}
