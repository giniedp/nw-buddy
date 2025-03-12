import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'

export interface GearsetLoadoutItemState {}

@Injectable()
export class GearsetLoadoutItemStore extends ComponentStore<GearsetLoadoutItemState> {}
