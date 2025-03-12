import { Component, input } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwLinkResource, NwModule } from '~/nw'
import { ComponentInputs, PropertyGridCell } from '../property-grid-cell.directive'

export function linkCell(options: ComponentInputs<LinkCellComponent>): PropertyGridCell {
  return {
    value: options.value,
    component: LinkCellComponent,
    componentInputs: options,
  }
}

@Component({
  selector: 'nwb-link-cell',
  template: `
    @if (externLink()) {
      <a [href]="externLink()" target="_blank" class="link link-primary">
        {{ value() }}
      </a>
    } @else if (routerLink()) {
      <a [routerLink]="routerLink() | nwLink" [queryParams]="queryParams()" class="link link-primary">
        {{ value() }}
      </a>
    } @else {
      {{ value() }}
    }
  `,
  host: {
    class: 'inline',
  },
  imports: [NwModule, RouterModule],
})
export class LinkCellComponent {
  public value = input<string>()
  public routerLink = input<[NwLinkResource, string] | [NwLinkResource]>()
  public queryParams = input<Record<string, any>>()
  public externLink = input<string>()
}
