import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, Input, OnChanges } from '@angular/core'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { map } from 'rxjs'
import { NwDbService } from '~/nw'
import { getItemId } from '~/nw/utils'
import { ItemDetailService, PerkOverrideFn } from './item-detail.service'

@Component({
  standalone: true,
  selector: 'nwb-item-detail',
  templateUrl: './item-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  exportAs: 'detail',
  host: {
    class: 'block class bg-base-100 rounded-md overflow-clip',
  },
  providers: [
    {
      provide: ItemDetailService,
      useExisting: forwardRef(() => ItemDetailComponent),
    },
  ],
})
export class ItemDetailComponent extends ItemDetailService implements OnChanges {
  @Input()
  public set entityId(value: string) {
    this.entityId$.next(value)
  }

  @Input()
  public set entity(value: ItemDefinitionMaster | Housingitems) {
    this.entityId$.next(getItemId(value))
  }

  @Input()
  public set gearScoreOverride(value: number) {
    this.gearScoreOverride$.next(value)
  }

  @Input()
  public set perkOverride(value: PerkOverrideFn) {
    this.perkOverride$.next(value)
  }

  public get isLoading$() {
    return this.vm$.pipe(map((it) => it.loading))
  }

  public constructor(db: NwDbService, cdRef: ChangeDetectorRef) {
    super(db, cdRef)
  }

  public ngOnChanges() {
    this.cdRef.markForCheck()
  }
}
