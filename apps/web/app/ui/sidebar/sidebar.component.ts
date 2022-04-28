import { Component, ChangeDetectionStrategy, Input, ChangeDetectorRef, EventEmitter, Output, OnChanges, SimpleChanges } from '@angular/core'

@Component({
  selector: 'nwb-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent implements OnChanges {

  @Input()
  public quickFilter: string

  @Input()
  public categories: string[]

  @Input()
  public category: string

  @Input()
  public disableQuickfilter = false

  @Input()
  public disableAll = false

  @Output()
  public categoryChange = new EventEmitter<string>()

  public constructor(private cdRef: ChangeDetectorRef) {

  }

  public selectCategory(value: string) {
    if (this.category !== value) {
      this.category = value
      this.categoryChange.emit(value)
      this.cdRef.markForCheck()
    }
  }

  public ngOnChanges() {
    this.cdRef.markForCheck()
  }
}
