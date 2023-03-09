import { NgModule } from '@angular/core'
import { CharacterAvatarComponent } from './character-avatar.component'
import { CharacterSheetComponent } from './character-sheet.component'

@NgModule({
  imports: [CharacterSheetComponent, CharacterAvatarComponent],
  exports: [CharacterSheetComponent, CharacterAvatarComponent],
})
export class CharacterModule {}
