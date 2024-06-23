import { BrowserWindow, WebContents, shell } from "electron"

export function prepareWebContents(contents: WebContents, window: BrowserWindow) {
  contents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    callback({ requestHeaders: { Origin: '*', ...details.requestHeaders } })
  })
  contents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'access-control-allow-origin': ['*'],
      },
    })
  })
  contents.setWindowOpenHandler(({ url }) => {
    if (isExternalUrl(url)) {
      shell.openExternal(url)
    } else {
      window.webContents.send('open-tab', url)
    }
    return {
      action: 'deny',
    }
  })
}

function isExternalUrl(url: string) {
  return false
}
