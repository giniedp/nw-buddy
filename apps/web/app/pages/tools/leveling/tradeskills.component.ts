import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core'
import { RouterModule } from '@angular/router'
import { Subject } from 'rxjs'
import { NwTradeskillService } from '~/nw/tradeskill'
import { TradeskillsModule } from '~/widgets/tradeskills'

@Component({
  standalone: true,
  selector: 'nwb-tradeskills-page',
  templateUrl: './tradeskills.component.html',
  styleUrls: ['./tradeskills.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, TradeskillsModule],
  host: {
    class: 'block layout-pad',
  },
})
export class TradeskillsComponent implements OnInit, OnDestroy {
  public skills = this.service.skills

  public categories = this.service.categories
  public selected: string

  private destroy$ = new Subject()

  public constructor(private service: NwTradeskillService) {
    //
  }

  public skillsByCategory(name: string) {
    return this.service.skillsByCategory(name)
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
