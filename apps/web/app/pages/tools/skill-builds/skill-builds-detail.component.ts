import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { asyncScheduler, combineLatest, map, subscribeOn, switchMap } from 'rxjs'
import { SkillBuildRecord, SkillBuildsStore } from '~/data'
import { AttributeRef, NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgBars, svgChevronLeft, svgRotate, svgSliders } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { observeRouteParam } from '~/utils'
import { AttributesEditorModule } from '~/widgets/attributes-editor'
import { ScreenshotModule } from '~/widgets/screenshot'
import { SkillBuilderComponent, SkillBuildValue } from '~/widgets/skill-builder/skill-builder.component'

@Component({
  standalone: true,
  selector: 'nwb-skill-builds-detail',
  templateUrl: './skill-builds-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    FormsModule,
    RouterModule,
    SkillBuilderComponent,
    IconsModule,
    ScreenshotModule,
    TooltipModule,
    LayoutModule,
    AttributesEditorModule
  ],
  host: {
    class: 'hidden xl:flex xl:flex-1 flex-col bg-base-300',
  },
})
export class SkillBuildsDetailComponent {
  protected item$ = combineLatest({
    id: observeRouteParam(this.route, 'id'),
    rows: this.store.whenLoaded$.pipe(switchMap(() => this.store.rows$)),
  })
    .pipe(subscribeOn(asyncScheduler))
    .pipe(
      map(({ id, rows }) => {
        const found = rows?.find((it) => it.record.id === id)
        return found
      })
    )

  protected attrs$ = this.item$.pipe(map((it) => it?.record?.attrs))
  protected iconBack = svgChevronLeft
  protected iconReset = svgRotate
  protected iconMenu = svgBars
  protected iconAttrs = svgSliders

  public constructor(private store: SkillBuildsStore, private route: ActivatedRoute) {
    //
  }

  protected updateModel(record: SkillBuildRecord, data: SkillBuildValue) {
    this.store.updateRecord({
      record: {
        ...record,
        weapon: data.weapon,
        tree1: data.tree1,
        tree2: data.tree2,
      },
    })
  }

  protected updateName(record: SkillBuildRecord, name: string) {
    this.store.updateRecord({
      record: {
        ...record,
        name: name,
      },
    })
  }

  protected addAttributes(record: SkillBuildRecord) {
    this.store.updateRecord({
      record: {
        ...record,
        attrs: record.attrs || {
          con: 0,
          dex: 0,
          foc: 0,
          int: 0,
          str: 0,
        },
      },
    })
  }

  protected updateAttributes(record: SkillBuildRecord, attrs: Record<AttributeRef, number>) {
    this.store.updateRecord({
      record: {
        ...record,
        attrs: attrs,
      },
    })
  }

  protected removeAttributes(record: SkillBuildRecord) {
    this.store.updateRecord({
      record: {
        ...record,
        attrs: null,
      },
    })
  }
}
