import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core'
import { QuicksearchService } from './quicksearch.service';

@Component({
  selector: 'nwb-quicksearch-input',
  templateUrl: './quicksearch-input.component.html',
  styleUrls: ['./quicksearch-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'input-group input-group-sm',
  },
})
export class QuicksearchInputComponent implements OnInit {

  public get value() {
    return this.search.query.value
  }

  public set value(v: string) {
    this.search.query.next(v)
  }

  public constructor(private search: QuicksearchService) {
    //
  }

  public ngOnInit(): void {
    //
  }
}
