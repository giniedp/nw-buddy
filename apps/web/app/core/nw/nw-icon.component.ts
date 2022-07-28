import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostBinding, HostListener, Input } from '@angular/core'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { getItemRarity } from './utils'

@Component({
  selector: 'picture[nwIcon]',
  template: `<img
    loading="lazy"
    [src]="src"
    (error)="onError($event)"
    (load)="onLoad($event)"
    class="fade"
    [class.show]="isLoaded"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.nw-icon]': 'true',
  },
})
export class NwIconComponent {
  @Input()
  public set nwIcon(value: string | ItemDefinitionMaster | Housingitems) {
    if (typeof value === 'string') {
      this.src = value
    } else {
      this.src = value?.IconPath
      this.rarity = getItemRarity(value)
    }
    this.isLoaded = false
    this.cdRef.markForCheck()
  }

  protected src: string
  protected isLoaded = false
  private rarity: number

  @HostBinding('class')
  protected get bgRarity() {
    return this.rarity && `bg-rarity-${this.rarity}`
  }

  public constructor(private cdRef: ChangeDetectorRef) {
    //
  }

  protected onError(e: Event) {
    this.isLoaded = false
    this.cdRef.markForCheck()
  }

  protected onLoad(e: Event) {
    this.isLoaded = true
    this.cdRef.markForCheck()
  }
}

const transparentPixel =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
@Component({
  selector: 'img[nwImage]',
  template: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.fade]': 'true',
    '[class.show]': 'isLoaded',
    '[attr.loading]': '"lazy"',
    '[attr.src]': 'src',
  },
})
export class NwImageComponent {
  @Input()
  public set nwImage(value: string) {
    this.src = value || transparentPixel
    this.isLoaded = false
    this.cdRef.markForCheck()
  }

  public src: string
  public isLoaded = false

  public constructor(private cdRef: ChangeDetectorRef) {
    //
  }

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
