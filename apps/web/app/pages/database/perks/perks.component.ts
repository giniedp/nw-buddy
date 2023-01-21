import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { firstValueFrom } from 'rxjs'
import { CharacterStore } from '~/data'
import { NwModule } from '~/nw'
import { NwExpressionContextService } from '~/nw/expression'
import { DataTableModule } from '~/ui/data-table'
import { NavToolbarModule } from '~/ui/nav-toolbar'
import { QuicksearchModule } from '~/ui/quicksearch'
import { PerksTableAdapter } from '~/widgets/adapter'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  standalone: true,
  selector: 'nwb-perks-page',
  templateUrl: './perks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DataTableModule,
    FormsModule,
    IonicModule,
    NavToolbarModule,
    NwModule,
    OverlayModule,
    QuicksearchModule,
    RouterModule,
    ScreenshotModule,
  ],
  host: {
    class: 'layout-col',
  },
  providers: [PerksTableAdapter.provider(), NwExpressionContextService],
})
export class PerksComponent {
  protected isToolOpen = false
  public constructor(public ctx: NwExpressionContextService, char: CharacterStore) {
    firstValueFrom(char.level$).then((value) => {
      ctx.level = value
    })
  }
}
