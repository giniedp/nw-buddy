import { Component, OnInit, ChangeDetectionStrategy, Input, ChangeDetectorRef } from '@angular/core'

@Component({
  selector: 'nwb-property-grid',
  templateUrl: './property-grid.component.html',
  styleUrls: ['./property-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyGridComponent implements OnInit {
  @Input()
  public set item(value: any) {
    this.updateProperties(value)
  }

  public properties: Array<{ key: string; value: string }>

  public constructor(private cdRef: ChangeDetectorRef) {
    //
  }

  public ngOnInit(): void {}

  public updateProperties(item: any) {
    this.properties = Array.from(Object.entries(item || {})).map(([key, value]) => {
      return { key, value: String(value) }
    })
    this.cdRef.markForCheck()
  }
}
