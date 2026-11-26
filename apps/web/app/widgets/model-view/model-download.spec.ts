import { composeRequest, downloadName, glbImageUris } from './model-download'

describe('glbImageUris', () => {
  it('lists the external images once, data uris and buffer views left out', () => {
    const uris = glbImageUris({
      asset: {},
      images: [
        { uri: 'objects/a_diff.ktx2' },
        { uri: 'objects/a_ddna.ktx2' },
        { uri: 'objects/a_diff.ktx2' },
        { uri: 'data:image/png;base64,AAAA' },
        { bufferView: 3 },
      ],
    })
    expect(uris).toEqual(['objects/a_diff.ktx2', 'objects/a_ddna.ktx2'])
  })
})

describe('composeRequest', () => {
  it('sends the model, its material, params, skeleton, weapons and the animation names', () => {
    const offset = { position: [0, 0, 1] }
    const request = composeRequest({
      source: { model: 'a.skin', material: 'a.mtl', overcoat: 'coat.mtl', skeleton: 'player_male.chr' },
      params: { DyeColorR: '1,0,0' } as any,
      sockets: [{ name: 'bow', offset, models: [{ url: '/b.cdf.glb', source: { model: 'b.cdf' } }] }],
      animations: ['horse_idle'],
      name: 'Horse',
    })
    expect(request).toEqual({
      model: 'a.skin',
      material: 'a.mtl',
      overcoat: 'coat.mtl',
      params: { DyeColorR: '1,0,0' },
      skeleton: 'player_male.chr',
      parts: [],
      sockets: [{ name: 'bow', offset, models: [{ model: 'b.cdf', material: '' }] }],
      animations: [{ name: 'horse_idle' }],
      name: 'Horse',
    })
  })
})

describe('downloadName', () => {
  it('joins the parts into a file name', () => {
    expect(downloadName('Conquistador Helm', 'Male')).toBe('Conquistador_Helm_Male')
    expect(downloadName('Wolf / Alpha', null)).toBe('Wolf_Alpha')
    expect(downloadName(null, '')).toBe('model')
  })
})
