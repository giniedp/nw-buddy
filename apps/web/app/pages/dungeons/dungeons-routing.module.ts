import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DungeonDetailComponent } from './dungeon-detail.component';
import { DungeonLootComponent } from './dungeon-loot.component';
import { DungeonMutationComponent } from './dungeon-mutation.component';
import { DungeonsComponent } from './dungeons.component';

const routes: Routes = [
  {
    path: '',
    component: DungeonsComponent,
    children: [
      {
        path: ':id',
        component: DungeonDetailComponent,
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'loot'
          },
          {
            path: 'loot',
            component: DungeonLootComponent,
          },
          {
            path: 'mutation/:id',
            component: DungeonMutationComponent,
          }
        ]
      }
    ]
  },
]
;

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DungeonsRoutingModule { }
