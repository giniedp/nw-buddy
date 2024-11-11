import { animate, group, query, style, transition, trigger } from '@angular/animations'

export const LIST_COUNT_ANIMATION = trigger('fade', [
  transition(':enter, * => 0, * => -1', []),
  transition(':increment', [
    query(':enter', [style({ opacity: 0, height: 0 }), animate('300ms ease-out', style({ opacity: 1, height: '*' }))], {
      optional: true,
    }),
  ]),
  transition(':decrement', [query(':leave', [animate('300ms ease-out', style({ opacity: 0, height: 0 }))])]),
])
