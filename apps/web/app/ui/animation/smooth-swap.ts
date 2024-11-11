import { animate, group, query, style, transition, trigger } from '@angular/animations'

export const SMOOTH_SWAP_ANIMATION = trigger('smoothSwap', [
  transition(':enter', []),
  transition('* => *', [
    group([
      query('[swap]:leave', animate('.2s', style({ opacity: 0 })), { optional: true }),
      query('[swap]:enter', style({ height: 0, margin: 0, padding: 0, overflow: 'hidden', opacity: 0 }), {
        optional: true,
      }),
    ]),
    style({ overflow: 'hidden' }),
    group([
      query('[swap]:leave', animate('.3s ease-in', style({ height: 0, margin: 0, padding: 0 })), {
        optional: true,
      }),
      query(
        '[swap]:enter',
        animate('.3s ease-in', style({ height: '*', margin: '*', padding: '*', overflow: 'visible' })),
        {
          optional: true,
        },
      ),
    ]),
    query('[swap]:enter', animate('.4s', style({ opacity: 1 })), { optional: true }),
  ]),
])
