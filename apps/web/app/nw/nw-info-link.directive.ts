import { ChangeDetectorRef, Directive, HostBinding, Input } from '@angular/core'
import { NwInfoLinkService } from './nw-info-link.service'
import { NwdbResource } from './nwdbinfo'

@Directive({
  standalone: true,
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

  @HostBinding('attr.target')
  public target: string = '_blank'

  public constructor(private cdRef: ChangeDetectorRef, private service: NwInfoLinkService) {
    //
  }

  private update() {
    this.href = this.link && this.service.link(this.resource, this.link)
    this.cdRef.markForCheck()
  }
}
