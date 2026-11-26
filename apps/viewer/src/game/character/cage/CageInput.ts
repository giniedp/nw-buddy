/**
 * The input a CAGE action list reads (CAGE `ActionInputHistory`, the parts the viewer needs): per input name (lower
 * case, the game keys inputs by their lowercase CRC32) whether it is held this step, and when it was last pressed.
 *
 * @remarks
 * - {@link begin} starts a step with the physical inputs, {@link setVirtual} writes the virtual inputs the virtual
 *   input lists evaluate (they write back into the history, as the game's do).
 * - A press is a step on which an input turned held. `BackTicks` queries ({@link wasPressed}) look back that many
 *   steps; {@link clear} (`ClearInput`) drops buffered presses only, a held input stays held and does not press again.
 * - The game's history holds 60 frames; presses older than that are forgotten here too.
 */
export class CageInput {
  public static readonly HISTORY = 60

  /**
   * The current step, starts at 1
   */
  public step = 0
  private readonly held = new Map<string, boolean>()
  private readonly pressed = new Map<string, number>()
  private readonly virtual = new Set<string>()
  /**
   * The physical inputs of the current step
   */
  private readonly active = new Set<string>()

  /**
   * Starts a step: the physical inputs active now (lower case names); the others are released. Virtual inputs keep
   * their state until {@link setVirtual} writes them.
   */
  public begin(physical: Iterable<string>) {
    this.step++
    const active = this.active
    active.clear()
    for (const name of physical) {
      active.add(name)
    }
    for (const name of this.held.keys()) {
      if (this.held.get(name) && !active.has(name) && !this.virtual.has(name)) {
        this.held.set(name, false)
      }
    }
    for (const name of active) {
      this.write(name, true)
    }
  }

  /**
   * Writes a virtual input's answer for this step (lower case name)
   */
  public setVirtual(name: string, value: boolean) {
    this.virtual.add(name)
    this.write(name, value)
  }

  /**
   * Whether the input is held this step (`IfInput` without `BackTicks`)
   */
  public isHeld(name: string): boolean {
    return this.held.get(name) === true
  }

  /**
   * Whether the input was pressed within the last `backTicks` steps, this one included, and not cleared since
   */
  public wasPressed(name: string, backTicks: number): boolean {
    const age = this.pressAge(name)
    return age >= 0 && age <= backTicks && age < CageInput.HISTORY - 1
  }

  /**
   * Steps since the input's last press, 0 on the step it was pressed, -1 without a retained press
   */
  public pressAge(name: string): number {
    const at = this.pressed.get(name)
    if (at === undefined) {
      return -1
    }
    const age = this.step - at
    return age < CageInput.HISTORY ? age : -1
  }

  /**
   * `ClearInput`: drops the input's buffered press; a held input stays held
   */
  public clear(name: string) {
    this.pressed.delete(name)
  }

  private write(name: string, value: boolean) {
    const was = this.held.get(name) === true
    this.held.set(name, value)
    if (value && !was) {
      this.pressed.set(name, this.step)
    }
  }
}
