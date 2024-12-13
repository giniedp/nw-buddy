import { Octokit } from '@octokit/core'
import { eqCaseInsensitive } from 'libs/nw-data/common/utils/caseinsensitive-compare'

const REPO = 'nw-buddy-data'
const OWNER = 'giniedp'
const HISTORY_LIMIT = 5

let client: Octokit = null
function getClient(apiKey: string) {
  if (!apiKey) {
    throw new Error('API key is required')
  }
  if (!client) {
    client = new Octokit({ auth: apiKey })
  }
  return client
}

const cache = {}
function cached<T>(key: string, fn: () => T): T {
  if (!cache[key]) {
    cache[key] = fn()
  }
  return cache[key]
}

async function listTags(client: Octokit) {
  return cached('listTags', async () => {
    return client
      .request('GET /repos/{owner}/{repo}/tags', {
        owner: OWNER,
        repo: REPO,
      })
      .then((res) => res.data)
  })
}

async function listFileCommits(client: Octokit, filePath: string) {
  return cached(`listFileCommits:${filePath}`, async () => {
    const tags = await listTags(client)
    return await client
      .request('GET /repos/{owner}/{repo}/commits', {
        owner: OWNER,
        repo: REPO,
        path: filePath,
      })
      .then((res) => res.data)
      .then((commits) => {
        return Promise.all(
          commits
            .filter((it) => tags.some((tag) => tag.commit.sha === it.sha))
            .filter((_, i) => i < HISTORY_LIMIT)
            .map(async (commit) => {
              return {
                version: tags.find((tag) => tag.commit.sha === commit.sha).name,
                data: await fetchDatasheet(client, filePath, commit.sha),
              }
            }),
        )
      })
  })
}

async function fetchDatasheet(client: Octokit, filePath: string, sha: string) {
  return await client
    .request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner: OWNER,
      repo: REPO,
      path: filePath,
      ref: sha,
    })
    .then((it) => it.data)
    .then((it) => {
      if ('content' in it && !!it.content) {
        return JSON.parse(atob(it.content)) as Array<any>
      }
      if ('content' in it && !!it.download_url) {
        return fetch(it.download_url).then((res) => res.json())
      }
      console.log('No content found for', filePath, sha, it)
      return []
    })
    .catch((err) => {
      console.error(err)
      return []
    })
}

export interface ListRecordVersionsOptions<T> {
  gitToken: string
  uri: string
  index: Array<string | number>
  indexKeys: Array<keyof T>
}

export interface RecordVersion<T> {
  version: string
  data: T
}

export async function listRecordVersions<T>(options: ListRecordVersionsOptions<T>) {
  if (!options.gitToken) {
    return null
  }
  const client = getClient(options.gitToken)
  const filePath = `live/${options.uri}`
  const commits = await listFileCommits(client, filePath)
  return commits.map(({ version, data }) => {
    return {
      version,
      data: data.find((it) => {
        return options.indexKeys.every((key, i) => eqCaseInsensitive(String(options.index[i]), String(it[key])))
      }) as T,
    }
  })
}
