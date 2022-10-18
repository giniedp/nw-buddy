import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { XpTableModule } from '~/widgets/xp-table';

@Component({
  standalone: true,
  selector: 'nwb-level-xp-page',
  templateUrl: './level-xp.component.html',
  styleUrls: ['./level-xp.component.scss'],
  imports: [CommonModule, XpTableModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LevelXpComponent {
  //
}
