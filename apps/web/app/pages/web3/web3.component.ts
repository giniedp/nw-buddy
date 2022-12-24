import { Dialog } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { filter, switchMap } from 'rxjs'
import { SkillBuildRecord, SkillBuildsDB } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgCircleExclamation, svgShareNodes } from '~/ui/icons/svg'
import { ConfirmDialogComponent, PromptDialogComponent } from '~/ui/layout'
import { deferState, observeRouteParam } from '~/utils'
import { AttributesEditorModule } from '~/widgets/attributes-editor'
import { SkillBuilderComponent } from '~/widgets/skill-builder'
import { Web3Service } from './web3.service'

@Component({
  standalone: true,
  selector: 'nwb-web3',
  templateUrl: './web3.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, SkillBuilderComponent, IconsModule, AttributesEditorModule],
  host: {
    class: 'layout-content',
  },
})
export class Web3Component {

  protected iconError = svgCircleExclamation
  protected iconInfo = svgCircleExclamation
  protected iconShare = svgShareNodes

  protected state$ = deferState(() =>
  observeRouteParam(this.route, 'cid').pipe(switchMap((info) => this.web3.readObject(info)))
  )

  public constructor(private route: ActivatedRoute, private router: Router, private web3: Web3Service, private dialog: Dialog, private skillsDb: SkillBuildsDB) {
    //
  }

  public importSkillBuild(value: SkillBuildRecord) {
    PromptDialogComponent.open(this.dialog, {
      data: {
        title: 'Name',
        body: 'Choose a name for this build',
        input: value.name,
        positive: 'OK',
        negative: 'Cancel'
      }
    })
    .closed
    .pipe(filter((it) => it != null))
    .pipe(switchMap((name) => {
      const record = {
        ...value,
        id: null,
        name: name
      }
      return this.skillsDb.create(record)
    }))
    .subscribe({
      next: (record) => {
        this.router.navigate(['skill-trees', record.id])
      },
      error: () => {
        ConfirmDialogComponent.open(this.dialog, {
          data: {
            title: 'Error',
            body: 'Failed to import',
            positive: 'Close'
          }
        })
      }
    })
  }
}
