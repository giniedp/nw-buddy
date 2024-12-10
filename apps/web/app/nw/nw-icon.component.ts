import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostBinding,
  HostListener,
  input,
  Input,
  signal,
} from '@angular/core'
import { getItemIconPath, getItemRarity, ItemRarity, NW_FALLBACK_ICON } from '@nw-data/common'
import { HouseItems, MasterItemDefinitions } from '@nw-data/generated'
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
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.nw-icon]': 'true',
  },
})
export class NwIconComponent {
  @Input()
  public set nwIcon(value: string | MasterItemDefinitions | HouseItems) {
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
  public set nwRarity(value: ItemRarity) {
    this.rarityOverride = value
  }

  protected src: string
  protected isLoaded = false
  private rarity: ItemRarity
  private rarityOverride: ItemRarity

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
    class: 'fade',
    '[class.show]': 'isLoaded()',
    '[attr.loading]': 'loading()',
    '[attr.src]': 'source()',
  },
})
export class NwImageComponent {
  public loading = input<'lazy' | 'eager'>('lazy')
  public source = input<string, string | MasterItemDefinitions | HouseItems>(null, {
    alias: 'nwImage',
    transform: (input) => this.transformSource(input),
  })
  protected isLoaded = signal<boolean>(false)
  protected hasError = signal<boolean>(false)

  @HostListener('error')
  public onError(e: Event) {
    this.isLoaded.set(false)
    this.hasError.set(true)
  }

  @HostListener('load')
  public onLoad(e: Event) {
    this.isLoaded.set(true)
    this.hasError.set(false)
  }

  private transformSource(input: string | MasterItemDefinitions | HouseItems) {
    let value: string = null
    if (!input) {
      value = transparentPixel
    } else if (typeof input === 'string') {
      value = input
    } else {
      value = getItemIconPath(input) || NW_FALLBACK_ICON
    }
    value = assetUrl(value)
    return value
    // if (this.src !== value) {
    //   this.src = value
    //   this.isLoaded = false
    //   this.cdRef.markForCheck()
    // }
  }
}
