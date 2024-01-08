import { Component, ContentChildren, ElementRef, Input, QueryList, inject } from '@angular/core'
import { SplitFrameStore } from './split-frame.store'
import { SplitGutterComponent } from './split-gutter.component'
import { SplitPaneComponent } from './split-pane.component'

export interface SplitFrameOptions {
  cid?: string
  minSize?: number
  gutterSize?: number
  horizontal?: boolean
}

@Component({
  standalone: true,
  selector: 'nwb-split-frame,nwb-split-vertical,nwb-split-horizontal',
  host: {
    class: 'flex flex-1 overflow-clip',
    '[class.flex-row]': '!isHorizontal()',
    '[class.flex-column]': 'isHorizontal()',
  },
  template: `
    <ng-content/>
    @for (child of children; track i; let i = $index; let isLast = $last) {
      @if (!isLast) {
        <nwb-split-gutter
          #gutter
          [order]="i * 2 + 1"
          [size]="gutterSize"
          (mousedown)="onDragStart($event, gutter.order)"
          (touchstart)="onDragStart($event, gutter.order)"
        />
      }
    }
  `,
  imports: [SplitGutterComponent],
  providers: [
    // LocalStorageService,
    SplitFrameStore,
  ],
})
export class SplitFrameComponent {
  @Input()
  public set horizontal(value: boolean) {
    this.store.patchState({ horizontal: value })
  }

  @Input()
  public set vertical(value: boolean) {
    this.horizontal = !value
  }

  @Input()
  public set orientation(v: 'horizontal' | 'vertical') {
    this.horizontal = v === 'horizontal'
  }

  @Input()
  public set cid(value: string) {
    this.store.patchState({ cid: value })
  }

  @Input()
  public set minSize(value: number) {
    this.store.patchState({ minSize: value })
  }

  @Input()
  public set gutterSize(value: number) {
    this.store.patchState({ gutterSize: value })
  }
  public get gutterSize() {
    return this.store.state().gutterSize
  }

  @ContentChildren(SplitPaneComponent)
  public children: QueryList<SplitPaneComponent>

  private store = inject(SplitFrameStore)
  protected readonly isHorizontal = this.store.selectSignal((s) => s.horizontal)

  public get fullCid(): string {
    if (this.cid) {
      return `split-frame.${this.cid}`
    }
    return null
  }

  // public get activeGutter() {
  //   return this.resizeService.isDragging ? this.currentGutter : null
  // }

  // private elRef = inject(ElementRef<HTMLElement>)
  // private paneSettings = new Map<SplitPaneComponent, PaneSettings>()
  // private config: { [key: string]: { size: number } } = {}
  // private currentGutter: number

  constructor(
    private elRef: ElementRef<HTMLElement>,
    // private storage: LocalStorageService,
    // private renderer: Renderer2,
    // private zone: NgZone,
    // private resizeService: SplitResizeService,
  ) {
    this.horizontal = !elRef.nativeElement.tagName.match(/nwb-split-horizontal/gi)
  }

  // public ngOnInit() {
  //   this.zone.runOutsideAngular(() => {
  //     this.resizeService
  //       .dragChange
  //       .pipe(takeUntil(this.destroyed))
  //       .subscribe(this.onSizeChanged.bind(this))
  //   })
  // }

  // public ngOnChanges(ch: SimpleChanges) {
  //   if (ch.options) {
  //     this.cid = this.getDefinedOption("cid", this.cid)
  //     this.minSize = this.getDefinedOption("minSize", this.minSize)
  //     this.gutterSize = this.getDefinedOption("gutterSize", this.gutterSize)
  //     this.horizontal = this.getDefinedOption("horizontal", this.horizontal)
  //   }
  //   this.readConfig()
  //   this.refresh()
  // }

  // public ngAfterContentInit() {
  //   this.children.changes.pipe(takeUntil(this.destroyed)).subscribe(() => {
  //     scheduleMicroTask(() => this.refresh())
  //   })
  //   scheduleMicroTask(() => this.refresh())
  // }

  public onDragStart(e: MouseEvent | TouchEvent, gutter: number) {
    //this.startDragging(e, gutter)
  }

  // private refresh() {
  //   if (!this.children) {
  //     this.paneSettings.clear()
  //     return
  //   }

  //   // remove old entries
  //   Array
  //     .from(this.paneSettings.keys())
  //     .filter((component) => {
  //       return this.children.find((it) => it === component) == null
  //     })
  //     .forEach((toRemove) => {
  //       this.paneSettings.delete(toRemove)
  //     })

  //   // add new entries
  //   this.children.forEach((child) => {
  //     if (!this.paneSettings.has(child)) {
  //       const that = this // tslint:disable-line
  //       this.paneSettings.set(child, {
  //         order: 0,
  //         size: 0,
  //         get minSize() {
  //           return child.minSize == null ? that.minSize : child.minSize
  //         },
  //       })
  //     }
  //   })

  //   // calculate pane settings
  //   const panes = this.children
  //     .map((child, index) => {
  //       const settings = this.paneSettings.get(child)
  //       settings.order = child.order != null ? child.order : index
  //       settings.size = this.getConfiguredPaneSize(child)
  //       return settings
  //     })
  //     .sort((a, b) => a.order - b.order)

  //   const weightSum = panes.map((a) => a.size).reduce((sum, size) => sum + size, 0)
  //   const weightFactor = 100 / weightSum

  //   panes.forEach((pane, index) => {
  //     pane.order = index * 2
  //     pane.size = pane.size * weightFactor
  //   })

  //   this.updatePaneStyle()
  //   this.cdRef.markForCheck()
  // }

  // private readConfig() {
  //   if (this.fullCid) {
  //     this.config = this.storage.get(this.fullCid, {})
  //   }
  // }

  // private writeConfig() {
  //   if (this.fullCid) {
  //     this.storage.set(this.fullCid, this.config)
  //   }
  // }

  // private getConfiguredPaneSize(comp: SplitPaneComponent): number {
  //   let result = comp.size
  //   if (comp.cid && this.config[comp.cid]) {
  //     result = this.config[comp.cid].size
  //   }
  //   if (result == null) {
  //     result = comp.size
  //   }
  //   if (result == null) {
  //     result = 1
  //   }
  //   return result
  // }

  // private updatePaneConfig() {
  //   if (this.children) {
  //     this.children.forEach((child) => {
  //       if (child.cid) {
  //         this.config[child.cid] = { size: this.paneSettings.get(child).size }
  //       }
  //     })
  //   }
  //   this.writeConfig()
  // }

  // private updatePaneStyle() {
  //   const gutterSize = this.gutterSize * (this.children.length - 1)
  //   this.children.forEach((child) => {
  //     const config = this.paneSettings.get(child)
  //     this.renderer.setStyle(child.element, "order", config.order)
  //     this.renderer.setStyle(child.element, "flex-basis", `calc( ${config.size}% - ${gutterSize * config.size / 100}px )`)
  //   })
  // }

  // private startDragging(e: MouseEvent | TouchEvent, gutter: number) {
  //   const panes = Array.from(this.paneSettings.values())
  //   const pane1 = panes.find((a) => a.order === gutter - 1)
  //   const pane2 = panes.find((a) => a.order === gutter + 1)
  //   if (!pane1 || !pane2) {
  //     return
  //   }
  //   this.store.patchState({ draggingGutter: gutter })
  //   this.resizeService.start({
  //     event: e,
  //     root: this.elRef.nativeElement,
  //     pane1: pane1,
  //     pane2: pane2,
  //     gutterSize: this.gutterSize,
  //     vertical: this.vertical,
  //   })
  // }

  // private onSizeChanged() {
  //   this.updatePaneConfig()
  //   this.updatePaneStyle()
  // }

  // private getDefinedOption<T>(key: keyof SplitFrameOptions, fallback: T): T {
  //   if (!this.options || !this.options.hasOwnProperty(key)) {
  //     return fallback
  //   }
  //   return this.options[key] as any
  // }
}
