import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostBinding, HostListener, Input } from '@angular/core'
import { NW_FALLBACK_ICON, getItemIconPath, getItemRarity } from '@nw-data/common'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/generated'
import { assetUrl } from '~/utils'

@Component({
  standalone: true,
  selector: 'picture[nwIcon]',
  template: `
    <img
      loading="lazy"
      [src]="src"
      (error)="onError($event)"
      (load)="onLoad($event)"
      class="fade"
      [class.show]="isLoaded"
    />
    <ng-content></ng-content>
  `,
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

  @Input()
  public set nwRarity(value: number) {
    this.rarityOverride = value
  }

  protected src: string
  protected isLoaded = false
  private rarity: number
  private rarityOverride: number

  @HostBinding('class')
  protected get bgRarity() {
    const rarity = this.rarityOverride || this.rarity
    return rarity ? `bg-rarity-${rarity}` : null
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

  private updateSrc(value: string) {
    value = assetUrl(value)
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
  standalone: true,
  selector: 'img[nwImage]',
  template: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'fase',
  },
})
export class NwImageComponent {
  @Input()
  public set nwImage(value: string | ItemDefinitionMaster | Housingitems) {
    if (!value) {
      this.updateSrc(transparentPixel)
    } else if (typeof value === 'string') {
      this.updateSrc(value)
    } else {
      this.updateSrc(getItemIconPath(value) || NW_FALLBACK_ICON)
    }
    this.cdRef.markForCheck()
  }

  @HostBinding()
  public src: string

  @Input()
  @HostBinding()
  public loading: 'lazy' | 'eager' = 'lazy'

  @HostBinding('class.show')
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

  private updateSrc(value: string) {
    value = assetUrl(value)
    if (this.src !== value) {
      this.src = value
      this.isLoaded = false
      this.cdRef.markForCheck()
    }
  }
}
