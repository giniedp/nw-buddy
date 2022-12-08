import { BreakpointObserver } from '@angular/cdk/layout'
import { CommonModule } from '@angular/common'
import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  Renderer2,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core'
import { map, Subject, takeUntil } from 'rxjs'
import { NwModule } from '~/nw'
import { IconsModule } from './ui/icons'
import { svgArrowsLeftRight, svgCompress, svgExpand } from './ui/icons/svg'
import { LayoutModule } from './ui/layout'

@Component({
  standalone: true,
  selector: 'nwb-aeternum-map',
  template: `
    <div *ngIf="isFloating" class="mb-1 flex flex-row gap-1 justify-center absolute top-0 w-full">
      <button class="btn btn-circle btn-primary btn-sm" (click)="togglePosition()">
        <nwb-icon [icon]="iconArrows" class="w-4 h-4"></nwb-icon>
      </button>
      <button class="btn btn-circle btn-primary btn-sm" (click)="toggleExpand()">
        <nwb-icon [icon]="isExpanded ? iconCollapse : iconExpand" class="w-4 h-4"></nwb-icon>
      </button>
    </div>
    <iframe src="https://aeternum-map.gg" class="flex-1 rounded-md"></iframe>
  `,
  styleUrls: ['./aeternum-map.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, LayoutModule, IconsModule],
  host: {
    class: 'hidden xl:flex flex-col p-3',
    '[class.floating]': 'isFloating',
    '[class.expand]': 'isExpanded',
    '[class.left]': 'isLeft',
  },
})
export class AeternumMapComponent implements OnInit, OnDestroy {

  protected isFloating = false
  protected isExpanded = false
  protected isLeft = false

  protected iconExpand = svgExpand
  protected iconCollapse = svgCompress
  protected iconArrows = svgArrowsLeftRight

  private isFloating$ = this.bp.observe('(min-width: 3000px)').pipe(map((it) => !it.matches))
  private destroy$ = new Subject<void>()

  public constructor(private bp: BreakpointObserver, private cdRef: ChangeDetectorRef) {
    //
  }

  public ngOnInit(): void {
    this.isFloating$.pipe(takeUntil(this.destroy$)).subscribe((isFloating) => {
      this.isFloating = isFloating
      this.cdRef.markForCheck()
    })
  }

  public ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  protected toggleExpand() {
    this.isExpanded = !this.isExpanded
  }

  protected togglePosition() {
    this.isLeft = !this.isLeft
  }
}
