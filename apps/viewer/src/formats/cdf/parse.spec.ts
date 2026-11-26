import { describe, expect, it } from 'vitest'
import { attachmentMaterial, clothMeshReference, isHiddenAttachment, parseCdf, skinAttachments } from './parse'

const SAMPLE = `<CharacterDefinition>
 <Model File="objects/characters/npc/natural/adiana/adiana.chr" Material="objects/characters/npc/natural/adiana/adiana_mat"/>
 <AttachmentList>
  <Attachment Type="CA_BONE" AName="weapon" Binding="objects/weapons/sword.cgf" BoneName="right_hand_attach" RelRotation="1,0,0,0" RelPosition="0,0,0" Flags="0"/>
  <Attachment Type="CA_SKIN" AName="body" Binding="objects/characters/npc/natural/adiana/adiana_body.skin" Material="objects/characters/npc/natural/adiana/adiana_body_mat.mtl" Flags="0"/>
  <Attachment Type="CA_SKIN" AName="hair" Flags="0"/>
  <Attachment Type="CA_CLOTH" AName="cape" Binding="objects/characters/npc/natural/adiana/adiana_cape.cloth" Material="objects/characters/npc/natural/adiana/hood_mat" Flags="0"/>
  <Attachment Type="CA_CLOTH_COLLISION" AName="hip_collider" BoneName="Hips"/>
 </AttachmentList>
</CharacterDefinition>`

describe('parseCdf', () => {
  it('reads the model and every attachment', () => {
    const doc = parseCdf(SAMPLE)
    expect(doc.model.file).toBe('objects/characters/npc/natural/adiana/adiana.chr')
    expect(doc.attachments.map((it) => it.type)).toEqual([
      'CA_BONE',
      'CA_SKIN',
      'CA_SKIN',
      'CA_CLOTH',
      'CA_CLOTH_COLLISION',
    ])
    expect(doc.attachments[0]).toMatchObject({ name: 'weapon', boneName: 'right_hand_attach' })
    expect(doc.attachments[2]).toMatchObject({ name: 'hair', binding: '', material: '' })
  })

  it('rejects other documents', () => {
    expect(() => parseCdf('<Material/>')).toThrow()
    expect(() => parseCdf('<CharacterDefinition')).toThrow()
  })
})

describe('skinAttachments', () => {
  it('keeps skins and cloth with a mesh', () => {
    expect(skinAttachments(parseCdf(SAMPLE)).map((it) => it.name)).toEqual(['body', 'cape'])
  })
})

describe('isHiddenAttachment', () => {
  it('reads the hide flag (dancingfish.cdf: an outline shell hidden by default)', () => {
    const doc = parseCdf(`<CharacterDefinition>
 <Model File="objects/x/fish_skel.chr"/>
 <AttachmentList>
  <Attachment Type="CA_SKIN" AName="mesh" Binding="objects/x/fish.skin" Flags="0"/>
  <Attachment Type="CA_SKIN" AName="outline" Binding="objects/x/fish.skin" Flags="1"/>
  <Attachment Type="CA_SKIN" AName="other" Binding="objects/x/fish.skin" Flags="6"/>
  <Attachment Type="CA_SKIN" AName="none" Binding="objects/x/fish.skin"/>
 </AttachmentList>
</CharacterDefinition>`)
    expect(doc.attachments.map((it) => it.flags)).toEqual([0, 1, 6, 0])
    expect(doc.attachments.map(isHiddenAttachment)).toEqual([false, true, false, false])
  })
})

describe('attachmentMaterial', () => {
  it('adds .mtl to a path without extension', () => {
    const [body, cape] = skinAttachments(parseCdf(SAMPLE))
    expect(attachmentMaterial(body)).toBe('objects/characters/npc/natural/adiana/adiana_body_mat.mtl')
    expect(attachmentMaterial(cape)).toBe('objects/characters/npc/natural/adiana/hood_mat.mtl')
    expect(attachmentMaterial({ ...body, material: ' ' })).toBe('')
  })
})

describe('clothMeshReference', () => {
  it('finds the mesh path in the binary cloth file', () => {
    const bytes = new Uint8Array([1, 0, 0, ...new TextEncoder().encode('objects/characters/x/cape.skin'), 0, 7])
    expect(clothMeshReference(bytes)).toBe('objects/characters/x/cape.skin')
    expect(clothMeshReference(new Uint8Array([1, 2, 3]))).toBeNull()
  })
})
