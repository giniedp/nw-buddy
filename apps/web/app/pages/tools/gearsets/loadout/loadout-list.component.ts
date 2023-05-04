import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { combineLatest, filter, map, switchMap } from 'rxjs'
import { GearsetRecord, GearsetsStore } from '~/data'
import { NwModule } from '~/nw'
import { ConfirmDialogComponent, PromptDialogComponent } from '~/ui/layout'
import { QuicksearchService } from '~/ui/quicksearch'
import { GearsetLoadoutItemComponent } from './loadout-item.component'
import { animate, animateChild, query, stagger, style, transition, trigger } from '@angular/animations'
import { sortBy } from 'lodash'

@Component({
  standalone: true,
  selector: 'nwb-gearset-loadout-list',
  templateUrl: './loadout-list.component.html',
  styleUrls: ['./loadout-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, GearsetLoadoutItemComponent, DialogModule],
  providers: [],
  host: {
    class: 'layout-content layout-pad',
  },
  animations: [
    trigger('list', [
      transition('* => *', [
        query(':enter', stagger(25, animateChild()), {
          optional: true,
        }),
      ]),
    ]),
    trigger('fade', [transition('* => *', [style({ opacity: 0 }), animate('0.3s ease-out', style({ opacity: 1 }))])]),
  ],
})
export class GearsetLoadoutListComponent {

  protected trackByIndex = (i: number) => i
  protected readonly records$ = combineLatest({
    records: this.store.selectedRecords$,
    search: this.search.query,
  }).pipe(
    map(({ records, search }) => {
      if (!search || !records?.length) {
        return records
      }
      return records.filter((it) => it.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
    }),
    map((list) => sortBy(list, (it) => it.name) )
  )

  public constructor(
    private store: GearsetsStore,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: Dialog,
    private search: QuicksearchService
  ) {
    store.loadAll()
  }

  protected async createItem() {
    PromptDialogComponent.open(this.dialog, {
      data: {
        title: 'Create new set',
        body: 'Give this set a name',
        input: `New Gearset`,
        positive: 'Create',
        negative: 'Cancel',
      },
    })
      .closed.pipe(filter((it) => !!it))
      .pipe(
        switchMap((newName) =>
          this.store.createRecord({
            id: null,
            name: newName,
          })
        )
      )
      .subscribe((record) => {
        if (record) {
          this.router.navigate([record.id], {
            relativeTo: this.route,
          })
        }
      })
  }

  protected deleteItem(gearset: GearsetRecord) {
    ConfirmDialogComponent.open(this.dialog, {
      data: {
        title: 'Delete Gearset',
        body: 'Are you sure you want to delete this gearset?',
        positive: 'Delete',
        negative: 'Cancel',
      },
    })
      .closed.pipe(filter((it) => !!it))
      .subscribe(() => {
        this.store.destroyRecord({ recordId: gearset.id })
      })
  }
}
