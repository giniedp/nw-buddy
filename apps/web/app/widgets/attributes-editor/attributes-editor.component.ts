import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy, Input, OnInit, Output } from '@angular/core'
import { isEqual } from 'lodash'
import { BehaviorSubject, combineLatest, distinctUntilChanged, tap } from 'rxjs'
import { NwModule } from '~/nw'
import { NW_MAX_CHARACTER_LEVEL } from '~/nw/utils/constants'
import { IconsModule } from '~/ui/icons'
import { svgAngleLeft, svgAnglesLeft } from '~/ui/icons/svg'
import { AttributeName, AttributesStore } from './attributes.store'

@Component({
  standalone: true,
  selector: 'nwb-attributes-editor',
  templateUrl: './attributes-editor.component.html',
  styleUrls: ['./attributes-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, IconsModule],
  providers: [AttributesStore],
  host: {
    class: 'layout-content',
  },
})
export class AttributesEditorComponent implements OnInit {

  @Input()
  public set level(value: number) {
    this.level$.next(value)
  }
  public get level() {
    return this.level$.value
  }

  @Input()
  public set base(value: Record<AttributeName, number>) {
    this.base$.next(value)
  }
  public get base() {
    return this.base$.value
  }

  @Input()
  public set assigned(value: Record<AttributeName, number>) {
    this.assigned$.next(value)
  }
  public get assigned() {
    return this.assigned$.value
  }

  @Output()
  public assignedChanged = this.store.assigned$.pipe(distinctUntilChanged((a, b) => isEqual(a, b)))

  protected stats$ = this.store.stats$
  protected pointsSpent$ = this.store.pointsSpent$
  protected pointsAvailable$ = this.store.pointsAvailable$
  protected arrowLeft = svgAngleLeft
  protected arrowsLeft = svgAnglesLeft
  protected trackById = (i: number) => i
  private level$ = new BehaviorSubject<number>(NW_MAX_CHARACTER_LEVEL)
  private base$ = new BehaviorSubject<Record<AttributeName, number>>({
    con: 0,
    dex: 0,
    foc: 0,
    int: 0,
    str: 0
  })
  private assigned$ = new BehaviorSubject<Record<AttributeName, number>>({
    con: 0,
    dex: 0,
    foc: 0,
    int: 0,
    str: 0
  })

  public constructor(private store: AttributesStore) {
    //
  }

  public ngOnInit() {
    const src = combineLatest({
      level: this.level$,
      base: this.base$,
      assigned: this.assigned$
    })
    this.store.loadLazy(src)
  }

  protected increment(name: AttributeName, step = 1) {
    this.store.increment({ attribute: name, value: step })
  }

  protected decrement(name: AttributeName, step = 1) {
    this.store.decrement({ attribute: name, value: step })
  }
}
