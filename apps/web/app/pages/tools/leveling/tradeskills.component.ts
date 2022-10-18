import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core'
import { RouterModule } from '@angular/router'
import { Subject } from 'rxjs'
import { NwService } from '~/nw'
import { TradeskillsModule } from '~/widgets/tradeskills'

@Component({
  standalone: true,
  selector: 'nwb-tradeskills-page',
  templateUrl: './tradeskills.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, TradeskillsModule],
  host: {
    class: 'layout-col layout-pad'
  }
})
export class TradeskillsComponent implements OnInit, OnDestroy {
  public get skills() {
    return this.nw.tradeskills.skills
  }

  public get categories() {
    return this.nw.tradeskills.categories
  }

  public selected: string

  private destroy$ = new Subject()

  public constructor(private nw: NwService) {
    //
  }

  public skillsByCategory(name: string) {
    return this.nw.tradeskills.skillsByCategory(name)
  }

  public ngOnInit(): void {}

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  public isActive(category: string, index: number) {
    if (!this.selected) {
      return index == 0
    }
    return this.selected === category
  }
}
