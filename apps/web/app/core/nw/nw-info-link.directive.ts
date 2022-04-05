import { ChangeDetectorRef, Directive, HostBinding, Input } from '@angular/core'
import { nwdbLinkUrl, NwdbResource } from './nwdbinfo'

@Directive({
  selector: '[nwInfoLink]',
})
export class NwInfoLinkDirective {
  @Input()
  public set nwInfoResource(value: NwdbResource) {
    this.resource = value
    this.update()
  }

  @Input()
  public set nwInfoLink(value: string) {
    this.link = value
    this.update()
  }

  private resource: NwdbResource
  private link: string

  @HostBinding('attr.href')
  public href: string

  public constructor(private cdRef: ChangeDetectorRef) {}

  private update() {
    this.href = nwdbLinkUrl(this.resource, this.link)
    this.cdRef.markForCheck()
  }
}
