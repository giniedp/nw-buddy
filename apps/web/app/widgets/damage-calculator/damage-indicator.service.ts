import { Injectable, signal } from "@angular/core";

@Injectable()
export class DamageIndicatorService{
  public value = signal<string>(null)
}
