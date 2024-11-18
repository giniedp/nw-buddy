import { animate, style, transition, trigger } from '@angular/animations'

export const FADE_ANIMATION = trigger('fade', [
  //transition(':enter', []),
  transition(':enter', [style({ opacity: 0 }), animate('0.15s ease-out', style({ opacity: '*' }))]),
  transition(':leave', [style({ opacity: '*' }), animate('0.15s ease-out', style({ opacity: 0 }))]),
])
