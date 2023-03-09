import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { combineLatest } from 'rxjs'
import { CharacterStore } from '~/data'
import { NwModule } from '~/nw'

@Component({
  standalone: true,
  selector: 'nwb-character-avatar',
  template: `
    <div class="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2" *ngIf="vm$ | async; let vm">
      <img [src]="vm.image" *ngIf="vm.image"/>
      <span *ngIf="!vm.image">{{ vm.name || '?' }}</span>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule],
  host: {
    class: 'inline avatar',
  },
})
export class CharacterAvatarComponent {

  protected vm$ = combineLatest({
    image: this.store.imageUrl$,
    name: this.store.name$
  })

  public constructor(private store: CharacterStore) {
    //
  }
}
