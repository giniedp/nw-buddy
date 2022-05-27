import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { QuicksearchInputComponent } from './quicksearch-input.component'
import { FormsModule } from '@angular/forms'

@NgModule({
  declarations: [QuicksearchInputComponent],
  exports: [QuicksearchInputComponent],
  imports: [CommonModule, FormsModule],
})
export class QuicksearchModule {}
