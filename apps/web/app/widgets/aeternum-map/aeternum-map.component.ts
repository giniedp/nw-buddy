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
  EventEmitter,
  Output,
  Input,
  HostBinding,
} from '@angular/core'
import { NavigationStart, Router } from '@angular/router'
import { filter, map, Subject, takeUntil } from 'rxjs'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgArrowsLeftRight, svgCompress, svgExpand, svgXmark } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'

@Component({
  selector: 'nwb-aeternum-map',
  template: `
    <div class="mb-1 flex flex-row gap-1 justify-center sticky top-0 w-full h-0 overflow-visible">
      @if (!isExpanded && isFloating) {
        <button class="btn btn-circle btn-primary btn-sm" (click)="togglePosition()">
          <nwb-icon [icon]="iconArrows" class="w-4 h-4" />
        </button>
      }
      @if (isFloating) {
        <button class="btn btn-circle btn-primary btn-sm" (click)="toggleExpand()">
          <nwb-icon [icon]="isExpanded ? iconCollapse : iconExpand" class="w-4 h-4" />
        </button>
      }
      <button class="btn btn-circle btn-error btn-sm" (click)="close.emit()">
        <nwb-icon [icon]="iconClose" class="w-4 h-4" />
      </button>
    </div>
    <iframe src="https://aeternum-map.gg" class="flex-1"></iframe>
  `,
  styleUrl: './aeternum-map.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, LayoutModule, IconsModule],
  host: {
    class: 'hidden xl:flex flex-col',
    '[class.floating]': 'isFloating',
    '[class.expand]': 'isExpanded',
    '[class.left]': 'isLeft',
  },
})
export class AeternumMapComponent implements OnInit, OnDestroy {
  protected isFloating = true
  protected isExpanded = false
  protected isLeft = false

  protected iconExpand = svgExpand
  protected iconCollapse = svgCompress
  protected iconArrows = svgArrowsLeftRight
  protected iconClose = svgXmark

  @Output()
  public close = new EventEmitter()

  @Input()
  @HostBinding('style.min-height.px')
  public minHeight: number

  private destroy$ = new Subject<void>()

  public constructor(
    private bp: BreakpointObserver,
    private cdRef: ChangeDetectorRef,
    private router: Router,
  ) {
    //
  }

  public ngOnInit(): void {
    this.router.events
      .pipe(filter((it) => it instanceof NavigationStart))
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isExpanded = false
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
