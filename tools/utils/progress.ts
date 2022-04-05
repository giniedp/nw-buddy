import { MultiBar, Presets } from "cli-progress"

export async function processArrayWithProgress<T>(input: T[], process: (input: T, index: number) => Promise<void>) {
  const bar = new MultiBar({
    clearOnComplete: false,
    hideCursor: true,

  }, Presets.shades_grey)
  const b1 = bar.create(0, 0)
  b1.setTotal(input.length)
  for (let i = 0; i < input.length; i++) {
    await process(input[i], i).catch(console.error)
    b1.update(i + 1)
  }
  bar.stop()
}
