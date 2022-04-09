import { ChangeDetectorRef, Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { distinctUntilChanged, map, pipe, Subject, takeUntil } from 'rxjs'

@Component({
  templateUrl: './item-detail.component.html',
  styleUrls: ['./item-detail.component.scss'],
})
export class ItemDetailComponent implements OnInit {
  public itemId: string

  private destroy$ = new Subject()

  public constructor(private route: ActivatedRoute, private cdRef: ChangeDetectorRef) {}

  public ngOnInit(): void {
    this.route.paramMap
      .pipe(map((it) => it.get('id')))
      .pipe(distinctUntilChanged())
      .pipe(pipe(takeUntil(this.destroy$)))
      .subscribe((it) => {
        this.itemId = it
        this.cdRef.markForCheck()
      })
  }
}
