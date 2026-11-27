/**
 * Names of the permission across Chrome versions, the requests to nwbt on localhost need it
 */
const LOCAL_NETWORK_PERMISSIONS = ['loopback-network', 'local-network', 'local-network-access']

/**
 * Reports the local network permission now and on every change: denied when any name is denied, granted when all are,
 * else prompt. Never reports in browsers without the permission.
 */
export async function watchLocalNetworkPermission(report: (state: PermissionState) => void, signal: AbortSignal) {
  if (typeof navigator === 'undefined' || !navigator.permissions) {
    return
  }
  const statuses: PermissionStatus[] = []
  for (const name of LOCAL_NETWORK_PERMISSIONS) {
    try {
      statuses.push(await navigator.permissions.query({ name: name as PermissionName }))
    } catch {
      // not a permission of this browser
    }
  }
  if (!statuses.length || signal.aborted) {
    return
  }
  const update = () => {
    if (statuses.some((it) => it.state === 'denied')) {
      report('denied')
    } else if (statuses.every((it) => it.state === 'granted')) {
      report('granted')
    } else {
      report('prompt')
    }
  }
  for (const status of statuses) {
    status.addEventListener('change', update, { signal })
  }
  update()
}
