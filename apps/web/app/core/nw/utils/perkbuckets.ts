import { Perkbuckets, Perks } from "@nw-data/types";
import { uniq } from "lodash";

export function getPerkbucketPerkIds(bucket: Perkbuckets) {
  return Object.keys(bucket || {})
    .filter((it) => it.match(/Perk\d+/))
    .map((it) => bucket[it])
    .filter((it) => !!it)
}

export function getPerkbucketPerks(bucket: Perkbuckets, perks: Map<string, Perks>) {
  return uniq(getPerkbucketPerkIds(bucket)).map((it) => perks.get(it))
}
