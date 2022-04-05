import { Observable } from "rxjs";

export abstract class TranslateSource {
  public abstract loadTranslations(lang: string): Observable<Record<string, string>>
}
