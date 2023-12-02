export function cappedValue() {
  let total = 0
  let overflow = 0
  function add(value: number, limit: number) {
    if (overflow < 0) {
      overflow += value
      if (overflow < 0) {
        // overflow has been comsumed by the value
        return
      }
      value = overflow
      overflow = 0
    }

    if (!limit) {
      total += value
      return
    }
    if (total >= limit) {
      overflow += value
      return
    }

    total += value
    if (total > limit) {
      overflow += total - limit
      total = limit
    }
  }

  function subtract(value: number, limit: number) {
    if (overflow > 0) {
      overflow += value
      if (overflow > 0) {
        // overflow has been comsumed by the value
        return
      }
      value = overflow
      overflow = 0
    }
    total += value
    if (total < limit) {
      overflow += total - limit
      total = limit
    }
  }

  return {
    get total() {
      return total
    },
    get overflow() {
      return overflow
    },
    add: (value: number, limit?: number) => {
      if (limit == null) {
        total += value
      } else if (value < 0) {
        subtract(value, limit)
      } else {
        add(value, limit)
      }
    },
  }
}
