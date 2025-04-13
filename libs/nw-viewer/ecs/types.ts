export interface AbstractType<T> extends Function {
  prototype: T;
}

export interface ConstructorType<T> extends Function {
  new (...args: any[]): T;
}

export class GameType<T> {
  private description: string
  public constructor(description: string) {
    this.description = description
  }
  public toString() {
    return `GameType ${this.description}`
  }
}
