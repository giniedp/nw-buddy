import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostBinding, HostListener, Input } from '@angular/core'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { getItemIconPath, getItemRarity } from './utils'

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
    if (!value) {
      this.rarity = null
      this.updateSrc(null)
    } else if (typeof value === 'string') {
      this.updateSrc(value)
    } else {
      this.updateSrc(getItemIconPath(value))
      this.rarity = getItemRarity(value)
    }
    this.cdRef.markForCheck()
  }

  protected src: string
  protected isLoaded = false
  private rarity: number

  @HostBinding('class')
  protected get bgRarity() {
    return this.rarity ? `bg-rarity-${this.rarity}` : null
  }

  public constructor(private cdRef: ChangeDetectorRef, private elRef: ElementRef<HTMLImageElement>) {
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

  private updateSrc(value: string) {
    if (this.src !== value) {
      this.src = value
      this.isLoaded = false
      this.cdRef.markForCheck()
    }
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
    value = value || transparentPixel
    if (this.src !== value) {
      this.src = value
      this.isLoaded = false
      this.cdRef.markForCheck()
    }
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
