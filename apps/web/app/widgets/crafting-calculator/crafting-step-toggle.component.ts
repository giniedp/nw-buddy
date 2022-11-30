import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, forwardRef, HostBinding, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'nwb-crafting-step-toggle',
  templateUrl: './crafting-step-toggle.component.html',
  styleUrls: ['./crafting-step-toggle.component.scss'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi:true,
      useExisting: forwardRef(() => CraftingStepToggleComponent)
    }
  ]
})
export class CraftingStepToggleComponent {

  @Input()
  public open: boolean

  public openChanges = new EventEmitter<boolean>()

  @Input()
  @HostBinding('class.disabled')
  public disabled: boolean
}

