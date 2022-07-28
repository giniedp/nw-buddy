import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges } from '@angular/core'
import { combineLatest, defer, EMPTY, map } from 'rxjs'
import { ItemDetailService } from './item-detail.service'

@Component({
  selector: 'nwb-item-detail',
  templateUrl: './item-detail.component.html',
  styleUrls: ['./item-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'bg-base-300 rounded-md',
  },
  providers: [ItemDetailService],
})
export class ItemDetailComponent implements OnChanges {
  @Input()
  public set itemId(value: string) {
    this.service.update(value)
  }

  public get entity() {
    return this.service.entity$
  }

  @Input()
  public set recipeId(value: string) {
    this.service.updateFromRecipe(value)
  }

  public get recipe() {
    return this.enableRecipe ? this.service.recipe$ : EMPTY
  }

  @Input()
  public enableNwdbLink: boolean

  @Input()
  public enableMarker: boolean

  @Input()
  public enableTracker: boolean

  @Input()
  public enableRecipe: boolean

  @Input()
  public enableDescription: boolean

  @Input()
  public enablePerks: boolean

  @Input()
  public enableDroplist: boolean

  @Input()
  public enableInfo: boolean

  protected get perks() {
    if (!this.enablePerks) {
      return EMPTY
    }
    return combineLatest({
      perks: this.service.perks$,
      buckets: this.service.perkBuckets$
    }).pipe(map((it) => {
      if (!it?.buckets?.length && !it?.perks?.length) {
        return null
      }
      return it
    }))
  }

  protected get description() {
    return this.enableDescription ? this.service.description$ : EMPTY
  }

  protected get salvageEvent() {
    return this.enableInfo ? this.service.salvageEvent$ : EMPTY
  }

  public droppedBy = defer(() => this.service.droppedByVitals$)

  public constructor(private cdRef: ChangeDetectorRef, private service: ItemDetailService) {
    //
  }

  public ngOnChanges(): void {
    this.cdRef.detectChanges()
  }
}
