import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { firstValueFrom } from 'rxjs'
import { NwModule } from '~/nw'
import { CharacterPreferencesService } from '~/preferences'
import { DataTableAdapter, DataTableModule } from '~/ui/data-table'
import { QuicksearchModule } from '~/ui/quicksearch'
import { PerksTableAdapter } from '~/widgets/adapter'
import { ExprContextService } from '~/widgets/adapter/exp-context.service'

@Component({
  standalone: true,
  selector: 'nwb-perks-page',
  templateUrl: './perks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule, OverlayModule, NwModule, QuicksearchModule, DataTableModule],
  host: {
    class: 'layout-col bg-base-300 rounded-md overflow-clip',
  },
  providers: [
    DataTableAdapter.provideClass(PerksTableAdapter),
    ExprContextService
  ]
})
export class PerksComponent {

  protected isToolOpen = false
  public constructor(public ctx: ExprContextService, char: CharacterPreferencesService) {
    firstValueFrom(char.level$).then((value) => {
      ctx.level = value
    })
  }
}
