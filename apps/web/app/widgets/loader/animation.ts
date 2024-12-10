import { animate, group, query, style, transition, trigger } from '@angular/animations'

export const SMOOTH_SWAP_ANIMATION = trigger('smoothSwap', [
  transition(':enter', []),
  // Trigger this whenever the state changes after init.
  transition('* => *', [
    // Fade out the existing text while keeping the container at the same size.
    // To do this, we have to group the element entering with the element leaving. If we only transition the leaving
    // element, the entering element will immediately appear. We also make sure the entering element doesn't take
    // up any space when it enters, so the container's size remains the same.
    // You will also see `{ optional: true}` on all the leaving and entering elements. This is to prevent a console
    // error that Angular throws when it can't find the queried element, which could be the case if nothing is
    // leaving or entering when this first initializes.
    group([
      query(':leave', animate('.15s', style({ opacity: 0 })), { optional: true }),
      query(':enter', style({ height: 0, width: 0, margin: 0, padding: 0, overflow: 'hidden', opacity: 0 }), {
        optional: true,
      }),
    ]),
    // Since we're about to expand the entering text by bringing its width and height from 0 to auto, it may be
    // extremely long and, even though it's invisible, cause the scroll size to increase dramatically as it is still
    // taking up space. To prevent this, we hide any overflow.
    style({ overflow: 'hidden' }),
    // Shrink the leaving element to nothing while expanding the entering element to its automatic size. This will
    // also cause the container to transition to its automatic size.
    group([
      query(':leave', animate('.15s ease-in', style({ height: 0, width: 0, margin: 0, padding: 0 })), {
        optional: true,
      }),
      query(
        ':enter',
        animate('.15s ease-in', style({ height: '*', width: '*', margin: '*', padding: '*', overflow: 'visible' })),
        { optional: true },
      ),
    ]),
    // Now that everything is the correct size, fade in the entering element.
    query(':enter', animate('.15s', style({ opacity: 1 })), { optional: true }),
  ]),
])
