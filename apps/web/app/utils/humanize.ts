export function humanize(value: any) {
  if (value == null) {
    return ''
  }
  return String(value)
    .replace(/((1H)|(2H)|(PvP)|([A-Z]+))/g, (it) => ` ${it}`)
    .replace(/[\\\/\-+]+/g, (it) => ` ${it} `)
    .replace(/[_]/g, ' ')
    .replace(/\s+/, '')
    .trim()
}
