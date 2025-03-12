import * as w3name from 'w3name'
import { base64ToBuffer, bufferToBase64 } from '~/utils/buffer-utils'

export async function udpateIpnsRevision(privateKeyAsBase64: string, value: string) {
  const { name, revision, key } = await createIpnsRevision(privateKeyAsBase64)
  const newRevision = await (revision ? w3name.increment(revision, value) : w3name.v0(name, value))
  await w3name.publish(newRevision, name.key)
  return { key, name, revision: newRevision }
}

export async function createIpnsRevision(
  privateKeyAsBase64?: string,
): Promise<{ key: string; name: w3name.WritableName; revision: w3name.Revision }> {
  if (!privateKeyAsBase64) {
    const name = await w3name.create()
    return {
      key: await bufferToBase64(name.key.bytes.buffer as ArrayBuffer),
      name: name,
      revision: null,
    }
  }
  const key = await base64ToBuffer(privateKeyAsBase64).then((it) => new Uint8Array(it))
  const name = await w3name.from(key)
  const revision = await w3name.resolve(name)
  return {
    key: privateKeyAsBase64,
    name: name,
    revision: revision,
  }
}

export async function getIpnsRevision(publicName: string) {
  const name = w3name.parse(publicName)
  const revision = await w3name.resolve(name)
  return revision
}
