import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class QuicksearchService {
  public readonly query = new BehaviorSubject('')
}
