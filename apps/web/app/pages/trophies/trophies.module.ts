import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TrophiesRoutingModule } from './trophies-routing.module';
import { TrophiesComponent } from './trophies.component';
import { NwModule } from '~/core/nw';


@NgModule({
  imports: [
    CommonModule,
    TrophiesRoutingModule,
    NwModule
  ],
  declarations: [
    TrophiesComponent
  ],

})
export class TrophiesModule { }
