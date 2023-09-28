import { Pipe, PipeTransform } from '@angular/core'

@Pipe({
  standalone: true,
  name: 'nwNoHtml',
  pure: true,
})
export class NwNoHtmlPipe implements PipeTransform {
  public transform(value: string) {
    try {
      return new DOMParser().parseFromString(value || '', 'text/html').body.textContent
    } catch (error) {
      console.error(error)
      return value
    }
  }
}
