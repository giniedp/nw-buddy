import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { asyncScheduler, combineLatest, map, subscribeOn, switchMap } from 'rxjs'
import { SkillBuildRecord, SkillBuildsStore } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgChevronLeft, svgEraser } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { observeRouteParam } from '~/utils'
import { ScreenshotModule } from '~/widgets/screenshot'
import { SkillBuilderComponent, SkillBuildValue } from '~/widgets/skill-builder/skill-builder.component'

@Component({
  standalone: true,
  selector: 'nwb-skill-builds-detail',
  templateUrl: './skill-builds-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, RouterModule, SkillBuilderComponent, IconsModule, ScreenshotModule, TooltipModule],
  host: {
    class: 'layout-content',
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

  protected iconBack = svgChevronLeft
  protected iconReset = svgEraser

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
}
