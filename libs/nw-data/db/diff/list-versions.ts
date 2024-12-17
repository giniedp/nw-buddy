import { Octokit } from '@octokit/core'
import { eqCaseInsensitive } from 'libs/nw-data/common/utils/caseinsensitive-compare'
import YAML from 'yaml'

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

async function listRef(client: Octokit, options: { owner: string; repo: string; branch: string }) {
  return cached(`listRef/${JSON.stringify(options)}`, async () => {
    return client
      .request('GET /repos/{owner}/{repo}/git/ref/{ref}', {
        owner: options.owner,
        repo: options.repo,
        ref: `heads/${options.branch}`,
      })
      .then((res) => res.data)
  })
}

async function listTags(client: Octokit, options: { owner: string; repo: string }) {
  return cached(`listTags/${JSON.stringify(options)}`, async () => {
    return client
      .request('GET /repos/{owner}/{repo}/tags', {
        owner: options.owner,
        repo: options.repo,
      })
      .then((res) => res.data)
  })
}

async function listFileCommits(
  client: Octokit,
  options: { owner: string; repo: string; path: string; useTags: boolean; branch: string; limit: number },
) {
  const useTags = !!options.useTags
  return cached(`listFileCommits/${JSON.stringify(options)}`, async () => {
    const tags = useTags ? await listTags(client, options) : []
    const branchSha = await listRef(client, options).then((it) => it.object.sha)
    return await client
      .request('GET /repos/{owner}/{repo}/commits', {
        owner: options.owner,
        repo: options.repo,
        path: options.path,
        sha: branchSha,
      })
      .then((res) => res.data)
      .then((commits) => {
        return Promise.all(
          commits
            .filter((it) => !useTags || tags.some((tag) => tag.commit.sha === it.sha))
            .filter((_, i) => !options.limit || i < options.limit)
            .map(async (commit) => {
              const data = await fetchDatasheet(client, {
                owner: options.owner,
                repo: options.repo,
                path: options.path,
                ref: commit.sha,
              })
              if (useTags) {
                return {
                  version: tags.find((tag) => tag.commit.sha === commit.sha).name,
                  data,
                }
              }
              return {
                version: commit.commit.committer.date,
                message: commit.commit.message,
                data,
              }
            }),
        )
      })
  })
}

async function fetchDatasheet(client: Octokit, options: { owner: string; repo: string; path: string; ref: string }) {
  return await client
    .request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner: options.owner,
      repo: options.repo,
      path: options.path,
      ref: options.ref,
    })
    .then((it) => it.data)
    .then((it) => {
      if ('content' in it && !!it.content) {
        return getJsonObject(options.path, atob(it.content))
      }
      if ('content' in it && !!it.download_url) {
        return fetch(it.download_url)
          .then((res) => res.text())
          .then((content) => getJsonObject(options.path, content))
      }
      console.log('No content found for', options.path, options.ref, it)
      return []
    })
    .catch((err) => {
      console.error(err)
      return []
    })
}

function getJsonObject(path: string, content: string) {
  if (!content) {
    return null
  }
  if (path.endsWith('.yml') || path.endsWith('.yaml')) {
    return YAML.parse(content)
  }
  if (path.endsWith('.json')) {
    return JSON.parse(content)
  }
  throw new Error(`Unknown file format: ${path}`)
}

export interface ListRecordVersionsOptions<T> {
  gitToken: string
  owner: string
  repo: string
  file: string
  branch?: string
  limit: number
  useTags: boolean
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
  const commits = await listFileCommits(client, {
    owner: options.owner,
    repo: options.repo,
    path: options.file,
    branch: options.branch,
    limit: Math.max(options.limit || 0, 0),
    useTags: options.useTags,
  })
  return commits.map(({ version, data }) => {
    return {
      version,
      data: data.find((it) => {
        return options.indexKeys.every((key, i) => eqCaseInsensitive(String(options.index[i]), String(it[key])))
      }) as T,
    }
  })
}
