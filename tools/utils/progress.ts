import { MultiBar, Bar, Presets } from 'cli-progress'

export async function withProgressBar<T>(
  {
    name,
    input,
  }: {
    name?: string
    input: T[]
  },
  process: (input: T, index: number, log: (message: string) => void) => Promise<void>
) {
  const bar = new Bar(
    {
      format: `${name ? name + ' ' : ''}{bar} | {percentage}% | {duration_formatted} | {value}/{total} {log}`,
      clearOnComplete: false,
      hideCursor: true,
    },
    Presets.shades_grey
  )
  bar.start(input.length, 0, { log: '' })
  function log(log: string) {
    bar.update({ log })
  }
  for (let i = 0; i < input.length; i++) {
    await process(input[i], i, log).catch(console.error)
    bar.update(i + 1)
  }
  bar.stop()
}
