import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';

@Component({
  selector: 'nwb-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemsComponent implements OnInit {

  public selectedId: string

  public constructor(private cdRef: ChangeDetectorRef) { }

  public ngOnInit(): void {
  }

  public selected(id: string[]) {
    this.selectedId = id?.[0]
    this.cdRef.markForCheck()
  }
}
