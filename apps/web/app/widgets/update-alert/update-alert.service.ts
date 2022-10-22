import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { environment } from 'apps/web/environments/environment'
import { catchError, defer, exhaustMap, filter, map, of, timer } from 'rxjs'
import { shareReplayRefCount } from '~/utils'

@Injectable({ providedIn: 'root' })
export class UpdateAlertService {

  public info$ = defer(() => timer(0, 1000 * 60 * 15))
    .pipe(exhaustMap(() => this.fetchLatestRelease()))
    .pipe(filter((it) => !!it))
    .pipe(filter((it) => it.tag_name !== `v${environment.version}`))
    .pipe(shareReplayRefCount(1))

  public constructor(private http: HttpClient) {
    //
  }

  private fetchLatestRelease() {
    return this.http.get('https://api.github.com/repos/giniedp/nw-buddy/releases')
      .pipe(map((it) => extractLatesRelease(it as any)))
      .pipe(catchError((err) => {
        console.error(err)
        return of(null as Release)
      }))
  }
}

function extractLatesRelease(data: Release[]) {
  for (const release of data) {
    if (release.draft || release.prerelease) {
      continue
    }
    for (const asset of release.assets) {
      if (asset.name.startsWith('nw-buddy.') && asset.name.endsWith('.exe')) {
        return release
      }
    }
  }
  return null
}

export interface Release {
  url:              string;
  assets_url:       string;
  upload_url:       string;
  html_url:         string;
  id:               number;
  author:           Author;
  node_id:          string;
  tag_name:         string;
  target_commitish: string;
  name:             string;
  draft:            boolean;
  prerelease:       boolean;
  created_at:       Date;
  published_at:     Date;
  assets:           Asset[];
  tarball_url:      string;
  zipball_url:      string;
  body:             string;
}

export interface Asset {
  url:                  string;
  id:                   number;
  node_id:              string;
  name:                 string;
  label:                null;
  uploader:             Author;
  content_type:         string;
  state:                string;
  size:                 number;
  download_count:       number;
  created_at:           Date;
  updated_at:           Date;
  browser_download_url: string;
}

export interface Author {
  login:               string;
  id:                  number;
  node_id:             string;
  avatar_url:          string;
  gravatar_id:         string;
  url:                 string;
  html_url:            string;
  followers_url:       string;
  following_url:       string;
  gists_url:           string;
  starred_url:         string;
  subscriptions_url:   string;
  organizations_url:   string;
  repos_url:           string;
  events_url:          string;
  received_events_url: string;
  type:                string;
  site_admin:          boolean;
}

const DUMMY = {
  "url": "https://api.github.com/repos/giniedp/nw-buddy/releases/80206021",
  "assets_url": "https://api.github.com/repos/giniedp/nw-buddy/releases/80206021/assets",
  "upload_url": "https://uploads.github.com/repos/giniedp/nw-buddy/releases/80206021/assets{?name,label}",
  "html_url": "https://github.com/giniedp/nw-buddy/releases/tag/v1.7.0-7",
  "id": 80206021,
  "author": {
    "login": "giniedp",
    "id": 225238,
    "node_id": "MDQ6VXNlcjIyNTIzOA==",
    "avatar_url": "https://avatars.githubusercontent.com/u/225238?v=4",
    "gravatar_id": "",
    "url": "https://api.github.com/users/giniedp",
    "html_url": "https://github.com/giniedp",
    "followers_url": "https://api.github.com/users/giniedp/followers",
    "following_url": "https://api.github.com/users/giniedp/following{/other_user}",
    "gists_url": "https://api.github.com/users/giniedp/gists{/gist_id}",
    "starred_url": "https://api.github.com/users/giniedp/starred{/owner}{/repo}",
    "subscriptions_url": "https://api.github.com/users/giniedp/subscriptions",
    "organizations_url": "https://api.github.com/users/giniedp/orgs",
    "repos_url": "https://api.github.com/users/giniedp/repos",
    "events_url": "https://api.github.com/users/giniedp/events{/privacy}",
    "received_events_url": "https://api.github.com/users/giniedp/received_events",
    "type": "User",
    "site_admin": false
  },
  "node_id": "RE_kwDOHH30Ys4Ex9jF",
  "tag_name": "v1.7.0-8",
  "target_commitish": "main",
  "name": "v1.7.0-8",
  "draft": false,
  "prerelease": false,
  "created_at": "2022-10-18T13:01:47Z",
  "published_at": "2022-10-18T13:05:40Z",
  "assets": [
    {
      "url": "https://api.github.com/repos/giniedp/nw-buddy/releases/assets/81414478",
      "id": 81414478,
      "node_id": "RA_kwDOHH30Ys4E2klO",
      "name": "nw-buddy.1.7.0-7.exe",
      "label": null,
      "uploader": {
        "login": "giniedp",
        "id": 225238,
        "node_id": "MDQ6VXNlcjIyNTIzOA==",
        "avatar_url": "https://avatars.githubusercontent.com/u/225238?v=4",
        "gravatar_id": "",
        "url": "https://api.github.com/users/giniedp",
        "html_url": "https://github.com/giniedp",
        "followers_url": "https://api.github.com/users/giniedp/followers",
        "following_url": "https://api.github.com/users/giniedp/following{/other_user}",
        "gists_url": "https://api.github.com/users/giniedp/gists{/gist_id}",
        "starred_url": "https://api.github.com/users/giniedp/starred{/owner}{/repo}",
        "subscriptions_url": "https://api.github.com/users/giniedp/subscriptions",
        "organizations_url": "https://api.github.com/users/giniedp/orgs",
        "repos_url": "https://api.github.com/users/giniedp/repos",
        "events_url": "https://api.github.com/users/giniedp/events{/privacy}",
        "received_events_url": "https://api.github.com/users/giniedp/received_events",
        "type": "User",
        "site_admin": false
      },
      "content_type": "application/x-msdownload",
      "state": "uploaded",
      "size": 138222842,
      "download_count": 434,
      "created_at": "2022-10-18T13:04:23Z",
      "updated_at": "2022-10-18T13:05:02Z",
      "browser_download_url": "https://github.com/giniedp/nw-buddy/releases/download/v1.7.0-7/nw-buddy.1.7.0-7.exe"
    }
  ],
  "tarball_url": "https://api.github.com/repos/giniedp/nw-buddy/tarball/v1.7.0-7",
  "zipball_url": "https://api.github.com/repos/giniedp/nw-buddy/zipball/v1.7.0-7",
  "body": "- revamp ui and navigation structure\r\n- added a new tool: Gear Builder\r\n- added Runes and Gems overview\r\n- updated to game version 1.7.0\r\n\r\n**Full Changelog**: https://github.com/giniedp/nw-buddy/compare/v1.7.0-6...v1.7.0-7"
}
