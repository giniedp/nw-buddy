import { Widget } from 'tweak-ui'

/**
 * A labeled row with a value that only changes with its props, e.g. a fact of a file. Unlike tweak-ui's `PollWidget`
 * it reads nothing on an interval.
 */
export function InfoRow(props: { label: string; value: string }) {
  return (
    <Widget label={props.label}>
      <span class="nw-info-value">{props.value}</span>
    </Widget>
  )
}
