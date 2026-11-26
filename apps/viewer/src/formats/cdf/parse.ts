/**
 * A character definition (`.cdf`): the skeleton and the attachments of a character
 */
export interface CdfDocument {
  model: {
    /**
     * The skeleton (`.chr`), every `.cdf` of the game has one
     */
    file: string
    material: string
  }
  attachments: CdfAttachment[]
}

/**
 * An attachment of a character definition, its attributes as stored (empty strings for missing ones)
 */
export interface CdfAttachment {
  /**
   * `CA_SKIN`, `CA_CLOTH`, `CA_BONE`, `CA_FACE`, `CA_PROX`, `CA_PROW`, `CA_CLOTH_COLLISION`
   */
  type: string
  name: string
  /**
   * The mesh: `.skin` (skins), `.cloth` (cloth), `.cgf` or a nested `.cdf` (bone attachments)
   */
  binding: string
  material: string
  boneName: string
  /**
   * The `Flags` attribute, 0 when missing, see {@link isHiddenAttachment}
   */
  flags: number
}

/**
 * Lumberyard `FLAGS_ATTACH_HIDE_ATTACHMENT` (IAttachment.h): the game does not draw the attachment until code shows
 * it at runtime (e.g. alternative gear and heads of story characters, outline shells)
 */
const FLAG_HIDE_ATTACHMENT = 0x01

/**
 * Whether the game hides the attachment by default, see {@link FLAG_HIDE_ATTACHMENT}
 */
export function isHiddenAttachment(attachment: CdfAttachment) {
  return (attachment.flags & FLAG_HIDE_ATTACHMENT) !== 0
}

/**
 * Parses the xml of a `.cdf` file (`<CharacterDefinition>`), like nwbt `formats/cdf`
 */
export function parseCdf(xml: string): CdfDocument {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  const error = doc.querySelector('parsererror')
  if (error) {
    throw new Error(`Invalid cdf xml: ${error.textContent}`)
  }
  const root = doc.documentElement
  if (root.nodeName !== 'CharacterDefinition') {
    throw new Error(`Not a character definition: <${root.nodeName}>`)
  }
  const model = root.querySelector(':scope > Model')
  return {
    model: {
      file: model?.getAttribute('File') ?? '',
      material: model?.getAttribute('Material') ?? '',
    },
    attachments: [...root.querySelectorAll(':scope > AttachmentList > Attachment')].map((it) => ({
      type: it.getAttribute('Type') ?? '',
      name: it.getAttribute('AName') ?? '',
      binding: it.getAttribute('Binding') ?? '',
      material: it.getAttribute('Material') ?? '',
      boneName: it.getAttribute('BoneName') ?? '',
      flags: Number.parseInt(it.getAttribute('Flags') ?? '0', 10) || 0,
    })),
  }
}

/**
 * The attachments drawn as the character's body: skins and cloth with a mesh, like nwbt `SkinAndClothAttachments`.
 * Bone attachments (weapons, nested characters) need the skeleton and are left out. Includes hidden attachments,
 * see {@link isHiddenAttachment}.
 */
export function skinAttachments(doc: CdfDocument): CdfAttachment[] {
  return doc.attachments.filter((it) => (it.type === 'CA_SKIN' || it.type === 'CA_CLOTH') && it.binding)
}

/**
 * The material file of an attachment, empty for none: the path as stored, `.mtl` added when it has no extension
 * (5 of 22k skin attachments). A material that does not exist falls back to the mesh's own material when loaded.
 */
export function attachmentMaterial(attachment: CdfAttachment): string {
  const file = attachment.material.trim()
  if (!file || /\.[^./\\]+$/.test(file)) {
    return file
  }
  return `${file}.mtl`
}

/**
 * The mesh of a `.cloth` file: the first `objects/….skin` or `….cgf` path in its bytes, null for none
 * (nwbt `formats/cloth.TryResolveGeometryReference`)
 */
export function clothMeshReference(bytes: Uint8Array): string | null {
  const text = new TextDecoder('latin1').decode(bytes)
  return /objects[/\\].*?\.(skin|cgf)/i.exec(text)?.[0] ?? null
}
