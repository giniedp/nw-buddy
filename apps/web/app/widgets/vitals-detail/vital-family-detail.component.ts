import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { Gamemodes, Vitals } from '@nw-data/generated'
import { map, ReplaySubject } from 'rxjs'
import { NwModule } from '~/nw'
import { getVitalFamilyInfo } from '~/nw/utils'
import { DestroyService } from '~/utils'
import { VitalDetailHeaderComponent } from './vital-detail-header.component'
import { VitalDetailInfosComponent } from './vital-detail-infos.component'
import { VitalDetailWeaknessComponent } from './vital-detail-weakness.component'

@Component({
  standalone: true,
  selector: 'nwb-vital-family-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    VitalDetailWeaknessComponent,
    VitalDetailHeaderComponent,
    VitalDetailInfosComponent,
  ],
  providers: [DestroyService],
  host: {
    class: 'block backdrop-blur-sm bg-white/10 rounded-md overflow-clip',
  },
  template: `
    <ng-container *ngIf="vital$ | async; let vital">
      <div class="relative bg-base-300 flex flex-row items-center p-1">
        <div class="flex-1 flex flex-col items-center justify-center">
          <ng-container *ngIf="familyInfo$ | async; let info">
            <span>{{ info.Name | nwText }}</span>
            <img [nwImage]="info.Icon" class="w-6 h-6" />
          </ng-container>
          <a *ngIf="dungeons" class="flex flex-row flex-wrap gap-1 items-center">
            <span *ngFor="let item of dungeons" class="badge badge-sm badge-ghost px-1 italic">
              {{ item.DisplayName | nwText }}
            </span>
          </a>
        </div>
      </div>
      <nwb-vital-detail-weakness [vital]="vital" class="w-full bg-transparent"></nwb-vital-detail-weakness>
    </ng-container>
  `,
})
export class VitalFamilyDetailComponent {
  @Input()
  public set vital(value: Partial<Vitals>) {
    this.vital$.next(value as Vitals)
  }

  @Input()
  public dungeons: Gamemodes[]

  protected readonly vital$ = new ReplaySubject<Vitals>(1)
  protected readonly familyInfo$ = this.vital$.pipe(map((it) => getVitalFamilyInfo(it)))

  public constructor() {
    //
  }
}
