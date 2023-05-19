import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { Gamemodes, Vitals } from '@nw-data/types'
import { combineLatest } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { DestroyService } from '~/utils'
import { VitalDetailHeaderComponent } from './vital-detail-header.component'
import { VitalDetailInfosComponent } from './vital-detail-infos.component'
import { VitalDetailWeaknessComponent } from './vital-detail-weakness.component'
import { VitalDetailService } from './vital-detail.service'

@Component({
  standalone: true,
  selector: 'nwb-vital-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    VitalDetailWeaknessComponent,
    VitalDetailHeaderComponent,
    VitalDetailInfosComponent,
  ],
  providers: [DestroyService, VitalDetailService],
  host: {
    class: 'block backdrop-blur-sm bg-white/10 rounded-md overflow-clip',
  },
  template: `
    <ng-container *ngIf="vm$ | async; let vm">
      <nwb-vital-detail-header [vital]="vm.vital"></nwb-vital-detail-header>
      <!-- <nwb-vital-detail-infos [vital]="vm.vital" [level]="vm.level" [modifier]="vm.modifier"></nwb-vital-detail-infos> -->
      <nwb-vital-detail-weakness [vital]="vm.vital" class="w-full bg-transparent"></nwb-vital-detail-weakness>
    </ng-container>
  `,
})
export class VitalDetailComponent {
  @Input()
  public set vital(value: Partial<Vitals>) {
    this.service.update(value.VitalsID)
  }

  @Input()
  public isGroup: boolean

  @Input()
  public dungeons: Gamemodes[]

  protected vm$ = combineLatest({
    vital: this.service.vital$,
    level: this.service.level$,
    modifier: this.service.modifier$,
  })

  // protected readonly vital$ = new ReplaySubject<Vitals>(1)
  // protected readonly categories$ = combineLatest({
  //   ids: this.vital$.pipe(map((it) => it?.VitalsCategories || [])),
  //   categories: this.db.vitalsCategoriesMap,
  // })
  //   .pipe(map(({ ids, categories }) => ids.map((it) => categories.get(it)).filter((it) => !!it)))
  //   .pipe(shareReplayRefCount(1))

  // protected readonly isNamed$ = this.vital$.pipe(map((it) => isVitalNamed(it)))
  // protected readonly marker$ = this.vital$.pipe(map((vital) => this.vitals.vitalMarkerIcon(vital)))
  // protected readonly familyInfo$ = this.vital$.pipe(
  //   map((it) => (this.isGroup ? getVitalFamilyInfo(it) : getVitalCategoryInfo(it)))
  // )

  public constructor(private db: NwDbService, private service: VitalDetailService) {
    //
  }
}
