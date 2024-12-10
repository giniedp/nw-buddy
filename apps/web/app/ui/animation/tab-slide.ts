import { animate, group, query, style, transition, trigger } from '@angular/animations'

export const TAB_SLIDE_ANIMATION = trigger('tabSlide', [
  transition('.tab-pane:enter', []),
  transition('* => *', [
    group([
      query('.tab-pane:leave', [animate('.15s', style({ opacity: 0 }))], { optional: true }),
      query('.tab-pane:enter', style({ height: 0, width: 0, margin: 0, padding: 0, overflow: 'hidden', opacity: 0 }), {
        optional: true,
      }),
    ]),
    style({ overflow: 'hidden' }),

    group([
      query('.tab-pane:leave', animate('.15s ease-in', style({ height: 0, width: 0, margin: 0, padding: 0 })), {
        optional: true,
      }),
      query(
        '.tab-pane:enter',
        animate('.15s ease-in', style({ height: '*', width: '*', margin: '*', padding: '*', overflow: 'visible' })),
        { optional: true },
      ),
    ]),
    query('.tab-pane:enter', animate('.15s', style({ opacity: 1 })), { optional: true }),
  ]),
])
