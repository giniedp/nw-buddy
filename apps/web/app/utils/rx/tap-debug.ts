import { tap } from 'rxjs'

export function tapDebug<T>(tag: string, options?: { disabled?: boolean; transform?: (value: T) => any }) {
  return tap<T>({
    next(value) {
      if (!options?.disabled) {
        const data = options?.transform ? options.transform(value) : value
        console.log(`%c[${tag}: Next]`, 'background: #009688; color: #fff; padding: 2px; font-size: 10px;', data)
      }
    },
    error(error) {
      if (!options?.disabled) {
        console.log(`%[${tag}: Error]`, 'background: #E91E63; color: #fff; padding: 2px; font-size: 10px;', error)
      }
    },
    complete() {
      if (!options?.disabled) {
        console.log(`%c[${tag}]: Complete`, 'background: #00BCD4; color: #fff; padding: 2px; font-size: 10px;')
      }
    },
  })
}
