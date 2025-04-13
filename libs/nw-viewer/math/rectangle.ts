export interface Rectangle {
  x: number
  y: number
  w: number
  h: number
}

export function intersectRectangles(rect1: Rectangle, rect2: Rectangle, out?: Rectangle): Rectangle {
  out = out || {
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  }

  let t1 = rect1.x + rect1.w
  let t2 = rect2.x + rect2.w
  const rMin = t1 < t2 ? t1 : t2

  t1 = rect1.y + rect1.h
  t2 = rect2.y + rect2.h
  const bMin = t1 < t2 ? t1 : t2

  const xMax = rect1.x > rect2.x ? rect1.x : rect2.x
  const yMax = rect1.y > rect2.y ? rect1.y : rect2.y

  if (xMax < rMin && yMax < bMin) {
    out.x = xMax
    out.y = yMax
    out.w = rMin - xMax
    out.h = bMin - yMax
  } else {
    out.x = 0
    out.y = 0
    out.w = 0
    out.h = 0
  }
  return out
}
