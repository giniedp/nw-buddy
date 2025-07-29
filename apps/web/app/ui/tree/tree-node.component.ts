import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'

@Component({
  selector: 'nwb-tree-node',
  templateUrl: './tree-node.component.html',
  styleUrl: './tree-node.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class TreeNodeComponent {}
