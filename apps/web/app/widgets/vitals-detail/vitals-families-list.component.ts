import { animate, query, stagger, state, style, transition, trigger } from '@angular/animations'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { getVitalDungeon } from '@nw-data/common'
import { groupBy } from 'lodash'
import { combineLatest, map } from 'rxjs'
import { NwDbService } from '~/nw'
import { mapFilter } from '~/utils'
import { mergeVitals } from './utils'
import { VitalFamilyDetailComponent } from './vital-family-detail.component'

const REJECT = ['undefined']
@Component({
  standalone: true,
  selector: 'nwb-vitals-families-list',
  template: `
    <div class="grid" [@listAnimation]="entities.length" *ngIf="entities$ | async; let entities">
      <nwb-vital-family-detail
        *ngFor="let it of entities"
        [vital]="it.vital"
        [dungeons]="it.dungeons"
      ></nwb-vital-family-detail>
    </div>
  `,
  styles: [
    `
      :host .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(24rem, 1fr));
        column-gap: 1rem;
        row-gap: 1rem;
      }
    `,
  ],
  imports: [CommonModule, VitalFamilyDetailComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('listAnimation', [
      transition('void => *', [
        query(':enter', [style({ opacity: 0 }), stagger(50, [animate('0.3s', style({ opacity: 1 }))])]),
      ]),
    ]),
    trigger('apperAnimation', [
      state('*', style({ opacity: 0 })),
      state('true', style({ opacity: 1 })),
      transition('* => true', [animate('0.3s')]),
    ]),
  ],
})
export class VitalsFamiliesListComponent {
  protected families$ = this.db.vitalsFamilies.pipe(mapFilter((it) => !REJECT.includes(it)))
  protected entities$ = combineLatest({
    byFamily: this.db.vitalsByFamily,
    families: this.families$,
    gameModes: this.db.gameModes,
    vitalsMeta: this.db.vitalsMetadataMap,
  }).pipe(
    map(({ families, byFamily, gameModes, vitalsMeta }) => {
      return families.map((family) => {
        const vitals = byFamily.get(family)
        const dungeons = vitals.map((it) => getVitalDungeon(it, gameModes, vitalsMeta)).filter((it) => !!it)
        const dngGrouped = groupBy(dungeons, (it) => it.GameModeId)
        return {
          vital: mergeVitals(family, vitals),
          dungeons: Object.values(dngGrouped)
            .filter((list) => list.length > 2)
            .map((list) => list[0]),
        }
      })
    })
  )

  public constructor(private db: NwDbService) {}
}
