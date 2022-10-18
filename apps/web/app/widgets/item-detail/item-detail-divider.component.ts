import { Component } from '@angular/core'

@Component({
  standalone: true,
  selector: 'nwb-item-detail-divider,.item-detail-divider',
  template: '',
  host: {
    class: 'block hr border-t-0 bg-gradient-to-r from-transparent via-zinc-600 to-transparent h-[1px]',
  },
})
export class ItemDetailDivider {}
