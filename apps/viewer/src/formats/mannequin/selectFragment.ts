import type { AdbDocument, AdbFragment } from './animationDatabase'

/**
 * A fragment variant with every tag it needs: its own and those of the sub databases it came from
 */
export interface FragmentCandidate {
  fragment: AdbFragment
  tags: string[]
}

/**
 * The sub databases of an ADB that apply to a fragment under a tag state: all their tags set, and the fragment listed
 * (or no list)
 */
export function adbSubDatabases(
  adb: AdbDocument,
  fragment: string,
  tags: Iterable<string>,
): AdbDocument['subDatabases'] {
  const state = tagState(tags)
  const name = fragment.toLowerCase()
  return adb.subDatabases.filter(
    (it) =>
      it.tags.every((tag) => state.has(tag.toLowerCase())) &&
      (!it.fragments.length || it.fragments.some((id) => id.toLowerCase() === name)),
  )
}

/**
 * The best variant for a tag state: every tag it needs is set, the most specific one (the most tags) wins, document
 * order breaks ties. Variants with frag tags rank after those without, no frag tags are requested.
 *
 * @remarks
 * Approximates CAnimationDatabase::FindBestMatchingTag, which ranks by the summed tag priorities. Tags compare without
 * regard to case.
 */
export function selectFragmentVariant(
  candidates: FragmentCandidate[],
  tags: Iterable<string>,
): FragmentCandidate | null {
  const state = tagState(tags)
  let best: FragmentCandidate | null = null
  let bestScore = -Infinity
  for (const candidate of candidates) {
    if (!candidate.tags.every((tag) => state.has(tag.toLowerCase()))) {
      continue
    }
    const score = candidate.tags.length * 2 - (candidate.fragment.fragTags.length ? 1 : 0)
    if (score > bestScore) {
      best = candidate
      bestScore = score
    }
  }
  return best
}

/**
 * The options of the best variant for a tag state: the variants with the same tags and frag tags as the best one, in
 * document order. The game picks one at random (`OPTION_IDX_RANDOM`).
 */
export function selectFragmentOptions(candidates: FragmentCandidate[], tags: Iterable<string>): FragmentCandidate[] {
  const best = selectFragmentVariant(candidates, tags)
  if (!best) {
    return []
  }
  const key = optionKey(best)
  return candidates.filter((it) => optionKey(it) === key)
}

function optionKey(candidate: FragmentCandidate) {
  const tags = candidate.tags.map((it) => it.toLowerCase()).sort()
  const fragTags = candidate.fragment.fragTags.map((it) => it.toLowerCase()).sort()
  return `${tags.join('+')}|${fragTags.join('+')}`
}

function tagState(tags: Iterable<string>): Set<string> {
  const result = new Set<string>()
  for (const tag of tags) {
    result.add(tag.toLowerCase())
  }
  return result
}
