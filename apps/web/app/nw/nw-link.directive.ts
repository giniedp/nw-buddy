import { ChangeDetectorRef, Directive, HostBinding, Input } from '@angular/core'
import { NwLinkService } from './nw-link.service'
import { NwLinkResource } from './nw-link'

@Directive({
  standalone: true,
  selector: '[nwLink]',
})
export class NwLinkDirective {
  @Input()
  public set nwLinkResource(value: NwLinkResource) {
    this.resource = value
    this.update()
  }

  @Input()
  public set nwLink(value: string | number) {
    this.link = value == null ? null : String(value)
    this.update()
  }

  private resource: NwLinkResource
  private link: string

  @HostBinding('attr.href')
  public href: string

  @HostBinding('attr.target')
  public target: string = '_blank'

  public constructor(private cdRef: ChangeDetectorRef, private service: NwLinkService) {
    //
  }

  private update() {
    this.href = this.link && this.service.link(this.resource, this.link)
    this.cdRef.markForCheck()
  }
}
