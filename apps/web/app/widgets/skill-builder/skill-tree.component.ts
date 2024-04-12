import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { NW_MAX_WEAPON_LEVEL } from '@nw-data/common'
import { isEqual, transform } from 'lodash'
import {
  BehaviorSubject,
  ReplaySubject,
  combineLatest,
  defer,
  distinctUntilChanged,
  map,
  switchMap,
  takeUntil,
} from 'rxjs'
import { NwModule } from '~/nw'
import { NwWeaponTypesService } from '~/nw/weapon-types'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { SkillTreeCell } from './skill-tree.model'
import { SkillTreeStore } from './skill-tree.store'
import { toSignal } from '@angular/core/rxjs-interop'
import { animate, state, style, transition, trigger } from '@angular/animations'

@Component({
  standalone: true,
  selector: 'nwb-skill-tree',
  templateUrl: './skill-tree.component.html',
  styleUrls: ['./skill-tree.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule, LayoutModule],
  providers: [
    SkillTreeStore,
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: SkillTreeComponent,
    },
  ],
  host: {
    class: 'layout-content',
  },
  animations: [
    trigger('fade', [
      transition(':enter', [style({ opacity: 0 }), animate('0.150s ease-out', style({ opacity: 1 }))]),
      transition(':leave', [style({ opacity: 1 }), animate('0.150s ease-out', style({ opacity: 0 }))]),
    ]),
  ],
})
export class SkillTreeComponent implements ControlValueAccessor, OnInit {
  @Input()
  public set weaponTag(value: string) {
    this.weapon$.next(value)
  }
  @Input()
  public set treeID(value: number) {
    this.treeID$.next(value)
  }
  @Input()
  public set value(value: string[]) {
    this.resultValue = value
    this.value$.next(value)
  }
  public get value() {
    return this.resultValue
  }

  @Input()
  public set points(value: number) {
    this.points$.next(value)
  }

  @Input()
  public disabled = false

  protected rows = toSignal(this.store.rows$)
  protected spent$ = this.store.selection$.pipe(map((it) => it?.length || 0))
  protected colsClass = this.store.numCols$.pipe(map((it) => `grid-cols-${it}`))
  protected weaponType$ = defer(() => this.weapon$).pipe(switchMap((tag) => this.weaponTypes.forWeaponTag(tag)))
  protected title$ = defer(() =>
    combineLatest({
      type: this.weaponType$,
      id: this.treeID$,
    }),
  ).pipe(map(({ type, id }) => (id === 0 ? type?.Tree1Name : type?.Tree2Name)))

  private resultValue: string[]
  private weapon$ = new ReplaySubject<string>(1)
  private treeID$ = new ReplaySubject<number>(1)
  private value$ = new ReplaySubject<string[]>(1)
  private points$ = new BehaviorSubject<number>(NW_MAX_WEAPON_LEVEL - 1)

  protected touched = false
  protected trackByIndex = (i: number) => i
  protected onChange = (value: unknown) => {}
  protected onTouched = () => {}

  public constructor(
    private store: SkillTreeStore,
    private weaponTypes: NwWeaponTypesService,
  ) {
    //
  }

  public ngOnInit(): void {
    this.store.loadTree(
      combineLatest({
        weapon: this.weapon$,
        tree: this.treeID$,
        points: this.points$,
        selection: this.value$,
      }),
    )

    this.store.whenLoaded$
      .pipe(switchMap(() => this.store.selection$))
      .pipe(distinctUntilChanged((a, b) => isEqual(a, b)))
      .pipe(takeUntil(this.store.destroy$))
      .subscribe((value) => {
        this.onChange?.(value)
        this.resultValue = value
      })
  }

  public writeValue(value: string[]): void {
    this.value = value
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn
  }

  public setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled
  }

  protected toggle(cell: SkillTreeCell) {
    if (this.disabled) {
      return
    }
    if (cell.checked) {
      this.store.removeAbility(cell.value)
    } else if (cell.unlocked) {
      this.store.addAbility(cell.value)
    }
  }
}
