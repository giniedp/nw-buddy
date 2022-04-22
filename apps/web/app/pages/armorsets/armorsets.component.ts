import { ChangeDetectorRef, Component, OnDestroy, OnInit, TrackByFunction } from '@angular/core'
import { ItemDefinitionMaster } from '@nw-data/types'
import { BehaviorSubject, combineLatest, map, ReplaySubject, startWith, Subject, switchMap, takeUntil } from 'rxjs'
import { NwService } from '~/core/nw'
import { ArmorsetsService } from './armorsets.service'
import { Armorset, ArmorsetGroup } from './types'

@Component({
  selector: 'nwb-armorsets',
  templateUrl: './armorsets.component.html',
  styleUrls: ['./armorsets.component.scss'],
  host: {
    class: 'page-frame',
  },
})
export class SetsComponent implements OnInit, OnDestroy {
  public armorsetGroups: ArmorsetGroup[]

  public categories: Array<{ label: string; value: string }> = []
  public categorySelection: string

  public trackGroup: TrackByFunction<ArmorsetGroup> = (i, g) => {
    return g.key
  }
  public trackSet: TrackByFunction<Armorset> = (i, s) => {
    return s.key
  }
  private data: Record<string, ArmorsetGroup[]>

  private destroy$ = new Subject()
  private filter$ = new ReplaySubject<string>(1)
  private category$ = new ReplaySubject<string>(1)

  public constructor(private service: ArmorsetsService, private nw: NwService, private cdRef: ChangeDetectorRef) {
    //
  }

  public ngOnInit(): void {
    const categorie$ = this.service.filter.pipe(
      map((data) => {
        return data.map((it) => ({
          label: it[0].toLocaleUpperCase() + it.substring(1),
          value: it,
        }))
      })
    )

    combineLatest({
      categories: categorie$,
      sets: this.service.all,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ categories, sets }) => {
        this.data = sets
        this.categories = categories
        this.category$.next(this.categories[0].value)
        this.filter$.next('')
      })

    combineLatest({
      filter: this.filter$,
      category: this.category$,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ category, filter }) => {
        let result = this.data[category]
        if (!category) {
          result = Array.from(Object.values(this.data)).flat(1)
        }
        if (filter) {
          result = result.map((it) => {
            return {
              ...it,
              sets: it.sets.filter((it) => it.name.toLocaleLowerCase().includes(filter.toLocaleLowerCase()))
            }
          })
          .filter((it) => it.sets.length > 0)
        }
        this.armorsetGroups = result
        this.categorySelection = category
        this.cdRef.markForCheck()
      })

  }

  public selectCategory(category: string) {
    this.category$.next(category)
  }

  public updateFilter(e: Event) {
    this.filter$.next((e.target as HTMLInputElement).value)
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  public translate(key: string) {
    return this.nw.translate(key)
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
