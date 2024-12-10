import { animate, animateChild, group, query, sequence, state, style, transition, trigger } from '@angular/animations'

export const IS_HIDDEN_ANIM = trigger('isHidden', [
  state(
    'true',
    style({
      display: 'none',
      padding: 0,
      margin: 0,
      opacity: 0,
    }),
  ),
  state(
    'false',
    style({
      padding: '*',
      margin: '*',
      opacity: 1,
    }),
  ),
  transition('true => false', [
    style({ display: 'block' }),
    group([animate('0.3s ease'), query('@inOut', animateChild(), { optional: true })]),
  ]),
  transition('false => true', [
    style({ display: 'block' }),
    group([query('@inOut', animateChild(), { optional: true }), animate('0.3s ease')]),
  ]),
])

export const IN_OUT_ANIM = trigger('inOut', [
  transition(':enter', [
    style({ opacity: 0, height: 0, margin: 0, padding: 0 }),
    sequence([
      animate('0.15s ease', style({ height: '*', margin: '*', padding: '*' })),
      animate('0.15s ease', style({ opacity: 1 })),
    ]),
  ]),
  transition(':leave', [
    style({ opacity: '*', height: '*', margin: '*', padding: '*' }),
    sequence([
      animate('0.15s ease', style({ opacity: 0 })),
      animate('0.15s ease', style({ height: 0, margin: 0, padding: 0 })),
    ]),
  ]),
])
