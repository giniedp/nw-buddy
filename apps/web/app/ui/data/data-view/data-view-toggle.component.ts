import { Component, HostListener, Input } from '@angular/core'
import { IconsModule } from '../../icons'
import { svgGrid, svgTableList } from '../../icons/svg'
import { DataViewMode, DataViewService } from './data-view.service'

@Component({
  standalone: true,
  selector: 'nwb-data-view-toggle,[nwbDataViewToggle]',
  template: ` <nwb-icon [icon]="icon" class="w-4 h-4"></nwb-icon> `,
  imports: [IconsModule],
  host: {
    class: 'content',
    '[class.text-primary]': 'isActive',
  },
})
export class DataViewToggleComponent {
  @Input()
  public set nwbDataViewToggle(value: DataViewMode) {
    this.mode = value
  }

  @Input()
  public mode: DataViewMode

  protected get icon() {
    return this.mode === 'grid' ? svgTableList : svgGrid
  }

  protected get isActive() {
    if (this.mode === 'grid' && this.service.isGridActive$()) {
      return true
    }
    if (this.mode === 'virtual' && this.service.isVirtGridActive$()) {
      return true
    }
    return false
  }

  public constructor(protected service: DataViewService<unknown>) {
    //
  }

  @HostListener('click')
  public onClick() {
    this.service.toggleMode()
  }
}
