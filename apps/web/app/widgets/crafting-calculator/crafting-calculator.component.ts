import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core'
import { Crafting } from '@nw-data/types'
import { defer, Subject } from 'rxjs'
import { NwService } from '~/core/nw'

@Component({
  selector: 'nwb-crafting-calculator',
  templateUrl: './crafting-calculator.component.html',
  styleUrls: ['./crafting-calculator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CraftingCalculatorComponent implements OnInit, OnDestroy, OnChanges {
  @Input()
  public quantity: number = 1

  @Input()
  public optimize: boolean = false

  @Input()
  public recipe: Crafting

  public stepChange = defer(() => this.stepChange$)

  private destroy$ = new Subject()
  private stepChange$ = new Subject()

  public constructor(private nw: NwService, private cdRef: ChangeDetectorRef) {}

  public ngOnInit(): void {}

  public ngOnChanges(changes: SimpleChanges): void {
    this.cdRef.markForCheck()
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  public reportChange() {
    this.stepChange$.next(null)
  }

  public toggleOptimize() {
    this.optimize = !this.optimize
    this.cdRef.markForCheck()
  }
}
