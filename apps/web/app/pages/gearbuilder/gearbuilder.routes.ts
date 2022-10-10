import { Component, NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { GearbuilderEntryComponent } from './gearbuilder-entry.component'
import { GearbuilderComponent } from './gearbuilder.component'

export const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: GearbuilderComponent,
  },
  {
    path: ':id',
    component: GearbuilderEntryComponent,
  },
]
