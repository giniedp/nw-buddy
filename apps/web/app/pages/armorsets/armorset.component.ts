import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core'
import { ItemDefinitionMaster } from '@nw-data/types'
import { filter, map, Subject, take, takeUntil } from 'rxjs'
import { NwService } from '~/core/nw'
import { IntersectionObserverService } from '~/core/utils'
import { ArmorsetsService } from './armorsets.service'
import { Armorset } from './types'

@Component({
  selector: 'nwb-armorset',
  templateUrl: './armorset.component.html',
  styleUrls: ['./armorset.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArmorsetComponent implements OnInit, OnChanges, OnDestroy {

  @Input()
  public armorset: Armorset

  public get items() {
    return this.armorset.items
  }

  private destoy$ = new Subject()

  public isVisible: boolean = false

  public constructor(
    private nw: NwService,
    private sets: ArmorsetsService,
    private intersection: IntersectionObserverService,
    private elRef: ElementRef<HTMLElement>,
    private cdRef: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.intersection
      .observe(this.elRef.nativeElement)
      .pipe(filter((it) => it.isIntersecting))
      .pipe(take(1), takeUntil(this.destoy$))
      .subscribe(() => {
        this.isVisible = true
        this.cdRef.markForCheck()
      })
  }

  public ngOnChanges(): void {
    this.cdRef.markForCheck()
  }

  public ngOnDestroy(): void {
    this.destoy$.next(null)
    this.destoy$.complete()
  }

  public iconPath(path: string) {
    return this.nw.iconPath(path)
  }

  public itemName(item: ItemDefinitionMaster, set: Armorset) {
    return this.nw.translate(item.Name)?.replace(set.name, '')
  }

  public itemRarity(item: ItemDefinitionMaster) {
    return this.nw.itemRarity(item)
  }
}
